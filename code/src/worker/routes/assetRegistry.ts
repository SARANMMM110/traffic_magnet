import { Hono } from "hono";

type MochaUser = { id: string };

type Bindings = {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
};

export const assetRegistryRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: MochaUser };
}>();

export interface UnifiedAsset {
  id: string; // Format: "tool-123", "campaign-456", "assistant-789", etc.
  name: string;
  assetType: "interactive-tool" | "landing-page" | "content-wrapper" | "seo-asset" | "wordpress-page" | "ai-assistant";
  projectId: number | null;
  status: "draft" | "published" | "active" | "archived";
  category?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  deploymentType?: string;
  publishedUrl?: string;
  toolId?: number; // Original database ID for tools
  campaignId?: number; // Original database ID for campaigns
  assistantId?: number; // Original database ID for assistants
  wpSiteId?: number; // Original database ID for WP sites
  hasBlueprint?: boolean;
  hasHTML?: boolean;
  hasLandingPage?: boolean;
}

// GET /api/assets - Return all user-generated assets
assetRegistryRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const assets: UnifiedAsset[] = [];

  try {
    // 1. Fetch interactive tools (only those with blueprints)
    const tools = await c.env.DB.prepare(
      `SELECT t.id, t.name, t.category, t.project_id, t.blueprint, t.html_content, 
              t.landing_page_html, t.created_at, t.updated_at, p.name as project_name
       FROM tools t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.user_id = ? AND t.blueprint IS NOT NULL
       ORDER BY t.created_at DESC`
    )
      .bind(user.id)
      .all();

    if (tools.results) {
      for (const tool of tools.results as any[]) {
        assets.push({
          id: `tool-${tool.id}`,
          name: tool.name,
          assetType: "interactive-tool",
          projectId: tool.project_id,
          status: tool.html_content ? "published" : "draft",
          category: tool.category || undefined,
          createdAt: tool.created_at,
          updatedAt: tool.updated_at,
          deploymentType: "standalone",
          publishedUrl: tool.html_content ? `/tools/${tool.id}` : undefined,
          toolId: tool.id,
          hasBlueprint: !!tool.blueprint,
          hasHTML: !!tool.html_content,
          hasLandingPage: !!tool.landing_page_html,
        });
      }
    }

    // 2. Fetch content wrappers/campaigns
    const campaigns = await c.env.DB.prepare(
      `SELECT c.id, c.name, c.project_id, c.tool_id, c.full_page_html, 
              c.created_at, c.updated_at, p.name as project_name
       FROM content_campaigns c
       LEFT JOIN projects p ON c.project_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`
    )
      .bind(user.id)
      .all();

    if (campaigns.results) {
      for (const campaign of campaigns.results as any[]) {
        assets.push({
          id: `campaign-${campaign.id}`,
          name: campaign.name,
          assetType: "content-wrapper",
          projectId: campaign.project_id,
          status: campaign.full_page_html ? "published" : "draft",
          createdAt: campaign.created_at,
          updatedAt: campaign.updated_at,
          deploymentType: "seo-page",
          publishedUrl: campaign.full_page_html ? `/campaigns/${campaign.id}` : undefined,
          campaignId: campaign.id,
          hasHTML: !!campaign.full_page_html,
        });
      }
    }

    // 3. Fetch AI Assistants
    const assistants = await c.env.DB.prepare(
      `SELECT id, name, status, public_id, asset_type, linked_project_id, 
              created_at, updated_at
       FROM ai_assistants
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
      .bind(user.id)
      .all();

    if (assistants.results) {
      for (const assistant of assistants.results as any[]) {
        assets.push({
          id: `assistant-${assistant.id}`,
          name: assistant.name,
          assetType: "ai-assistant",
          projectId: assistant.linked_project_id,
          status: assistant.status,
          createdAt: assistant.created_at,
          updatedAt: assistant.updated_at,
          deploymentType: "widget",
          publishedUrl: `/assistants/${assistant.public_id}`,
          assistantId: assistant.id,
        });
      }
    }

    // 4. Fetch WordPress sites (as deployment targets)
    const wpSites = await c.env.DB.prepare(
      `SELECT id, site_name, domain, connection_health, assets_deployed,
              created_at, updated_at
       FROM wordpress_sites
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
      .bind(user.id)
      .all();

    if (wpSites.results) {
      for (const site of wpSites.results as any[]) {
        assets.push({
          id: `wordpress-${site.id}`,
          name: site.site_name,
          assetType: "wordpress-page",
          projectId: null,
          status: site.connection_health === "healthy" ? "active" : "draft",
          createdAt: site.created_at,
          updatedAt: site.updated_at,
          deploymentType: "wordpress",
          publishedUrl: site.domain,
          wpSiteId: site.id,
        });
      }
    }

    return c.json({
      assets,
      total: assets.length,
      byType: {
        "interactive-tool": assets.filter((a) => a.assetType === "interactive-tool").length,
        "content-wrapper": assets.filter((a) => a.assetType === "content-wrapper").length,
        "ai-assistant": assets.filter((a) => a.assetType === "ai-assistant").length,
        "wordpress-page": assets.filter((a) => a.assetType === "wordpress-page").length,
      },
    });
  } catch (error) {
    console.error("Asset registry error:", error);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

// GET /api/assets/:id - Get single asset details
assetRegistryRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const assetId = c.req.param("id");
  const [type, id] = assetId.split("-");

  try {
    if (type === "tool") {
      const tool = await c.env.DB.prepare(
        `SELECT t.*, p.name as project_name
         FROM tools t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.id = ? AND t.user_id = ?`
      )
        .bind(Number(id), user.id)
        .first();

      if (!tool) {
        return c.json({ error: "Tool not found" }, 404);
      }

      return c.json({
        asset: {
          id: assetId,
          name: (tool as any).name,
          assetType: "interactive-tool",
          projectId: (tool as any).project_id,
          status: (tool as any).html_content ? "published" : "draft",
          category: (tool as any).category,
          createdAt: (tool as any).created_at,
          updatedAt: (tool as any).updated_at,
          toolId: Number(id),
          hasBlueprint: !!(tool as any).blueprint,
          hasHTML: !!(tool as any).html_content,
          hasLandingPage: !!(tool as any).landing_page_html,
        },
      });
    } else if (type === "campaign") {
      const campaign = await c.env.DB.prepare(
        `SELECT c.*, p.name as project_name
         FROM content_campaigns c
         LEFT JOIN projects p ON c.project_id = p.id
         WHERE c.id = ? AND c.user_id = ?`
      )
        .bind(Number(id), user.id)
        .first();

      if (!campaign) {
        return c.json({ error: "Campaign not found" }, 404);
      }

      return c.json({
        asset: {
          id: assetId,
          name: (campaign as any).name,
          assetType: "content-wrapper",
          projectId: (campaign as any).project_id,
          status: (campaign as any).full_page_html ? "published" : "draft",
          createdAt: (campaign as any).created_at,
          updatedAt: (campaign as any).updated_at,
          campaignId: Number(id),
          hasHTML: !!(campaign as any).full_page_html,
        },
      });
    } else if (type === "assistant") {
      const assistant = await c.env.DB.prepare(
        "SELECT * FROM ai_assistants WHERE id = ? AND user_id = ?"
      )
        .bind(Number(id), user.id)
        .first();

      if (!assistant) {
        return c.json({ error: "Assistant not found" }, 404);
      }

      return c.json({
        asset: {
          id: assetId,
          name: (assistant as any).name,
          assetType: "ai-assistant",
          projectId: (assistant as any).linked_project_id,
          status: (assistant as any).status,
          createdAt: (assistant as any).created_at,
          updatedAt: (assistant as any).updated_at,
          assistantId: Number(id),
        },
      });
    }

    return c.json({ error: "Invalid asset type" }, 400);
  } catch (error) {
    console.error("Asset fetch error:", error);
    return c.json({ error: "Failed to fetch asset" }, 500);
  }
});

