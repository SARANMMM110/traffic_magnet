import type { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import type { D1Like } from "../audience/audienceRateLimit";
import { audienceRateLimitHit } from "../audience/audienceRateLimit";
import { injectGrowthStackIntoHtml } from "./growthPipelineInject";

type MochaUser = { id: string };
type Bindings = { DB: D1Like; [key: string]: unknown };

const DEPLOYMENT_STATES = new Set([
  "idle",
  "deploying",
  "published",
  "syncing",
  "tracking",
  "optimizing",
  "error",
  "retrying",
]);
const ASSET_TYPES = new Set(["tool", "landing", "content-wrapper", "seo", "widget", "standalone"]);
const PUBLISH_TARGETS = new Set(["wordpress", "export", "embed", "seo", "custom"]);

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function jsonCors(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function mapDeployment(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    publicId: row.public_id as string,
    name: row.name as string,
    status: row.status as string,
    deploymentState: row.deployment_state as string,
    assetType: row.asset_type as string,
    assetKey: row.asset_key as string,
    linkedToolId: row.linked_tool_id as number | null,
    linkedCampaignId: row.linked_campaign_id as number | null,
    audienceFlowPublicId: row.audience_flow_public_id as string | null,
    audienceCaptureMethod: row.audience_capture_method as string | null,
    assistantPublicId: row.assistant_public_id as string | null,
    assistantId: row.assistant_id as number | null,
    wordpressSiteId: row.wordpress_site_id as number | null,
    publishTarget: row.publish_target as string,
    analyticsEnabled: Boolean(row.analytics_enabled),
    conversionTrackingEnabled: Boolean(row.conversion_tracking_enabled),
    optimizationEnabled: Boolean(row.optimization_enabled),
    config: parseJson(row.config_json as string, {}),
    performance: parseJson(row.performance_json as string, {}),
    lastDeployedAt: row.last_deployed_at as string | null,
    lastError: row.last_error as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function recordPipelineEvent(
  d1: D1Like,
  userId: string,
  eventType: string,
  opts: {
    deploymentId?: number | null;
    deploymentPublicId?: string | null;
    assetKey?: string;
    category?: string;
    meta?: Record<string, unknown>;
  },
) {
  await d1
    .prepare(
      `INSERT INTO growth_pipeline_events (user_id, deployment_id, deployment_public_id, event_type, event_category, asset_key, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      userId,
      opts.deploymentId ?? null,
      opts.deploymentPublicId ?? null,
      eventType,
      opts.category ?? null,
      opts.assetKey ?? "",
      opts.meta ? JSON.stringify(opts.meta) : null,
    )
    .run();
}

export function registerGrowthPipelineRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.options("/api/growth-pipeline/public/*", () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
  );

  app.post("/api/growth-pipeline/public/events", async (c) => {
    const d1 = c.env.DB as D1Like;
    const body = await c.req.json().catch(() => ({}));
    const publicId = typeof body.deploymentPublicId === "string" ? body.deploymentPublicId.trim() : "";
    const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
    if (!publicId || !eventType) return jsonCors({ error: "Invalid payload" }, 400);

    const ip = c.req.header("CF-Connecting-IP") || "";
    const rl = await audienceRateLimitHit(d1, "gp", `${publicId}:${ip}`, { windowMinutes: 1, maxHits: 120 });
    if (!rl.ok) return jsonCors({ error: "rate_limited" }, 429);

    try {
      const dep = await d1
        .prepare("SELECT id, user_id, asset_key, status FROM growth_deployments WHERE public_id = ? LIMIT 1")
        .bind(publicId)
        .first<{ id: number; user_id: string; asset_key: string; status: string }>();
      if (!dep || dep.status === "paused") return jsonCors({ error: "not_found" }, 404);

      await recordPipelineEvent(d1, dep.user_id, eventType, {
        deploymentId: dep.id,
        deploymentPublicId: publicId,
        assetKey: (body.assetKey as string) || dep.asset_key,
        category: "runtime",
        meta: typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : undefined,
      });

      if (eventType === "lead_captured" || eventType === "conversion") {
        const perf = await d1
          .prepare("SELECT performance_json FROM growth_deployments WHERE id = ?")
          .bind(dep.id)
          .first<{ performance_json: string }>();
        const p = parseJson<Record<string, number>>(perf?.performance_json, {});
        const key = eventType === "lead_captured" ? "leads" : "conversions";
        p[key] = (p[key] || 0) + 1;
        await d1
          .prepare("UPDATE growth_deployments SET performance_json = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(JSON.stringify(p), dep.id)
          .run();
      }

      return jsonCors({ ok: true });
    } catch {
      return jsonCors({ error: "pipeline_unavailable" }, 503);
    }
  });

  app.get("/api/growth-pipeline/overview", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const d1 = c.env.DB as D1Like;
    try {
      const deployments = await d1
        .prepare(
          `SELECT * FROM growth_deployments WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`,
        )
        .bind(user.id)
        .all();

      const totals = await d1
        .prepare(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'live' OR deployment_state IN ('published','tracking','optimizing') THEN 1 ELSE 0 END) as live,
            SUM(CASE WHEN deployment_state = 'deploying' OR deployment_state = 'syncing' THEN 1 ELSE 0 END) as active_runs
           FROM growth_deployments WHERE user_id = ?`,
        )
        .bind(user.id)
        .first<{ total: number; live: number; active_runs: number }>();

      const eventCount = await d1
        .prepare(`SELECT COUNT(*) as c FROM growth_pipeline_events WHERE user_id = ? AND created_at > datetime('now', '-30 day')`)
        .bind(user.id)
        .first<{ c: number }>();

      const assistantEng = await d1
        .prepare(
          `SELECT COUNT(*) as c FROM ai_analytics_events e
           JOIN ai_assistants a ON a.id = e.assistant_id WHERE a.user_id = ? AND e.created_at > datetime('now', '-30 day')`,
        )
        .bind(user.id)
        .first<{ c: number }>()
        .catch(() => ({ c: 0 }));

      const leads = await d1
        .prepare(
          `SELECT COUNT(*) as c FROM subscribers WHERE owner_user_id = ? AND created_at > datetime('now', '-30 day')`,
        )
        .bind(user.id)
        .first<{ c: number }>()
        .catch(() => ({ c: 0 }));

      const wpSites = await d1
        .prepare(`SELECT COUNT(*) as c FROM wordpress_sites WHERE user_id = ?`)
        .bind(user.id)
        .first<{ c: number }>()
        .catch(() => ({ c: 0 }));

      const feed = await d1
        .prepare(
          `SELECT e.id, e.event_type, e.created_at, e.asset_key, e.meta_json, d.name as deployment_name
           FROM growth_pipeline_events e
           LEFT JOIN growth_deployments d ON d.id = e.deployment_id
           WHERE e.user_id = ?
           ORDER BY e.id DESC LIMIT 20`,
        )
        .bind(user.id)
        .all();

      const list = (deployments.results ?? []).map((r: unknown) => mapDeployment(r as Record<string, unknown>));
      const queue = list
        .filter((d: { deploymentState: string }) => ["deploying", "syncing", "retrying"].includes(d.deploymentState))
        .map((d: { id: number; name: string; deploymentState: string; updatedAt: string }) => ({
          deploymentId: d.id,
          name: d.name,
          state: d.deploymentState,
          updatedAt: d.updatedAt,
        }));

      const perfAgg = list.reduce(
        (acc: { leads: number; views: number }, d: { performance: unknown }) => {
          const p = d.performance as Record<string, number>;
          acc.leads += p.leads || 0;
          acc.views += p.page_views || 0;
          return acc;
        },
        { leads: 0, views: 0 },
      );

      return c.json({
        overview: {
          totalDeployments: totals?.total ?? 0,
          liveDeployments: totals?.live ?? 0,
          activeRuns: totals?.active_runs ?? 0,
          totalEvents: eventCount?.c ?? 0,
          leadsInfluenced: leads?.c ?? perfAgg.leads,
          assistantEngagements: assistantEng?.c ?? 0,
          publishingTargets: wpSites?.c ?? 0,
          conversionRate: perfAgg.views > 0 ? (perfAgg.leads / perfAgg.views) * 100 : 0,
        },
        deployments: list,
        operationsFeed: (feed.results ?? []).map((e: Record<string, unknown>) => ({
          id: e.id,
          eventType: e.event_type,
          createdAt: e.created_at,
          assetKey: e.asset_key,
          deploymentName: e.deployment_name,
          meta: parseJson(e.meta_json as string, {}),
        })),
        queue,
      });
    } catch (e) {
      console.error("growth overview:", e);
      return c.json({
        overview: {},
        deployments: [],
        operationsFeed: [],
        error: "Apply migration 0004_growth_pipeline.sql",
      });
    }
  });

  app.get("/api/growth-pipeline/deployments", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const rows = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM growth_deployments WHERE user_id = ? ORDER BY updated_at DESC")
      .bind(user.id)
      .all();
    return c.json({ deployments: (rows.results ?? []).map((r: unknown) => mapDeployment(r as Record<string, unknown>)) });
  });

  app.post("/api/growth-pipeline/deployments", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const body = await c.req.json().catch(() => ({}));
    const publicId = crypto.randomUUID();
    const now = new Date().toISOString();
    const assetType = ASSET_TYPES.has(body.assetType) ? body.assetType : "content-wrapper";

    const ins = await (c.env.DB as D1Like)
      .prepare(
        `INSERT INTO growth_deployments (
          user_id, public_id, name, status, deployment_state, asset_type, asset_key,
          linked_tool_id, linked_campaign_id, audience_flow_public_id, audience_capture_method,
          assistant_public_id, assistant_id, wordpress_site_id, publish_target,
          analytics_enabled, conversion_tracking_enabled, optimization_enabled, config_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'idle', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.id,
        publicId,
        (body.name as string)?.slice(0, 200) || "Growth deployment",
        body.status === "live" ? "live" : "draft",
        assetType,
        body.assetKey || "",
        body.linkedToolId ?? null,
        body.linkedCampaignId ?? null,
        body.audienceFlowPublicId || null,
        body.audienceCaptureMethod || null,
        body.assistantPublicId || null,
        body.assistantId ?? null,
        body.wordpressSiteId ?? null,
        PUBLISH_TARGETS.has(body.publishTarget) ? body.publishTarget : "export",
        body.analyticsEnabled !== false ? 1 : 0,
        body.conversionTrackingEnabled !== false ? 1 : 0,
        body.optimizationEnabled !== false ? 1 : 0,
        JSON.stringify(body.config || {}),
        now,
        now,
      )
      .run();

    const insertId = ((ins as any).meta?.last_row_id as number) || 0;
    await recordPipelineEvent(c.env.DB as D1Like, user.id, "deployment_created", {
      deploymentId: insertId,
      deploymentPublicId: publicId,
      assetKey: body.assetKey || "",
    });

    const row = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM growth_deployments WHERE id = ?")
      .bind(insertId)
      .first();
    return c.json({ deployment: mapDeployment(row as Record<string, unknown>) });
  });

  app.patch("/api/growth-pipeline/deployments/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json().catch(() => ({}));
    const row = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM growth_deployments WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!row) return c.json({ error: "Not found" }, 404);
    const r = row as Record<string, unknown>;
    const now = new Date().toISOString();

    await (c.env.DB as D1Like)
      .prepare(
        `UPDATE growth_deployments SET
          name = ?, status = ?, deployment_state = ?, asset_type = ?, asset_key = ?,
          linked_tool_id = ?, linked_campaign_id = ?, audience_flow_public_id = ?,
          audience_capture_method = ?, assistant_public_id = ?, assistant_id = ?,
          wordpress_site_id = ?, publish_target = ?,
          analytics_enabled = ?, conversion_tracking_enabled = ?, optimization_enabled = ?,
          config_json = ?, html_snapshot = COALESCE(?, html_snapshot), updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        body.name ?? r.name,
        body.status ?? r.status,
        DEPLOYMENT_STATES.has(body.deploymentState) ? body.deploymentState : r.deployment_state,
        body.assetType ?? r.asset_type,
        body.assetKey ?? r.asset_key,
        body.linkedToolId !== undefined ? body.linkedToolId : ((r.linked_tool_id as number | null) ?? null),
        body.linkedCampaignId !== undefined ? body.linkedCampaignId : ((r.linked_campaign_id as number | null) ?? null),
        body.audienceFlowPublicId !== undefined ? body.audienceFlowPublicId : ((r.audience_flow_public_id as string | null) ?? null),
        body.audienceCaptureMethod !== undefined ? body.audienceCaptureMethod : ((r.audience_capture_method as string | null) ?? null),
        body.assistantPublicId !== undefined ? body.assistantPublicId : ((r.assistant_public_id as string | null) ?? null),
        body.assistantId !== undefined ? body.assistantId : ((r.assistant_id as number | null) ?? null),
        body.wordpressSiteId !== undefined ? body.wordpressSiteId : ((r.wordpress_site_id as number | null) ?? null),
        body.publishTarget ?? (r.publish_target as string | null),
        body.analyticsEnabled !== undefined ? (body.analyticsEnabled ? 1 : 0) : (r.analytics_enabled as number | null),
        body.conversionTrackingEnabled !== undefined
          ? body.conversionTrackingEnabled
            ? 1
            : 0
          : (r.conversion_tracking_enabled as number | null),
        body.optimizationEnabled !== undefined ? (body.optimizationEnabled ? 1 : 0) : (r.optimization_enabled as number | null),
        JSON.stringify(body.config !== undefined ? body.config : parseJson(r.config_json as string, {})),
        body.html ?? null,
        now,
        id,
        user.id,
      )
      .run();

    const updated = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM growth_deployments WHERE id = ?")
      .bind(id)
      .first();
    return c.json({ deployment: mapDeployment(updated as Record<string, unknown>) });
  });

  app.delete("/api/growth-pipeline/deployments/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    await (c.env.DB as D1Like).prepare("DELETE FROM growth_deployments WHERE id = ? AND user_id = ?").bind(id, user.id).run();
    return c.json({ success: true });
  });

  app.post("/api/growth-pipeline/inject-bundle", authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const html = typeof body.html === "string" ? body.html : "";
    if (!html) return c.json({ error: "html required" }, 400);
    const origin = new URL(c.req.url).origin;
    const injected = injectGrowthStackIntoHtml(html, {
      origin,
      assetKey: body.assetKey || "asset",
      audienceFlowPublicId: body.audienceFlowPublicId || null,
      assistantPublicId: body.assistantPublicId || null,
      deploymentPublicId: body.deploymentPublicId || null,
      analyticsEnabled: body.analyticsEnabled !== false,
    });
    return c.json({ html: injected });
  });

  app.post("/api/growth-pipeline/deployments/:id/execute", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json().catch(() => ({}));
    const d1 = c.env.DB as D1Like;
    const origin = new URL(c.req.url).origin;

    const row = await d1.prepare("SELECT * FROM growth_deployments WHERE id = ? AND user_id = ?").bind(id, user.id).first();
    if (!row) return c.json({ error: "Not found" }, 404);
    const dep = row as Record<string, unknown>;
    const publicId = dep.public_id as string;

    const steps: Array<{ step: string; status: string; message: string }> = [];
    const advance = (step: string, status: string, message: string) => {
      steps.push({ step, status, message });
    };

    await d1
      .prepare("UPDATE growth_deployments SET deployment_state = 'deploying', last_error = NULL, updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), id)
      .run();

    advance("asset", "complete", `Asset type: ${dep.asset_type}`);

    let html =
      (typeof body.html === "string" && body.html) ||
      (dep.html_snapshot as string) ||
      "<!DOCTYPE html><html><head><title>Growth Asset</title></head><body><main><h1>Deployed via Growth Pipeline</h1></body></html>";

    if (dep.audience_flow_public_id) {
      advance("audience", "complete", "Audience capture widget wired");
    } else {
      advance("audience", "skipped", "No audience flow attached");
    }

    if (dep.assistant_public_id) {
      advance("assistant", "complete", "AI assistant runtime attached");
    } else {
      advance("assistant", "skipped", "No assistant attached");
    }

    const cfg = parseJson<Record<string, unknown>>(dep.config_json as string, {});
    html = injectGrowthStackIntoHtml(html, {
      origin,
      assetKey: (dep.asset_key as string) || "asset",
      audienceFlowPublicId: dep.audience_flow_public_id as string | null,
      assistantPublicId: dep.assistant_public_id as string | null,
      assistantTheme: (cfg.assistantTheme as string) || "violet",
      assistantPosition: (cfg.widgetPosition as string) || "bottom-right",
      analyticsEnabled: Boolean(dep.analytics_enabled),
      deploymentPublicId: publicId,
    });

    advance("publish", "complete", `Target: ${dep.publish_target}`);

    advance("analytics", "complete", "Conversion + engagement tracking active");

    const nextState =
      dep.publish_target === "wordpress" ? "syncing" : "tracking";

    await d1
      .prepare(
        `UPDATE growth_deployments SET
          deployment_state = ?, status = 'live', html_snapshot = ?, last_deployed_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(nextState, html, new Date().toISOString(), new Date().toISOString(), id)
      .run();

    await d1
      .prepare(
        `INSERT INTO growth_deployment_runs (deployment_id, run_status, current_step, steps_json, output_html, completed_at)
         VALUES (?, 'completed', 'analytics', ?, ?, datetime('now'))`,
      )
      .bind(id, JSON.stringify(steps), html)
      .run();

    await recordPipelineEvent(d1, user.id, "deployment_executed", {
      deploymentId: id,
      deploymentPublicId: publicId,
      assetKey: dep.asset_key as string,
      meta: { publishTarget: dep.publish_target, steps: steps.length },
    });

    const updated = await d1.prepare("SELECT * FROM growth_deployments WHERE id = ?").bind(id).first();

    return c.json({
      deployment: mapDeployment(updated as Record<string, unknown>),
      html,
      steps,
      handoff: {
        publishTarget: dep.publish_target,
        wordpressSiteId: dep.wordpress_site_id,
        audienceFlowPublicId: dep.audience_flow_public_id,
        assistantPublicId: dep.assistant_public_id,
        growthDeploymentPublicId: publicId,
        assetKey: dep.asset_key,
      },
    });
  });
}
