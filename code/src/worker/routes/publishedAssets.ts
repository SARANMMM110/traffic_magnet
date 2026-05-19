import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";

type MochaUser = { id: string };

type Bindings = {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
};

export const publishedAssetsRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: MochaUser };
}>();

// ============================================================================
// AUTHENTICATED ROUTES - Asset Management
// ============================================================================

// List all published assets for user
publishedAssetsRoutes.get("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  const assets = await db
    .prepare(
      `SELECT 
        id, user_id, project_id, slug, asset_type, title, description,
        deployment_status, public_url, audience_flow_id, assistant_id,
        view_count, unlock_count, subscriber_count, last_viewed_at,
        published_at, created_at, updated_at
      FROM published_assets
      WHERE user_id = ?
      ORDER BY created_at DESC`
    )
    .bind(user.id)
    .all();

  return c.json({ assets: assets.results || [] });
});

// Get single published asset
publishedAssetsRoutes.get("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const assetId = c.req.param("id");

  const asset = await db
    .prepare(
      `SELECT * FROM published_assets
      WHERE id = ? AND user_id = ?`
    )
    .bind(assetId, user.id)
    .first();

  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  return c.json({ asset });
});

// Create/publish new asset
publishedAssetsRoutes.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const body = await c.req.json();

  const {
    project_id,
    slug,
    asset_type,
    title,
    description,
    html_content,
    css_content,
    js_content,
    audience_flow_id,
    assistant_id,
    source_tool_id,
    source_campaign_id,
  } = body;

  // Validate required fields
  if (!slug || !asset_type || !title) {
    return c.json({ error: "Missing required fields: slug, asset_type, title" }, 400);
  }

  // Validate slug format (alphanumeric + hyphens only)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return c.json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" }, 400);
  }

  // Check slug uniqueness
  const existing = await db
    .prepare("SELECT id FROM published_assets WHERE slug = ?")
    .bind(slug)
    .first();

  if (existing) {
    return c.json({ error: "Slug already exists" }, 409);
  }

  // Insert asset
  const result = await db
    .prepare(
      `INSERT INTO published_assets (
        user_id, project_id, slug, asset_type, title, description,
        html_content, css_content, js_content, deployment_status,
        audience_flow_id, assistant_id, source_tool_id, source_campaign_id,
        published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      RETURNING *`
    )
    .bind(
      user.id,
      project_id || null,
      slug,
      asset_type,
      title,
      description || null,
      html_content || null,
      css_content || null,
      js_content || null,
      "deployed",
      audience_flow_id || null,
      assistant_id || null,
      source_tool_id || null,
      source_campaign_id || null
    )
    .first();

  // Generate public URL
  const publicUrl = `/p/${slug}`;
  await db
    .prepare("UPDATE published_assets SET public_url = ? WHERE id = ?")
    .bind(publicUrl, (result as any).id)
    .run();

  return c.json({
    asset: { ...result, public_url: publicUrl },
    message: "Asset published successfully",
  });
});

// Update published asset
publishedAssetsRoutes.patch("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const assetId = c.req.param("id");
  const body = await c.req.json();

  // Verify ownership
  const asset = await db
    .prepare("SELECT id FROM published_assets WHERE id = ? AND user_id = ?")
    .bind(assetId, user.id)
    .first();

  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  const allowedFields = [
    "title",
    "description",
    "html_content",
    "css_content",
    "js_content",
    "deployment_status",
    "audience_flow_id",
    "assistant_id",
  ];

  const updates: string[] = [];
  const values: any[] = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(assetId, user.id);

  await db
    .prepare(
      `UPDATE published_assets 
      SET ${updates.join(", ")}
      WHERE id = ? AND user_id = ?`
    )
    .bind(...values)
    .run();

  const updated = await db
    .prepare("SELECT * FROM published_assets WHERE id = ?")
    .bind(assetId)
    .first();

  return c.json({ asset: updated });
});

