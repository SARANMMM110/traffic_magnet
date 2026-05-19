import type { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import type { D1Like } from "../audience/audienceRateLimit";
import {
  type AssistantRow,
  type PageContext,
  buildAugmentedSystemPrompt,
  resolveOwnerOpenAIKey,
  streamAssistantChat,
  sseHeaders,
  sseEncode,
} from "./assistantChat";
import { buildAssistantWidgetScript } from "./assistantWidgetRuntime";
import { 
  loadContextMemory, 
  extractAndSaveContext, 
  buildMemoryPromptAdditions 
} from "./assistantContextMemory";

type MochaUser = { id: string };
type Bindings = { DB: D1Like; OPENAI_API_KEY?: string; [key: string]: unknown };

function mapAssistant(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    publicId: row.public_id as string,
    name: row.name as string,
    status: row.status as string,
    assistantType: row.assistant_type as string,
    targetGoal: row.target_goal as string | null,
    personality: row.personality as string | null,
    tone: row.tone as string | null,
    expertiseAreas: row.expertise_areas as string | null,
    instructions: row.instructions as string | null,
    contextData: row.context_data as string | null,
    knowledgeSources: row.knowledge_sources as string | null,
    engagementSettings: row.engagement_settings as string | null,
    captureFlowPublicId: row.capture_flow_public_id as string | null,
    linkedToolId: row.linked_tool_id as number | null,
    linkedProjectId: row.linked_project_id as number | null,
    assetType: row.asset_type as string | null,
    assetKey: row.asset_key as string,
    niche: row.niche as string | null,
    monetizationGoal: row.monetization_goal as string | null,
    theme: row.theme as string,
    widgetPosition: row.widget_position as string,
    totalConversations: row.total_conversations as number,
    totalMessages: row.total_messages as number,
    engagementScore: row.engagement_score as number,
    conversionRate: row.conversion_rate as number,
    leadInfluenceCount: row.lead_influence_count as number,
    lastActiveAt: row.last_active_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function registerAssistantRoutes(app: Hono<{ Bindings: Bindings }>) {
  // Widget script delivery
  app.get("/api/assistant/widget.js", async (c) => {
    const origin = new URL(c.req.url).origin;
    const script = buildAssistantWidgetScript(origin);
    return new Response(script, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  });

  // List all assistants for the user
  app.get("/api/assistants", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const rows = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE user_id = ? ORDER BY updated_at DESC")
      .bind(user.id)
      .all();
    return c.json({ assistants: (rows.results ?? []).map((r: unknown) => mapAssistant(r as Record<string, unknown>)) });
  });

  // Get single assistant
  app.get("/api/assistants/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    const row = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ assistant: mapAssistant(row as Record<string, unknown>) });
  });

  // Create assistant
  app.post("/api/assistants", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const body = await c.req.json().catch(() => ({}));
    const publicId = crypto.randomUUID();
    const now = new Date().toISOString();

    const ins = await (c.env.DB as D1Like)
      .prepare(
        `INSERT INTO ai_assistants (
          user_id, public_id, name, status, assistant_type, target_goal, personality, tone,
          expertise_areas, instructions, context_data, knowledge_sources, engagement_settings,
          capture_flow_public_id, linked_tool_id, linked_project_id, asset_type, asset_key,
          niche, monetization_goal, theme, widget_position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.id,
        publicId,
        body.name || "AI Assistant",
        body.status || "draft",
        body.assistantType || "conversational",
        body.targetGoal || null,
        body.personality || null,
        body.tone || null,
        body.expertiseAreas || null,
        body.instructions || null,
        body.contextData || null,
        body.knowledgeSources ? JSON.stringify(body.knowledgeSources) : "[]",
        body.engagementSettings ? JSON.stringify(body.engagementSettings) : "{}",
        body.captureFlowPublicId || null,
        body.linkedToolId || null,
        body.linkedProjectId || null,
        body.assetType || null,
        body.assetKey || "",
        body.niche || null,
        body.monetizationGoal || null,
        body.theme || "violet",
        body.widgetPosition || "bottom-right",
        now,
        now,
      )
      .run();

    const insertId = ((ins as any).meta?.last_row_id as number) || 0;
    const row = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE id = ?")
      .bind(insertId)
      .first();
    return c.json({ assistant: mapAssistant(row as Record<string, unknown>) });
  });

  // Update assistant
  app.patch("/api/assistants/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json().catch(() => ({}));
    const now = new Date().toISOString();

    const existing = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const e = existing as Record<string, unknown>;

    await (c.env.DB as D1Like)
      .prepare(
        `UPDATE ai_assistants SET
          name = ?, status = ?, assistant_type = ?, target_goal = ?, personality = ?, tone = ?,
          expertise_areas = ?, instructions = ?, context_data = ?, knowledge_sources = ?,
          engagement_settings = ?, capture_flow_public_id = ?, linked_tool_id = ?,
          linked_project_id = ?, asset_type = ?, asset_key = ?, niche = ?, monetization_goal = ?,
          theme = ?, widget_position = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        body.name ?? e.name,
        body.status ?? e.status,
        body.assistantType ?? e.assistant_type,
        body.targetGoal !== undefined ? body.targetGoal : ((e.target_goal as string | null) ?? null),
        body.personality !== undefined ? body.personality : ((e.personality as string | null) ?? null),
        body.tone !== undefined ? body.tone : ((e.tone as string | null) ?? null),
        body.expertiseAreas !== undefined ? body.expertiseAreas : ((e.expertise_areas as string | null) ?? null),
        body.instructions !== undefined ? body.instructions : ((e.instructions as string | null) ?? null),
        body.contextData !== undefined ? body.contextData : ((e.context_data as string | null) ?? null),
        body.knowledgeSources !== undefined ? JSON.stringify(body.knowledgeSources) : (e.knowledge_sources as string | null),
        body.engagementSettings !== undefined ? JSON.stringify(body.engagementSettings) : (e.engagement_settings as string | null),
        body.captureFlowPublicId !== undefined ? body.captureFlowPublicId : ((e.capture_flow_public_id as string | null) ?? null),
        body.linkedToolId !== undefined ? body.linkedToolId : ((e.linked_tool_id as number | null) ?? null),
        body.linkedProjectId !== undefined ? body.linkedProjectId : ((e.linked_project_id as number | null) ?? null),
        body.assetType !== undefined ? body.assetType : ((e.asset_type as string | null) ?? null),
        body.assetKey !== undefined ? body.assetKey : (e.asset_key as string | null),
        body.niche !== undefined ? body.niche : ((e.niche as string | null) ?? null),
        body.monetizationGoal !== undefined ? body.monetizationGoal : ((e.monetization_goal as string | null) ?? null),
        body.theme !== undefined ? body.theme : e.theme,
        body.widgetPosition !== undefined ? body.widgetPosition : e.widget_position,
        now,
        id,
        user.id,
      )
      .run();

    const updated = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE id = ?")
      .bind(id)
      .first();
    return c.json({ assistant: mapAssistant(updated as Record<string, unknown>) });
  });

  // Delete assistant
  app.delete("/api/assistants/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    await (c.env.DB as D1Like)
      .prepare("DELETE FROM ai_assistants WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .run();
    return c.json({ success: true });
  });

  // Pause/activate assistant
  app.post("/api/assistants/:id/pause", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    await (c.env.DB as D1Like)
      .prepare("UPDATE ai_assistants SET status = 'paused', updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(new Date().toISOString(), id, user.id)
      .run();
    return c.json({ success: true });
  });

  app.post("/api/assistants/:id/activate", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    await (c.env.DB as D1Like)
      .prepare("UPDATE ai_assistants SET status = 'active', updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(new Date().toISOString(), id, user.id)
      .run();
    return c.json({ success: true });
  });

  // Duplicate assistant
  app.post("/api/assistants/:id/duplicate", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = parseInt(c.req.param("id"));
    const original = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!original) return c.json({ error: "Not found" }, 404);

    const o = original as Record<string, unknown>;
    const publicId = crypto.randomUUID();
    const now = new Date().toISOString();

    const ins = await (c.env.DB as D1Like)
      .prepare(
        `INSERT INTO ai_assistants (
          user_id, public_id, name, status, assistant_type, target_goal, personality, tone,
          expertise_areas, instructions, context_data, knowledge_sources, engagement_settings,
          capture_flow_public_id, linked_tool_id, linked_project_id, asset_type, asset_key,
          niche, monetization_goal, theme, widget_position, created_at, updated_at
        ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.id,
        publicId,
        `${o.name} (copy)`,
        (o.assistant_type as string | null) ?? "conversational",
        (o.target_goal as string | null) ?? null,
        (o.personality as string | null) ?? null,
        (o.tone as string | null) ?? null,
        (o.expertise_areas as string | null) ?? null,
        (o.instructions as string | null) ?? null,
        (o.context_data as string | null) ?? null,
        (o.knowledge_sources as string | null) ?? null,
        (o.engagement_settings as string | null) ?? null,
        (o.capture_flow_public_id as string | null) ?? null,
        (o.linked_tool_id as number | null) ?? null,
        (o.linked_project_id as number | null) ?? null,
        (o.asset_type as string | null) ?? null,
        (o.asset_key as string | null) ?? "",
        (o.niche as string | null) ?? null,
        (o.monetization_goal as string | null) ?? null,
        (o.theme as string | null) ?? null,
        (o.widget_position as string | null) ?? null,
        now,
        now,
      )
      .run();

    const insertId = ((ins as any).meta?.last_row_id as number) || 0;
    const row = await (c.env.DB as D1Like)
      .prepare("SELECT * FROM ai_assistants WHERE id = ?")
      .bind(insertId)
      .first();
    return c.json({ assistant: mapAssistant(row as Record<string, unknown>) });
  });

  // Generate AI context for assistant
  app.post("/api/assistants/generate-context", authMiddleware, async (c) => {
    try {
      const user = c.get("user") as MochaUser;
      const body = await c.req.json().catch(() => ({}));
      const { toolId, projectId, assetType, niche, monetizationGoal, toolName } = body;
      const d1 = c.env.DB as D1Like;

      const context: Record<string, unknown> = {};
      let blueprint: Record<string, unknown> | null = null;

    if (toolId) {
      const tool = await d1
        .prepare("SELECT name, category, blueprint FROM tools WHERE id = ?")
        .bind(toolId)
        .first();
      if (tool) {
        const t = tool as Record<string, unknown>;
        context.toolName = t.name;
        context.toolCategory = t.category;
        if (t.blueprint) {
          try {
            blueprint = JSON.parse(t.blueprint as string);
            if (blueprint) {
              context.purpose = blueprint.purpose;
              context.keywords = blueprint.target_keywords;
            }
          } catch {
            /* ignore */
          }
        }
      }
    }

    if (projectId) {
      const project = await d1
        .prepare("SELECT name, niche, goal FROM projects WHERE id = ?")
        .bind(projectId)
        .first();
      if (project) {
        const p = project as Record<string, unknown>;
        context.projectName = p.name;
        context.niche = p.niche;
        context.goal = p.goal;
      }
    }

    context.assetType = assetType || "tool";

    // Generate AI-powered expertise and instructions
    const userRow = await d1.prepare("SELECT openai_key, anthropic_key FROM api_keys WHERE user_id = ?").bind(user.id).first();
    const hasOpenAI = userRow && (userRow as Record<string, unknown>).openai_key;
    const hasAnthropic = userRow && (userRow as Record<string, unknown>).anthropic_key;

    if (hasOpenAI || hasAnthropic) {
      const prompt = `Generate AI assistant context for a ${context.assetType || 'tool'} in the ${niche || context.niche || 'business'} niche.

Tool: ${toolName || context.toolName || 'traffic asset'}
Category: ${context.toolCategory || 'general'}
Purpose: ${(blueprint && blueprint.purpose) || context.purpose || 'help users achieve their goals'}
Goal: ${monetizationGoal || context.goal || 'engage and convert visitors'}

Generate:
1. Expertise areas (comma-separated, 3-5 areas)
2. Special instructions (2-3 sentences on how the assistant should behave)
3. Engagement settings (JSON with leadCaptureEnabled, showPricingCta, ctaLabel)

Return as JSON: {"expertiseAreas": "...", "instructions": "...", "engagementSettings": {...}}`;

      try {
        let generated = "";
        if (hasOpenAI) {
          const apiKey = (userRow as Record<string, unknown>).openai_key as string;
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
            }),
          });
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          generated = data.choices?.[0]?.message?.content || "";
        } else if (hasAnthropic) {
          const apiKey = (userRow as Record<string, unknown>).anthropic_key as string;
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 1024,
              messages: [{ role: "user", content: prompt }],
            }),
          });
          const data = (await res.json()) as { content?: Array<{ text?: string }> };
          generated = data.content?.[0]?.text || "";
        }

        const jsonMatch = generated.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          context.expertiseAreas = parsed.expertiseAreas || "";
          context.instructions = parsed.instructions || "";
          context.engagementSettings = parsed.engagementSettings || {};
        }
      } catch (e) {
        console.error("AI generation failed:", e);
      }
    }

      return c.json({ context });
    } catch (error) {
      console.error("Generate context error:", error);
      return c.json(
        { error: "Failed to generate context", details: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });

  // Deploy assistant
  app.post("/api/assistants/:id/deploy", authMiddleware, async (c) => {
    try {
      const user = c.get("user") as MochaUser;
      const id = parseInt(c.req.param("id"));
      const d1 = c.env.DB as D1Like;
      const body = await c.req.json().catch(() => ({}));

      const assistant = await d1
        .prepare("SELECT * FROM ai_assistants WHERE id = ? AND user_id = ?")
        .bind(id, user.id)
        .first();
      if (!assistant) return c.json({ error: "Assistant not found" }, 404);

      const now = new Date().toISOString();
      
      const deploymentConfig = typeof body.config === "object" ? JSON.stringify(body.config) : "{}";
      await d1
        .prepare(
          `INSERT INTO assistant_deployments (
          assistant_id, deployment_target, asset_type, asset_key, config_json, status, deployed_at, created_at
        ) VALUES (?,?,?,?,?,?,?,?)`
        )
        .bind(
          id,
          body.deploymentType || "widget",
          body.assetType || null,
          body.assetKey || "",
          deploymentConfig,
          "active",
          now,
          now
        )
        .run();

      // Only update assistant status after deployment succeeds
      await d1
        .prepare("UPDATE ai_assistants SET status = ?, updated_at = ? WHERE id = ?")
        .bind("active", now, id)
        .run();

      const publicId = (assistant as Record<string, unknown>).public_id as string;
      const widgetUrl = `/api/assistant/widget.js?id=${publicId}`;
      const snippet = `<script src="${widgetUrl}" async></script>`;

      return c.json({ snippet, publicId, widgetUrl });
    } catch (error) {
      console.error("Deploy error:", error);
      return c.json(
        { error: "Failed to deploy assistant", details: error instanceof Error ? error.message : String(error) },
        500
      );
    }
  });

  // Studio overview
  app.get("/api/assistants/studio/overview", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const d1 = c.env.DB as D1Like;

    const assistants = await d1
      .prepare("SELECT * FROM ai_assistants WHERE user_id = ? ORDER BY updated_at DESC")
      .bind(user.id)
      .all();

    const overview = await d1
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(total_conversations) as conversations,
          SUM(total_messages) as messages,
          SUM(lead_influence_count) as leads,
          AVG(engagement_score) as engagement,
          AVG(conversion_rate) as conversion
         FROM ai_assistants WHERE user_id = ?`,
      )
      .bind(user.id)
      .first();

    const activity = await d1
      .prepare(
        `SELECT e.event_type, e.created_at, a.name as assistant_name
         FROM ai_analytics_events e
         JOIN ai_assistants a ON a.id = e.assistant_id
         WHERE a.user_id = ?
         ORDER BY e.id DESC LIMIT 20`,
      )
      .bind(user.id)
      .all();

    const topQuestions = await d1
      .prepare(
        `SELECT m.message_content, COUNT(*) as cnt
         FROM ai_messages m
         JOIN ai_conversations c ON c.id = m.conversation_id
         JOIN ai_assistants a ON a.id = c.assistant_id
         WHERE a.user_id = ? AND m.message_role = 'user' AND LENGTH(m.message_content) > 10
         GROUP BY m.message_content
         ORDER BY cnt DESC LIMIT 10`,
      )
      .bind(user.id)
      .all();

    const o = overview as Record<string, unknown>;

    return c.json({
      assistants: (assistants.results ?? []).map((r: unknown) => mapAssistant(r as Record<string, unknown>)),
      overview: {
        totalAssistants: o?.total ?? 0,
        activeAssistants: o?.active ?? 0,
        totalConversations: o?.conversations ?? 0,
        totalMessages: o?.messages ?? 0,
        leadInfluence: o?.leads ?? 0,
        avgConversionRate: o?.conversion ?? 0,
        engagementRate: o?.engagement ?? 0,
      },
      recentActivity: activity.results ?? [],
      topQuestions: topQuestions.results ?? [],
    });
  });

  // Chat streaming endpoint (public, accessed by widget or authenticated dashboard)
  app.post("/api/assistants/:id/chat", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return c.json({ error: "Message is required" }, 400);

    const d1 = c.env.DB as D1Like;
    let assistant: AssistantRow | null = null;

    // Try by publicId first (for widget use)
    const publicId = typeof body.assistantPublicId === "string" ? body.assistantPublicId.trim() : "";
    if (publicId) {
      assistant = await d1
        .prepare("SELECT * FROM ai_assistants WHERE public_id = ? LIMIT 1")
        .bind(publicId)
        .first<AssistantRow>();
    }

    // Try by assistantId (for authenticated dashboard use)
    if (!assistant) {
      const id = c.req.param("id");
      if (id && !isNaN(parseInt(id))) {
        assistant = await d1
          .prepare("SELECT * FROM ai_assistants WHERE id = ? LIMIT 1")
          .bind(parseInt(id))
          .first<AssistantRow>();
      }
    }

    if (!assistant || assistant.status !== "active") {
      return c.json({ error: "Assistant not available" }, 404);
    }

    const pageCtx: PageContext = {
      currentPage: body.pageContext?.currentPage,
      referringSource: body.pageContext?.referringSource,
      assetKey: body.pageContext?.assetKey || assistant.asset_key,
      niche: body.pageContext?.niche || assistant.niche || undefined,
      calculationResult: body.pageContext?.calculationResult,
      audienceType: body.pageContext?.audienceType,
      monetizationGoal: body.pageContext?.monetizationGoal || assistant.monetization_goal || undefined,
      ctaLabel: body.pageContext?.ctaLabel,
      toolName: body.pageContext?.toolName,
    };

    const history: Array<{ role: "user" | "assistant"; content: string }> =
      Array.isArray(body.history) ? body.history.slice(-6) : [];

    // Build platform context for deep integration
    const platformContext: {
      projectData?: { id: number; name: string; niche: string; goal: string };
      toolData?: { id: number; name: string; category: string; blueprint?: string };
      wordpressSite?: { site_name: string; site_url: string; publishing_access: boolean };
      assistantDeployments?: number;
      activeFlows?: number;
    } = {};

    // Fetch linked project data
    if (assistant.linked_project_id) {
      const project = await d1
        .prepare("SELECT id, name, niche, goal FROM projects WHERE id = ?")
        .bind(assistant.linked_project_id)
        .first();
      if (project) {
        const p = project as Record<string, unknown>;
        platformContext.projectData = {
          id: p.id as number,
          name: (p.name as string) || "",
          niche: (p.niche as string) || "",
          goal: (p.goal as string) || "",
        };
      }
    }

    // Fetch linked tool data
    if (assistant.linked_tool_id) {
      const tool = await d1
        .prepare("SELECT id, name, category, blueprint FROM tools WHERE id = ?")
        .bind(assistant.linked_tool_id)
        .first();
      if (tool) {
        const t = tool as Record<string, unknown>;
        platformContext.toolData = {
          id: t.id as number,
          name: (t.name as string) || "",
          category: (t.category as string) || "",
          blueprint: (t.blueprint as string) || undefined,
        };
      }
    }

    // Fetch WordPress site if connected
    const wpSite = await d1
      .prepare("SELECT site_name, site_url, publishing_access FROM wordpress_sites WHERE user_id = ? LIMIT 1")
      .bind(assistant.user_id)
      .first();
    if (wpSite) {
      const wp = wpSite as Record<string, unknown>;
      platformContext.wordpressSite = {
        site_name: (wp.site_name as string) || "",
        site_url: (wp.site_url as string) || "",
        publishing_access: (wp.publishing_access as number) === 1,
      };
    }

    // Count assistant deployments
    const deployments = await d1
      .prepare("SELECT COUNT(*) as cnt FROM assistant_deployments WHERE assistant_id = ? AND status = 'active'")
      .bind(assistant.id)
      .first();
    platformContext.assistantDeployments = ((deployments as Record<string, unknown>)?.cnt as number) || 0;

    // Count active audience flows
    const flows = await d1
      .prepare("SELECT COUNT(*) as cnt FROM capture_flows WHERE user_id = ? AND is_active = 1")
      .bind(assistant.user_id)
      .first();
    platformContext.activeFlows = ((flows as Record<string, unknown>)?.cnt as number) || 0;

    // Load context memory from previous interactions
    const visitorSessionId = typeof body.visitorSessionId === "string" ? body.visitorSessionId : undefined;
    const contextMemory = await loadContextMemory(d1, assistant.id, assistant.user_id, visitorSessionId);
    
    // Extract and save context from current message
    await extractAndSaveContext(d1, assistant.id, assistant.user_id, message, visitorSessionId);

    // Build system prompt with all context layers
    let systemPrompt = buildAugmentedSystemPrompt(assistant, pageCtx, history, platformContext);
    
    // Add memory-based context
    const memoryAdditions = buildMemoryPromptAdditions(contextMemory);
    if (memoryAdditions) {
      systemPrompt += memoryAdditions;
    }

    try {
      const apiKey = await resolveOwnerOpenAIKey(d1, assistant.user_id, c.env.OPENAI_API_KEY);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            await streamAssistantChat({
              apiKey,
              systemPrompt,
              messages: [...history, { role: "user", content: message }],
              onToken: (token) => {
                controller.enqueue(encoder.encode(sseEncode("token", { token })));
              },
            });
            controller.enqueue(encoder.encode(sseEncode("done", {})));
            controller.close();
          } catch (e) {
            controller.enqueue(
              encoder.encode(
                sseEncode("error", { message: e instanceof Error ? e.message : "Chat failed" }),
              ),
            );
            controller.close();
          }
        },
      });

      return new Response(stream, { headers: sseHeaders() });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : "Failed to start chat" }, 500);
    }
  });
}
