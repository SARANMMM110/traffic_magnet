import type { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { audienceSignJwt, audienceVerifyJwt, getAudienceUnlockSecret } from "./audienceJwt";
import { audienceRateLimitHit, hashSessionClient, type D1Like } from "./audienceRateLimit";

type MochaUser = { id: string };
type Bindings = { DB: D1Like; [key: string]: unknown };

const EVENT_TYPES = new Set([
  "page_view",
  "gate_opened",
  "unlock_attempted",
  "unlock_completed",
  "google_sign_in_success",
  "email_captured",
  "cta_clicked",
  "asset_published",
  "subscriber_converted",
]);

const FLOW_STATUSES = new Set(["draft", "live", "paused"]);

function jsonCors(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeReturnUrl(u: string): boolean {
  try {
    const url = new URL(u);
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return true;
    return false;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordEvent(d1: D1Like, ownerUserId: number, eventType: string, opts: {
  captureFlowId?: number | null;
  subscriberId?: number | null;
  assetKey?: string;
  wordpressSiteId?: number | null;
  meta?: Record<string, unknown>;
  sessionHash?: string | null;
}) {
  await d1
    .prepare(
      `INSERT INTO capture_events (owner_user_id, event_type, capture_flow_id, subscriber_id, asset_key, wordpress_site_id, meta_json, session_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      ownerUserId,
      eventType,
      opts.captureFlowId ?? null,
      opts.subscriberId ?? null,
      opts.assetKey ?? "",
      opts.wordpressSiteId ?? null,
      opts.meta ? JSON.stringify(opts.meta) : null,
      opts.sessionHash ?? null,
    )
    .run();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFlowByPublicId(d1: D1Like, publicId: string) {
  const row = await d1
    .prepare(
      `SELECT f.id, f.user_id, f.name, f.status, f.asset_type, f.capture_method, f.config_json, f.public_id, f.created_at, f.updated_at
       FROM capture_flows f WHERE f.public_id = ? LIMIT 1`,
    )
    .bind(publicId)
    .first();
  return row as Record<string, unknown> | null;
}

function mapFlowRow(row: Record<string, unknown>) {
  const cfg = parseJson<Record<string, unknown>>(String(row.config_json || "{}"), {});
  return {
    id: row.id as number,
    name: row.name as string,
    status: row.status as string,
    assetType: row.asset_type as string,
    captureMethod: row.capture_method as string,
    config: cfg,
    publicId: row.public_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function registerAudienceEngineRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.options("/api/audience/public/*", () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
  );

  app.get("/api/audience/public/flows/:publicId", async (c) => {
    const publicId = c.req.param("publicId");
    const d1 = c.env.DB as D1Like;
    try {
      const row = await getFlowByPublicId(d1, publicId);
      if (!row || row.status !== "live") {
        return jsonCors({ error: "Flow not found" }, 404);
      }
      const cfg = parseJson<Record<string, unknown>>(String(row.config_json || "{}"), {});
      const origin = new URL(c.req.url).origin;
      return jsonCors({
        publicId: row.public_id,
        captureMethod: row.capture_method,
        assetType: row.asset_type,
        headline: typeof cfg.headline === "string" ? cfg.headline : "Unlock",
        ctaText: typeof cfg.ctaText === "string" ? cfg.ctaText : "Continue",
        unlockPercent: typeof cfg.unlockPercent === "number" ? cfg.unlockPercent : 72,
        blurIntensity: typeof cfg.blurIntensity === "number" ? cfg.blurIntensity : 40,
        triggerDelayMs: typeof cfg.triggerDelayMs === "number" ? cfg.triggerDelayMs : 1200,
        conversionGoal: typeof cfg.conversionGoal === "string" ? cfg.conversionGoal : "verified-leads",
        widgetLayout: typeof cfg.widgetLayout === "string" ? cfg.widgetLayout : "fullscreen",
        widgetSrc: `${origin}/api/audience/widget.js`,
      });
    } catch {
      return jsonCors({ error: "Audience engine database not ready" }, 503);
    }
  });

  app.post("/api/audience/public/events", async (c) => {
    const d1 = c.env.DB as D1Like;
    const body = await c.req.json().catch(() => ({}));
    const publicFlowId = typeof body.publicFlowId === "string" ? body.publicFlowId.trim() : "";
    const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
    const assetKey = typeof body.assetKey === "string" ? body.assetKey.slice(0, 512) : "";
    const meta = typeof body.meta === "object" && body.meta ? (body.meta as Record<string, unknown>) : undefined;
    if (!publicFlowId || !EVENT_TYPES.has(eventType)) {
      return jsonCors({ error: "Invalid payload" }, 400);
    }
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    const rl = await audienceRateLimitHit(d1, "evt", `${publicFlowId}:${ip || "na"}`, { windowMinutes: 1, maxHits: 120 });
    if (!rl.ok) return jsonCors({ error: "rate_limited" }, 429);

    try {
      const row = await getFlowByPublicId(d1, publicFlowId);
      if (!row || row.status !== "live") return jsonCors({ error: "Flow not found" }, 404);
      const ownerId = row.user_id as number;
      const flowId = row.id as number;
      const sessionHash = hashSessionClient(ip, c.req.header("user-agent"));
      await recordEvent(d1, ownerId, eventType, {
        captureFlowId: flowId,
        assetKey,
        meta,
        sessionHash,
      });
      return jsonCors({ ok: true });
    } catch (e) {
      console.error("audience event:", e);
      return jsonCors({ error: "server" }, 500);
    }
  });

  app.post("/api/audience/public/email-capture", async (c) => {
    const d1 = c.env.DB as D1Like;
    const body = await c.req.json().catch(() => ({}));
    const publicFlowId = typeof body.publicFlowId === "string" ? body.publicFlowId.trim() : "";
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const assetKey = typeof body.assetKey === "string" ? body.assetKey.slice(0, 512) : "";
    const trafficSource = typeof body.trafficSource === "string" ? body.trafficSource.slice(0, 200) : "";
    const honeypot = typeof body.website === "string" ? body.website : "";
    const wordpressSiteId = typeof body.wordpressSiteId === "number" ? body.wordpressSiteId : null;

    if (honeypot) return jsonCors({ ok: true });
    if (!publicFlowId || !emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return jsonCors({ error: "Invalid email" }, 400);
    }
    const email = emailRaw.toLowerCase();
    const ip = c.req.header("CF-Connecting-IP") || "";
    const rl = await audienceRateLimitHit(d1, "email", `${publicFlowId}:${ip || "na"}`, { windowMinutes: 60, maxHits: 20 });
    if (!rl.ok) return jsonCors({ error: "rate_limited" }, 429);

    let secret: string;
    try {
      secret = getAudienceUnlockSecret(c.env as { AUDIENCE_UNLOCK_SECRET?: string; MOCHA_USERS_SERVICE_API_KEY?: string });
    } catch {
      return jsonCors({ error: "Audience unlock not configured" }, 503);
    }

    try {
      const row = await getFlowByPublicId(d1, publicFlowId);
      if (!row || row.status !== "live") return jsonCors({ error: "Flow not found" }, 404);
      if (row.capture_method !== "email" && row.capture_method !== "banner" && row.capture_method !== "partial" && row.capture_method !== "timed" && row.capture_method !== "scroll" && row.capture_method !== "exit") {
        return jsonCors({ error: "Flow does not accept email capture" }, 400);
      }
      const ownerId = row.user_id as number;
      const flowId = row.id as number;
      const now = new Date().toISOString();

      await d1
        .prepare(
          `INSERT INTO subscribers (owner_user_id, email, name, provider, source_asset_type, source_asset_key, capture_flow_id, traffic_source, wordpress_site_id, engagement_score, conversion_time, updated_at)
           VALUES (?, ?, ?, 'email', ?, ?, ?, ?, ?, 5, ?, ?)
           ON CONFLICT(owner_user_id, email) DO UPDATE SET
             name = COALESCE(excluded.name, subscribers.name),
             engagement_score = subscribers.engagement_score + 3,
             capture_flow_id = excluded.capture_flow_id,
             source_asset_key = excluded.source_asset_key,
             traffic_source = COALESCE(excluded.traffic_source, subscribers.traffic_source),
             wordpress_site_id = COALESCE(excluded.wordpress_site_id, subscribers.wordpress_site_id),
             updated_at = excluded.updated_at`,
        )
        .bind(
          ownerId,
          email,
          name || null,
          row.asset_type as string,
          assetKey,
          flowId,
          trafficSource || null,
          wordpressSiteId,
          now,
          now,
        )
        .run();

      const sub = await d1
        .prepare("SELECT id FROM subscribers WHERE owner_user_id = ? AND email = ? LIMIT 1")
        .bind(ownerId, email)
        .first<{ id: number }>();

      const subscriberId = sub?.id;
      if (subscriberId) {
        await d1
          .prepare(
            `INSERT INTO subscriber_unlock_history (subscriber_id, capture_flow_id, asset_key, unlock_method, created_at)
             VALUES (?, ?, ?, 'email', datetime('now'))`,
          )
          .bind(subscriberId, flowId, assetKey)
          .run();
        const sessionHash = hashSessionClient(ip, c.req.header("user-agent"));
        await recordEvent(d1, ownerId, "email_captured", {
          captureFlowId: flowId,
          subscriberId,
          assetKey,
          wordpressSiteId,
          sessionHash,
        });
        await recordEvent(d1, ownerId, "unlock_completed", {
          captureFlowId: flowId,
          subscriberId,
          assetKey,
          wordpressSiteId,
          sessionHash,
        });
      }

      const jwt = subscriberId
        ? await audienceSignJwt(secret, { sub: subscriberId, fid: publicFlowId, aid: assetKey || undefined }, 60 * 60 * 24 * 14)
        : null;

      return jsonCors({ ok: true, token: jwt });
    } catch (e) {
      console.error("email capture:", e);
      return jsonCors({ error: "server" }, 500);
    }
  });

  app.post("/api/audience/public/session/verify", async (c) => {
    let secret: string;
    try {
      secret = getAudienceUnlockSecret(c.env as { AUDIENCE_UNLOCK_SECRET?: string; MOCHA_USERS_SERVICE_API_KEY?: string });
    } catch {
      return jsonCors({ ok: false, error: "not_configured" }, 503);
    }
    const body = await c.req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) return jsonCors({ ok: false }, 400);
    const claims = await audienceVerifyJwt(secret, token);
    if (!claims) return jsonCors({ ok: false }, 401);
    return jsonCors({ ok: true, subscriberId: claims.sub, flowPublicId: claims.fid, assetKey: claims.aid ?? null });
  });

  app.get("/api/audience/oauth/google/start", async (c) => {
    const d1 = c.env.DB as D1Like;
    const flow = c.req.query("flow")?.trim() || "";
    const returnUrl = c.req.query("return")?.trim() || "";
    const clientId = String(c.env.AUDIENCE_GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = String(c.env.AUDIENCE_GOOGLE_CLIENT_SECRET || "").trim();
    if (!clientId || !clientSecret) {
      if (safeReturnUrl(returnUrl)) {
        const join = returnUrl.includes("?") ? "&" : "?";
        return c.redirect(`${returnUrl.split("#")[0]}${join}error=audience_oauth_not_configured`);
      }
      return c.text(
        "Google OAuth is not configured (set AUDIENCE_GOOGLE_CLIENT_ID and AUDIENCE_GOOGLE_CLIENT_SECRET).",
        503,
      );
    }
    if (!flow || !safeReturnUrl(returnUrl)) {
      return c.text("Invalid flow or return URL", 400);
    }
    const row = await getFlowByPublicId(d1, flow);
    if (!row || row.status !== "live") return c.text("Flow not found", 404);
    if (row.capture_method !== "google") {
      return c.text("This flow is not configured for Google sign-in", 400);
    }

    const state = crypto.randomUUID().replace(/-/g, "");
    const exp = new Date(Date.now() + 10 * 60_000).toISOString();
    await d1
      .prepare(
        `INSERT INTO audience_oauth_states (state, flow_public_id, return_url, owner_user_id, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(state, flow, returnUrl.slice(0, 2048), row.user_id as number, exp)
      .run();

    const origin = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/audience/oauth/google/callback`;
    const scope = encodeURIComponent("openid email profile");
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${scope}` +
      `&access_type=offline&include_granted_scopes=true&prompt=consent` +
      `&state=${encodeURIComponent(state)}`;
    return c.redirect(url);
  });

  app.get("/api/audience/oauth/google/callback", async (c) => {
    const d1 = c.env.DB as D1Like;
    const code = c.req.query("code") || "";
    const state = c.req.query("state") || "";
    const clientId = String(c.env.AUDIENCE_GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = String(c.env.AUDIENCE_GOOGLE_CLIENT_SECRET || "").trim();
    const origin = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/audience/oauth/google/callback`;

    async function fail(msg: string) {
      return c.text(`OAuth failed: ${msg}`, 400);
    }

    if (!code || !state) return fail("missing code/state");

    const st = await d1
      .prepare("SELECT * FROM audience_oauth_states WHERE state = ? AND expires_at > datetime('now') LIMIT 1")
      .bind(state)
      .first<Record<string, unknown>>();
    if (!st) return fail("invalid state");
    await d1.prepare("DELETE FROM audience_oauth_states WHERE state = ?").bind(state).run();

    const returnUrl = String(st.return_url || "");
    const flowPublicId = String(st.flow_public_id || "");
    const ownerUserId = st.owner_user_id as number;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokenJson = (await tokenRes.json().catch(() => ({}))) as Record<string, unknown>;
    if (!tokenRes.ok || typeof tokenJson.access_token !== "string") {
      console.error("google token error", tokenJson);
      return fail("token exchange");
    }

    const ui = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const gUser = (await ui.json().catch(() => ({}))) as Record<string, unknown>;
    const email = typeof gUser.email === "string" ? gUser.email.toLowerCase().trim() : "";
    const gname = typeof gUser.name === "string" ? gUser.name.slice(0, 200) : "";
    const googleSub = typeof gUser.sub === "string" ? gUser.sub : "";
    if (!email || gUser.email_verified !== true) {
      return fail("unverified email");
    }

    let secret: string;
    try {
      secret = getAudienceUnlockSecret(c.env as { AUDIENCE_UNLOCK_SECRET?: string; MOCHA_USERS_SERVICE_API_KEY?: string });
    } catch {
      return fail("unlock secret");
    }

    const flowRow = await getFlowByPublicId(d1, flowPublicId);
    if (!flowRow || flowRow.status !== "live") return fail("flow");
    const flowId = flowRow.id as number;
    const now = new Date().toISOString();

    await d1
      .prepare(
        `INSERT INTO subscribers (owner_user_id, email, name, provider, google_sub, source_asset_type, source_asset_key, capture_flow_id, engagement_score, conversion_time, updated_at)
         VALUES (?, ?, ?, 'google', ?, ?, '', ?, 20, ?, ?)
         ON CONFLICT(owner_user_id, email) DO UPDATE SET
           name = COALESCE(excluded.name, subscribers.name),
           google_sub = COALESCE(excluded.google_sub, subscribers.google_sub),
           provider = 'google',
           engagement_score = subscribers.engagement_score + 10,
           capture_flow_id = excluded.capture_flow_id,
           updated_at = excluded.updated_at`,
      )
      .bind(ownerUserId, email, gname || null, googleSub || null, flowRow.asset_type as string, flowId, now, now)
      .run();

    const sub = await d1
      .prepare("SELECT id FROM subscribers WHERE owner_user_id = ? AND email = ? LIMIT 1")
      .bind(ownerUserId, email)
      .first<{ id: number }>();
    const subscriberId = sub?.id;
    if (subscriberId) {
      await d1
        .prepare(
          `INSERT INTO subscriber_unlock_history (subscriber_id, capture_flow_id, asset_key, unlock_method, created_at)
           VALUES (?, ?, '', 'google', datetime('now'))`,
        )
        .bind(subscriberId, flowId)
        .run();
      const ip = c.req.header("CF-Connecting-IP") || "";
      const sessionHash = hashSessionClient(ip, c.req.header("user-agent"));
      await recordEvent(d1, ownerUserId, "google_sign_in_success", {
        captureFlowId: flowId,
        subscriberId,
        sessionHash,
      });
      await recordEvent(d1, ownerUserId, "unlock_completed", {
        captureFlowId: flowId,
        subscriberId,
        sessionHash,
      });
    }

    const jwt =
      subscriberId != null
        ? await audienceSignJwt(secret, { sub: subscriberId, fid: flowPublicId }, 60 * 60 * 24 * 14)
        : "";
    try {
      const u = new URL(returnUrl.split("#")[0]);
      u.hash = `magnet_audience_token=${encodeURIComponent(jwt)}`;
      return c.redirect(u.toString());
    } catch {
      return c.text("Invalid return URL", 400);
    }
  });

  registerAudienceWidgetAndAuthRoutes(app);
}

function registerAudienceWidgetAndAuthRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/audience/widget.js", async (c) => {
    const origin = new URL(c.req.url).origin;
    const js = `(() => {
  var s = document.currentScript;
  var flow = s && s.getAttribute("data-flow");
  var asset = (s && s.getAttribute("data-asset")) || "";
  if (!flow) return;
  var base = ${JSON.stringify(origin)};
  function post(path, body) {
    return fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function(r){ return r.json().catch(function(){ return {}; }); });
  }
  function evt(type, meta) {
    post("/api/audience/public/events", { publicFlowId: flow, eventType: type, assetKey: asset, meta: meta || {} });
  }
  evt("page_view", { path: location.pathname });
  var cfg = null;
  fetch(base + "/api/audience/public/flows/" + encodeURIComponent(flow)).then(function(r){ return r.json(); }).then(function(c){ cfg = c; boot(); }).catch(function(){});
  function boot() {
    if (!cfg || cfg.error) return;
    function mountGate() {
      var layout = cfg.widgetLayout || "fullscreen";
      var gate = document.createElement("div");
      gate.setAttribute("data-magnet-gate","1");
      var card = document.createElement("div");
      if (layout === "sticky") {
        gate.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99990;display:flex;justify-content:center;align-items:flex-end;padding:16px 18px 22px;background:linear-gradient(to top,rgba(15,23,42,0.94) 0%,rgba(15,23,42,0.55) 60%,transparent 100%);";
        card.style.cssText = "max-width:720px;width:100%;border-radius:18px;padding:22px 24px;background:#fff;box-shadow:0 -20px 60px rgba(0,0,0,0.28);font-family:system-ui,-apple-system,sans-serif;";
      } else if (layout === "modal") {
        gate.style.cssText = "position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:32px;background:rgba(15,23,42,0.48);backdrop-filter:blur(" + (Number(cfg.blurIntensity)||12) + "px);";
        card.style.cssText = "max-width:440px;width:100%;border-radius:24px;padding:32px;background:#fff;box-shadow:0 32px 100px rgba(0,0,0,0.26);font-family:system-ui,-apple-system,sans-serif;";
      } else {
        gate.style.cssText = "position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,0.35);backdrop-filter:blur(" + (Number(cfg.blurIntensity)||0) + "px);";
        card.style.cssText = "max-width:420px;width:100%;border-radius:20px;padding:28px;background:#fff;box-shadow:0 24px 80px rgba(0,0,0,0.18);font-family:system-ui,-apple-system,sans-serif;";
      }
      var h = document.createElement("h2");
      h.textContent = cfg.headline || "Unlock";
      h.style.cssText = "margin:0 0 8px;font-size:20px;font-weight:650;color:#0f172a;";
      var p = document.createElement("p");
      p.textContent = "Verified audience capture";
      p.style.cssText = "margin:0 0 20px;font-size:13px;color:#64748b;";
      card.appendChild(h); card.appendChild(p);
      if (cfg.captureMethod === "google") {
        var g = document.createElement("a");
        g.href = base + "/api/audience/oauth/google/start?flow=" + encodeURIComponent(flow) + "&return=" + encodeURIComponent(location.href);
        g.textContent = "Continue with Google";
        g.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:100%;height:44px;border-radius:12px;background:#111827;color:#fff;font-weight:600;text-decoration:none;font-size:14px;";
        card.appendChild(g);
      } else {
        var f = document.createElement("form");
        f.style.cssText = "display:flex;flex-direction:column;gap:10px;";
        f.innerHTML = '<label style="font-size:12px;color:#475569;">Email<input type="email" name="e" required style="width:100%;height:40px;border-radius:10px;border:1px solid #e2e8f0;padding:0 12px;" /></label>' +
          '<input type="text" name="website" autocomplete="off" tabindex="-1" style="position:absolute;left:-5000px;opacity:0;height:0;width:0;" />' +
          '<button type="submit" style="height:44px;border-radius:12px;border:none;background:#4f46e5;color:#fff;font-weight:600;cursor:pointer;">' + String(cfg.ctaText || "Continue") + "</button>";
        f.addEventListener("submit", function(ev) {
          ev.preventDefault();
          var email = f.querySelector("[name=e]").value;
          var hp = f.querySelector("[name=website]").value;
          post("/api/audience/public/email-capture", { publicFlowId: flow, email: email, assetKey: asset, trafficSource: document.referrer || "", website: hp }).then(function(r) {
            if (r && r.token) { try { sessionStorage.setItem("magnet_audience_token", r.token); } catch(e) {} }
            if (document.body.contains(gate)) document.body.removeChild(gate);
          });
        });
        card.appendChild(f);
      }
      gate.appendChild(card);
      var delay = Number(cfg.triggerDelayMs) || 0;
      setTimeout(function(){ try { document.body.appendChild(gate); evt("gate_opened", {}); } catch(e) {} }, Math.max(0, delay));
    }
    try {
      var tok = sessionStorage.getItem("magnet_audience_token");
      if (tok) {
        post("/api/audience/public/session/verify", { token: tok }).then(function(r) {
          if (!r || !r.ok) mountGate();
        });
        return;
      }
    } catch(e) {}
    mountGate();
  }
  var hash = location.hash;
  if (hash && hash.indexOf("magnet_audience_token=") !== -1) {
    try {
      var t = decodeURIComponent(hash.split("magnet_audience_token=")[1].split("&")[0]);
      post("/api/audience/public/session/verify", { token: t }).then(function(r) {
        if (r && r.ok) { try { sessionStorage.setItem("magnet_audience_token", t); history.replaceState(null, "", location.pathname + location.search); } catch(e) {} }
      });
    } catch(e) {}
  }
})();`;
    return new Response(js, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  });

  app.get("/api/audience/flows", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    try {
      const rows = await (c.env.DB as D1Like).prepare(
        "SELECT id, name, status, asset_type, capture_method, config_json, public_id, created_at, updated_at FROM capture_flows WHERE user_id = ? ORDER BY id DESC",
      )
        .bind(user.id)
        .all();
      const flows = (rows.results ?? []).map((r: any) => mapFlowRow(r as Record<string, unknown>));
      return c.json({ flows });
    } catch (e) {
      console.error("audience flows list", e);
      return c.json({ flows: [], error: "Apply migration 0002_audience_engine.sql" });
    }
  });

  app.post("/api/audience/flows", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const body = await c.req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "Capture flow";
    const assetType = typeof body.assetType === "string" ? body.assetType.trim() : "landing";
    const captureMethod = typeof body.captureMethod === "string" ? body.captureMethod.trim() : "email";
    const status = typeof body.status === "string" && FLOW_STATUSES.has(body.status) ? body.status : "live";
    const config = typeof body.config === "object" && body.config ? body.config : {};
    const wordpressSiteIds = Array.isArray(body.wordpressSiteIds)
      ? body.wordpressSiteIds.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))
      : [];

    const publicId = crypto.randomUUID();
    const now = new Date().toISOString();
    const configJson = JSON.stringify(config);

    try {
      const ins: any = await (c.env.DB as D1Like).prepare(
        `INSERT INTO capture_flows (user_id, name, status, asset_type, capture_method, config_json, public_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(user.id, name, status, assetType, captureMethod, configJson, publicId, now, now)
        .run();
      const id = ins.meta.last_row_id as number;
      for (const sid of wordpressSiteIds) {
        await (c.env.DB as D1Like).prepare("INSERT INTO capture_flow_targets (flow_id, wordpress_site_id, asset_key) VALUES (?, ?, ?)")
          .bind(id, sid, "")
          .run();
      }
      const row = await (c.env.DB as D1Like).prepare("SELECT * FROM capture_flows WHERE id = ? AND user_id = ?")
        .bind(id, user.id)
        .first();
      return c.json({ flow: mapFlowRow(row as Record<string, unknown>) });
    } catch (e) {
      console.error("audience flow create", e);
      return c.json({ error: "Could not create flow" }, 500);
    }
  });

  app.get("/api/audience/flows/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = c.req.param("id");
    const row = await (c.env.DB as D1Like).prepare("SELECT * FROM capture_flows WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!row) return c.json({ error: "Not found" }, 404);
    const targets = await (c.env.DB as D1Like).prepare("SELECT id, wordpress_site_id, asset_key FROM capture_flow_targets WHERE flow_id = ?")
      .bind(id)
      .all();
    return c.json({ flow: mapFlowRow(row as Record<string, unknown>), targets: targets.results ?? [] });
  });

  app.patch("/api/audience/flows/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const row = await (c.env.DB as D1Like).prepare("SELECT * FROM capture_flows WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!row) return c.json({ error: "Not found" }, 404);
    const r = row as Record<string, unknown>;
    const now = new Date().toISOString();
    let cfg = parseJson<Record<string, unknown>>(String(r.config_json || "{}"), {});
    if (typeof body.config === "object" && body.config) cfg = { ...cfg, ...(body.config as Record<string, unknown>) };
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : (r.name as string);
    const status =
      typeof body.status === "string" && FLOW_STATUSES.has(body.status) ? body.status : (r.status as string);
    await (c.env.DB as D1Like).prepare("UPDATE capture_flows SET name = ?, status = ?, config_json = ?, updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(name, status, JSON.stringify(cfg), now, id, user.id)
      .run();
    if (Array.isArray(body.wordpressSiteIds)) {
      await (c.env.DB as D1Like).prepare("DELETE FROM capture_flow_targets WHERE flow_id = ?").bind(id).run();
      for (const sid of body.wordpressSiteIds.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))) {
        await (c.env.DB as D1Like).prepare("INSERT INTO capture_flow_targets (flow_id, wordpress_site_id, asset_key) VALUES (?, ?, ?)")
          .bind(id, sid, "")
          .run();
      }
    }
    const updated = await (c.env.DB as D1Like).prepare("SELECT * FROM capture_flows WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    return c.json({ flow: mapFlowRow(updated as Record<string, unknown>) });
  });

  app.delete("/api/audience/flows/:id", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = c.req.param("id");
    await (c.env.DB as D1Like).prepare("DELETE FROM capture_flows WHERE id = ? AND user_id = ?").bind(id, user.id).run();
    return c.json({ success: true });
  });

  app.post("/api/audience/flows/:id/duplicate", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const id = c.req.param("id");
    const row = await (c.env.DB as D1Like).prepare("SELECT * FROM capture_flows WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!row) return c.json({ error: "Not found" }, 404);
    const r = row as Record<string, unknown>;
    const publicId = crypto.randomUUID();
    const now = new Date().toISOString();
    const ins: any = await (c.env.DB as D1Like).prepare(
      `INSERT INTO capture_flows (user_id, name, status, asset_type, capture_method, config_json, public_id, created_at, updated_at)
       VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
    )
      .bind(user.id, `${String(r.name)} (copy)`, String(r.asset_type || ''), String(r.capture_method || ''), String(r.config_json || '{}'), publicId, now, now)
      .run();
    const newId = ins.meta.last_row_id as number;
    const tg = await (c.env.DB as D1Like).prepare("SELECT wordpress_site_id, asset_key FROM capture_flow_targets WHERE flow_id = ?")
      .bind(id)
      .all();
    for (const t of (tg.results ?? []) as { wordpress_site_id: number | null; asset_key: string }[]) {
      await (c.env.DB as D1Like).prepare("INSERT INTO capture_flow_targets (flow_id, wordpress_site_id, asset_key) VALUES (?, ?, ?)")
        .bind(newId, t.wordpress_site_id, t.asset_key)
        .run();
    }
    const created = await (c.env.DB as D1Like).prepare("SELECT * FROM capture_flows WHERE id = ? AND user_id = ?")
      .bind(newId, user.id)
      .first();
    return c.json({ flow: mapFlowRow(created as Record<string, unknown>) });
  });

  app.get("/api/audience/subscribers", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 40));
    try {
      const rows = await (c.env.DB as D1Like).prepare(
        `SELECT id, email, name, provider, source_asset_type, source_asset_key, capture_flow_id, traffic_source, wordpress_site_id, engagement_score, created_at
         FROM subscribers WHERE owner_user_id = ? ORDER BY id DESC LIMIT ?`,
      )
        .bind(user.id, limit)
        .all();
      return c.json({ subscribers: rows.results ?? [] });
    } catch {
      return c.json({ subscribers: [] });
    }
  });

  app.get("/api/audience/events/recent", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 30));
    try {
      const rows = await (c.env.DB as D1Like).prepare(
        `SELECT id, event_type, capture_flow_id, subscriber_id, asset_key, created_at, meta_json
         FROM capture_events WHERE owner_user_id = ? ORDER BY id DESC LIMIT ?`,
      )
        .bind(user.id, limit)
        .all();
      return c.json({ events: rows.results ?? [] });
    } catch {
      return c.json({ events: [] });
    }
  });

  app.get("/api/audience/analytics/summary", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    try {
      const since = "datetime('now', '-30 day')";
      const totals = await (c.env.DB as D1Like).prepare(
        `SELECT event_type as t, COUNT(*) as c FROM capture_events WHERE owner_user_id = ? AND created_at > ${since} GROUP BY event_type`,
      )
        .bind(user.id)
        .all();
      const subCount = await (c.env.DB as D1Like).prepare("SELECT COUNT(*) as c FROM subscribers WHERE owner_user_id = ?")
        .bind(user.id)
        .first<{ c: number }>();
      const sub30 = await (c.env.DB as D1Like).prepare(`SELECT COUNT(*) as c FROM subscribers WHERE owner_user_id = ? AND created_at > ${since}`)
        .bind(user.id)
        .first<{ c: number }>();
      const map: Record<string, number> = {};
      for (const row of (totals.results ?? []) as { t: string; c: number }[]) map[row.t] = Number(row.c) || 0;
      const opened = map["gate_opened"] || 0;
      const unlocked = map["unlock_completed"] || 0;
      const conversionRate = opened > 0 ? Math.round((unlocked / opened) * 1000) / 10 : 0;
      return c.json({
        subscriberCount: Number(subCount?.c) || 0,
        subscribersLast30Days: Number(sub30?.c) || 0,
        eventsByType: map,
        conversionRateGateToUnlock: conversionRate,
        googleUnlocks: map["google_sign_in_success"] || 0,
        emailCaptures: map["email_captured"] || 0,
      });
    } catch (e) {
      console.error("analytics summary", e);
      return c.json({ error: "not_ready" }, 503);
    }
  });

  app.get("/api/audience/analytics/assets", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    try {
      const rows = await (c.env.DB as D1Like).prepare(
        `SELECT asset_key as assetKey, COUNT(*) as events
         FROM capture_events
         WHERE owner_user_id = ? AND asset_key != '' AND created_at > datetime('now', '-30 day')
         GROUP BY asset_key ORDER BY events DESC LIMIT 20`,
      )
        .bind(user.id)
        .all();
      return c.json({ assets: rows.results ?? [] });
    } catch {
      return c.json({ assets: [] });
    }
  });

  app.get("/api/audience/analytics/extended", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const since14 = "datetime('now', '-14 day')";
    const since30 = "datetime('now', '-30 day')";
    try {
      const subSeries = await (c.env.DB as D1Like).prepare(
        `SELECT date(created_at) as d, COUNT(*) as c FROM subscribers WHERE owner_user_id = ? AND created_at > ${since14} GROUP BY date(created_at) ORDER BY d ASC`,
      )
        .bind(user.id)
        .all();
      const unlockSeries = await (c.env.DB as D1Like).prepare(
        `SELECT date(created_at) as d, COUNT(*) as c FROM capture_events WHERE owner_user_id = ? AND event_type = 'unlock_completed' AND created_at > ${since14} GROUP BY date(created_at) ORDER BY d ASC`,
      )
        .bind(user.id)
        .all();
      const unlockMethods = await (c.env.DB as D1Like).prepare(
        `SELECT u.unlock_method as method, COUNT(*) as c
         FROM subscriber_unlock_history u
         INNER JOIN subscribers s ON s.id = u.subscriber_id
         WHERE s.owner_user_id = ?
         GROUP BY u.unlock_method`,
      )
        .bind(user.id)
        .all();
      const trafficSources = await (c.env.DB as D1Like).prepare(
        `SELECT COALESCE(NULLIF(TRIM(traffic_source), ''), '(direct / unknown)') as src, COUNT(*) as c
         FROM subscribers WHERE owner_user_id = ? AND created_at > ${since30}
         GROUP BY src ORDER BY c DESC LIMIT 12`,
      )
        .bind(user.id)
        .all();
      const totals = await (c.env.DB as D1Like).prepare(
        `SELECT event_type as t, COUNT(*) as c FROM capture_events WHERE owner_user_id = ? AND created_at > ${since30} GROUP BY event_type`,
      )
        .bind(user.id)
        .all();
      const assetRows = await (c.env.DB as D1Like).prepare(
        `SELECT asset_key as assetKey, COUNT(*) as events
         FROM capture_events
         WHERE owner_user_id = ? AND asset_key != '' AND created_at > ${since30}
         GROUP BY asset_key ORDER BY events DESC LIMIT 15`,
      )
        .bind(user.id)
        .all();
      const map: Record<string, number> = {};
      for (const row of (totals.results ?? []) as { t: string; c: number }[]) map[row.t] = Number(row.c) || 0;
      const pv = map["page_view"] || 0;
      const uc = map["unlock_completed"] || 0;
      return c.json({
        subscriberSeries: (subSeries.results ?? []).map((r: { d: string; c: number }) => ({
          day: r.d,
          count: Number(r.c) || 0,
        })),
        unlockSeries: (unlockSeries.results ?? []).map((r: { d: string; c: number }) => ({
          day: r.d,
          count: Number(r.c) || 0,
        })),
        unlockMethods: (unlockMethods.results ?? []).map((r: { method: string; c: number }) => ({
          method: String(r.method || "unknown"),
          count: Number(r.c) || 0,
        })),
        trafficSources: (trafficSources.results ?? []).map((r: { src: string; c: number }) => ({
          source: String(r.src),
          count: Number(r.c) || 0,
        })),
        topAssets: (assetRows.results ?? []).map((r: { assetKey: string; events: number }) => ({
          assetKey: String(r.assetKey),
          events: Number(r.events) || 0,
        })),
        funnel30d: map,
        publishingRoi: {
          pageViews: pv,
          unlocks: uc,
          visitorToUnlockPct: pv > 0 ? Math.round((uc / pv) * 1000) / 10 : 0,
        },
      });
    } catch (e) {
      console.error("analytics extended", e);
      return c.json({ error: "not_ready" }, 503);
    }
  });

  app.post("/api/audience/inject-html", authMiddleware, async (c) => {
    const user = c.get("user") as MochaUser;
    const body = await c.req.json().catch(() => ({}));
    const html = typeof body.html === "string" ? body.html : "";
    const flowPublicId = typeof body.flowPublicId === "string" ? body.flowPublicId.trim() : "";
    const assetKey = typeof body.assetKey === "string" ? body.assetKey.trim().slice(0, 512) : "";
    if (!html || !flowPublicId) return c.json({ error: "html and flowPublicId required" }, 400);
    const row = await (c.env.DB as D1Like).prepare("SELECT id FROM capture_flows WHERE public_id = ? AND user_id = ? LIMIT 1")
      .bind(flowPublicId, user.id)
      .first();
    if (!row) return c.json({ error: "Flow not found for user" }, 404);
    const origin = new URL(c.req.url).origin;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const snippet = `\n<!-- Audience Growth Engine — flow ${esc(flowPublicId)} -->\n<script src="${esc(origin)}/api/audience/widget.js" async data-flow="${esc(flowPublicId)}" data-asset="${esc(assetKey)}"></script>\n`;
    const out = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${snippet}</body>`) : `${html}${snippet}`;
    return c.json({ html: out, embedSnippet: snippet.trim() });
  });
}
