import { Hono } from "hono";
import type { Context } from "hono";

const gptEmbedRoutes = new Hono();

interface Env {
  DB: D1Database;
}

interface MochaUser {
  id: string;
  email: string;
}

// Generate embed code
gptEmbedRoutes.post("/:id/embed/generate", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const { mode, theme, greeting, buttonText, position, targetElement } = body;

  try {
    // Get GPT details
    const gpt = await c.env.DB.prepare(
      "SELECT id, name, avatar_url, deploy_status FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!gpt) {
      return c.json({ error: "GPT not found" }, 404);
    }

    if (gpt.deploy_status !== "published") {
      return c.json({ error: "GPT must be published first" }, 400);
    }

    // Generate unique public ID for this deployment
    const publicId = `gpt-${gptId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create deployment record
    const deploymentConfig = {
      mode: mode || 'popup',
      theme: theme || {
        primaryColor: '#7C5CFC',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
      },
      greeting: greeting || 'Hi! How can I help you today?',
      buttonText: buttonText || gpt.name || 'Chat',
      position: position || 'bottom-right',
      targetElement: targetElement || 'mocha-gpt-widget',
      avatar: gpt.avatar_url,
    };

    await c.env.DB.prepare(
      `INSERT INTO gpt_deployments (gpt_id, user_id, deployment_type, public_id, config, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        gptId,
        user.id,
        'widget',
        publicId,
        JSON.stringify(deploymentConfig),
        1
      )
      .run();

    // Generate embed code
    const embedCode = generateEmbedCode(gptId, publicId, deploymentConfig);

    // Update GPT with embed code
    await c.env.DB.prepare(
      "UPDATE gpt_deployments SET embed_code = ? WHERE public_id = ?"
    )
      .bind(embedCode, publicId)
      .run();

    return c.json({
      success: true,
      public_id: publicId,
      embed_code: embedCode,
      config: deploymentConfig,
    });
  } catch (error) {
    console.error("Failed to generate embed code:", error);
    return c.json({ error: "Failed to generate embed code" }, 500);
  }
});

// List all widget deployments
gptEmbedRoutes.get("/:id/embed/deployments", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const deployments = await c.env.DB.prepare(
      `SELECT id, deployment_type, public_id, embed_code, config, is_active, created_at
       FROM gpt_deployments
       WHERE gpt_id = ? AND user_id = ? AND deployment_type = 'widget'
       ORDER BY created_at DESC`
    )
      .bind(gptId, user.id)
      .all();

    return c.json({ deployments: deployments.results || [] });
  } catch (error) {
    console.error("Failed to fetch deployments:", error);
    return c.json({ error: "Failed to fetch deployments" }, 500);
  }
});

// Delete widget deployment
gptEmbedRoutes.delete("/:id/embed/:deploymentId", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  const deploymentId = parseInt(c.req.param("deploymentId"));

  try {
    await c.env.DB.prepare(
      "DELETE FROM gpt_deployments WHERE id = ? AND gpt_id = ? AND user_id = ?"
    )
      .bind(deploymentId, gptId, user.id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete deployment:", error);
    return c.json({ error: "Failed to delete deployment" }, 500);
  }
});

// Track widget analytics
gptEmbedRoutes.post("/:id/track", async (c: Context<{ Bindings: Env }>) => {
  const gptId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const { event_type, session_id } = body;

  try {
    // Log analytics event (simple implementation)
    await c.env.DB.prepare(
      `INSERT INTO gpt_api_logs (gpt_id, request_type, request_payload, created_at)
       VALUES (?, ?, ?, datetime('now'))`
    )
      .bind(
        gptId,
        'widget_event',
        JSON.stringify({ event_type, session_id })
      )
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to track event:", error);
    return c.json({ success: false });
  }
});

// Helper: Generate embed code
function generateEmbedCode(gptId: number, publicId: string, config: any): string {
  const mode = config.mode || 'popup';
  const configJson = JSON.stringify({
    gptId,
    publicId,
    mode,
    apiBase: 'https://trafficmagnet.mocha.app',
    ...config,
  });

  if (mode === 'inline') {
    return `<!-- Mocha GPT Widget - Inline Mode -->
<div id="${config.targetElement || 'mocha-gpt-widget'}"></div>
<script>
window.MOCHA_GPT_CONFIG = ${configJson};
</script>
<script src="https://trafficmagnet.mocha.app/gpt-widget.js"></script>`;
  } else {
    return `<!-- Mocha GPT Widget - Popup Mode -->
<script>
window.MOCHA_GPT_CONFIG = ${configJson};
</script>
<script src="https://trafficmagnet.mocha.app/gpt-widget.js"></script>`;
  }
}

export default gptEmbedRoutes;