// GET /api/assets/:id/analytics - Get asset-specific analytics
assetRegistryRoutes.get("/:id/analytics", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const assetId = c.req.param("id");

  try {
    // Get event counts for this asset
    const events = await c.env.DB.prepare(
      `SELECT event_type, COUNT(*) as count
       FROM capture_events
       WHERE owner_user_id = ? AND asset_key = ?
       GROUP BY event_type`
    )
      .bind(user.id, assetId)
      .all();

    // Get subscriber count from this asset
    const subscribers = await c.env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM subscribers
       WHERE owner_user_id = ? AND source_asset_key = ?`
    )
      .bind(user.id, assetId)
      .first();

    // Get deployed flows for this asset
    const deployments = await c.env.DB.prepare(
      `SELECT d.*, f.name as flow_name, f.public_id, f.status
       FROM capture_flow_deployments d
       JOIN capture_flows f ON d.flow_id = f.id
       WHERE d.asset_key = ? AND f.user_id = ?
       ORDER BY d.deployed_at DESC`
    )
      .bind(assetId, user.id)
      .all();

    const eventMap: Record<string, number> = {};
    if (events.results) {
      for (const row of events.results as any[]) {
        eventMap[row.event_type] = row.count;
      }
    }

    const pageViews = eventMap["page_view"] || 0;
    const unlocks = eventMap["unlock_completed"] || 0;
    const unlockRate = pageViews > 0 ? (unlocks / pageViews) * 100 : 0;

    return c.json({
      assetId,
      visitors: pageViews,
      unlocks,
      unlockRate: Math.round(unlockRate * 10) / 10,
      subscribers: (subscribers as any)?.count || 0,
      eventsByType: eventMap,
      deployments: deployments.results || [],
    });
  } catch (error) {
    console.error("Asset analytics error:", error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});
assetRegistryRoutes.post("/inject-html", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { assetId, flowPublicId, triggerConfig } = body;

  if (!assetId || !flowPublicId) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const [type, id] = assetId.split("-");

  try {
    // Generate widget injection script
    const widgetScript = `
<!-- Audience Capture Widget -->
<script>
  window.AUDIENCE_FLOW_ID = "${flowPublicId}";
  window.AUDIENCE_CONFIG = ${JSON.stringify(triggerConfig || {})};
</script>
<script src="/audience-widget.js" async></script>
<!-- End Audience Capture Widget -->
`;

    // Inject into the appropriate asset type
    if (type === "tool") {
      const tool = await c.env.DB.prepare(
        "SELECT html_content, landing_page_html FROM tools WHERE id = ? AND user_id = ?"
      )
        .bind(Number(id), user.id)
        .first();

      if (!tool) {
        return c.json({ error: "Tool not found" }, 404);
      }

      let updatedHTML = (tool as any).html_content;
      let updatedLandingPage = (tool as any).landing_page_html;

      if (updatedHTML) {
        updatedHTML = updatedHTML.replace("</body>", `${widgetScript}</body>`);
      }
      if (updatedLandingPage) {
        updatedLandingPage = updatedLandingPage.replace("</body>", `${widgetScript}</body>`);
      }

      await c.env.DB.prepare(
        "UPDATE tools SET html_content = ?, landing_page_html = ?, updated_at = ? WHERE id = ? AND user_id = ?"
      )
        .bind(updatedHTML, updatedLandingPage, new Date().toISOString(), Number(id), user.id)
        .run();

      return c.json({ success: true, injected: true });
    } else if (type === "campaign") {
      const campaign = await c.env.DB.prepare(
        "SELECT full_page_html FROM content_campaigns WHERE id = ? AND user_id = ?"
      )
        .bind(Number(id), user.id)
        .first();

      if (!campaign) {
        return c.json({ error: "Campaign not found" }, 404);
      }

      let updatedHTML = (campaign as any).full_page_html;
      if (updatedHTML) {
        updatedHTML = updatedHTML.replace("</body>", `${widgetScript}</body>`);
      }

      await c.env.DB.prepare(
        "UPDATE content_campaigns SET full_page_html = ?, updated_at = ? WHERE id = ? AND user_id = ?"
      )
        .bind(updatedHTML, new Date().toISOString(), Number(id), user.id)
        .run();

      return c.json({ success: true, injected: true });
    }

    return c.json({ error: "Asset type not supported for injection" }, 400);
  } catch (error) {
    console.error("HTML injection error:", error);
    return c.json({ error: "Failed to inject widget" }, 500);
  }
});