// Delete published asset
publishedAssetsRoutes.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const assetId = c.req.param("id");

  const asset = await db
    .prepare("SELECT id FROM published_assets WHERE id = ? AND user_id = ?")
    .bind(assetId, user.id)
    .first();

  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  await db.prepare("DELETE FROM published_assets WHERE id = ?").bind(assetId).run();

  return c.json({ message: "Asset deleted successfully" });
});

// Get asset analytics
publishedAssetsRoutes.get("/:id/analytics", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const assetId = c.req.param("id");

  // Verify ownership
  const asset = await db
    .prepare(
      `SELECT id, view_count, unlock_count, subscriber_count
      FROM published_assets 
      WHERE id = ? AND user_id = ?`
    )
    .bind(assetId, user.id)
    .first();

  if (!asset) {
    return c.json({ error: "Asset not found" }, 404);
  }

  // Get event breakdown
  const events = await db
    .prepare(
      `SELECT event_type, COUNT(*) as count
      FROM asset_runtime_events
      WHERE published_asset_id = ?
      GROUP BY event_type`
    )
    .bind(assetId)
    .all();

  // Get recent events
  const recentEvents = await db
    .prepare(
      `SELECT event_type, visitor_session_hash, created_at
      FROM asset_runtime_events
      WHERE published_asset_id = ?
      ORDER BY created_at DESC
      LIMIT 50`
    )
    .bind(assetId)
    .all();

  // Get unique visitors
  const uniqueVisitors = await db
    .prepare(
      `SELECT COUNT(DISTINCT visitor_session_hash) as count
      FROM asset_runtime_events
      WHERE published_asset_id = ? AND visitor_session_hash IS NOT NULL`
    )
    .bind(assetId)
    .first();

  return c.json({
    views: (asset as any).view_count || 0,
    unlocks: (asset as any).unlock_count || 0,
    subscribers: (asset as any).subscriber_count || 0,
    uniqueVisitors: (uniqueVisitors as any)?.count || 0,
    unlockRate:
      (asset as any).view_count > 0
        ? ((asset as any).unlock_count / (asset as any).view_count) * 100
        : 0,
    eventBreakdown: events.results || [],
    recentEvents: recentEvents.results || [],
  });
});

// ============================================================================
// PUBLIC ROUTES - Asset Delivery
// ============================================================================

export const publicAssetRoutes = new Hono<{ Bindings: Bindings }>();

// Serve published asset by slug
publicAssetRoutes.get("/:slug", async (c) => {
  const db = c.env.DB;
  const slug = c.req.param("slug");

  const asset = await db
    .prepare(
      `SELECT id, title, html_content, css_content, js_content, 
        audience_flow_id, assistant_id, deployment_status
      FROM published_assets
      WHERE slug = ? AND deployment_status = 'deployed'`
    )
    .bind(slug)
    .first();

  if (!asset) {
    return c.html("<h1>404 - Asset Not Found</h1>", 404);
  }

  // Increment view count
  await db
    .prepare(
      `UPDATE published_assets 
      SET view_count = view_count + 1, last_viewed_at = datetime('now')
      WHERE id = ?`
    )
    .bind((asset as any).id)
    .run();

  // Track page view event
  const visitorHash = hashVisitorSession(c.req.header("user-agent") || "", c.req.header("cf-connecting-ip") || "");
  
  await db
    .prepare(
      `INSERT INTO asset_runtime_events (
        published_asset_id, event_type, visitor_session_hash,
        user_agent, referrer
      ) VALUES (?, 'page_view', ?, ?, ?)`
    )
    .bind(
      (asset as any).id,
      visitorHash,
      c.req.header("user-agent") || null,
      c.req.header("referer") || null
    )
    .run();

  // Build complete HTML page
  const htmlContent = (asset as any).html_content || "<h1>Content Not Available</h1>";
  const cssContent = (asset as any).css_content || "";
  const jsContent = (asset as any).js_content || "";

  const fullPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${(asset as any).title}</title>
  <style>${cssContent}</style>
</head>
<body>
  ${htmlContent}
  <script>${jsContent}</script>
</body>
</html>`;

  return c.html(fullPage);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hashVisitorSession(userAgent: string, ip: string): string {
  const data = `${userAgent}-${ip}-${new Date().toDateString()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
