import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { discoverToolIdeas, generateBlueprint, generateToolHTML, generateSEOContent, generateContentWrapper, regenerateBlueprintFromBlueprint, generateLandingPage, generateVariation } from "./services/openai";

const app = new Hono<{ Bindings: Env }>();

// Get OAuth redirect URL
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

// Exchange code for session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get current user
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Logout
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Get API keys (masked)
app.get("/api/settings/keys", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const result = await c.env.DB.prepare(
    "SELECT openai_key, anthropic_key, ideogram_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  if (!result) {
    return c.json({ 
      openai_key: null, 
      anthropic_key: null, 
      ideogram_key: null 
    });
  }

  // Mask keys for security
  const maskKey = (key: string | null) => {
    if (!key) return null;
    const start = key.substring(0, 8);
    return `${start}${"*".repeat(20)}`;
  };

  return c.json({
    openai_key: maskKey(result.openai_key as string | null),
    anthropic_key: maskKey(result.anthropic_key as string | null),
    ideogram_key: maskKey(result.ideogram_key as string | null),
  });
});

// Save API keys
app.post("/api/settings/keys", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  const { openai_key, anthropic_key, ideogram_key } = body;

  // Check if user already has keys
  const existing = await c.env.DB.prepare(
    "SELECT id FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  if (existing) {
    // Update existing keys (only update non-null values)
    const updates: string[] = [];
    const params: any[] = [];

    if (openai_key !== undefined && openai_key !== null) {
      updates.push("openai_key = ?");
      params.push(openai_key);
    }
    if (anthropic_key !== undefined && anthropic_key !== null) {
      updates.push("anthropic_key = ?");
      params.push(anthropic_key);
    }
    if (ideogram_key !== undefined && ideogram_key !== null) {
      updates.push("ideogram_key = ?");
      params.push(ideogram_key);
    }

    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      params.push(user.id);

      await c.env.DB.prepare(
        `UPDATE api_keys SET ${updates.join(", ")} WHERE user_id = ?`
      ).bind(...params).run();
    }
  } else {
    // Insert new keys
    await c.env.DB.prepare(
      "INSERT INTO api_keys (user_id, openai_key, anthropic_key, ideogram_key) VALUES (?, ?, ?, ?)"
    ).bind(user.id, openai_key || null, anthropic_key || null, ideogram_key || null).run();
  }

  return c.json({ success: true });
});

// Get user usage stats
app.get("/api/usage", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Count projects
  const projectCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND is_archived = 0"
  ).bind(user.id).first();

  // Count tools
  const toolCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tools WHERE user_id = ?"
  ).bind(user.id).first();

  // Count unique niches
  const nicheCount = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT niche) as count FROM projects WHERE user_id = ?"
  ).bind(user.id).first();

  return c.json({
    projects: projectCount?.count || 0,
    tools: toolCount?.count || 0,
    niches: nicheCount?.count || 0,
    plan: "pro",
    limit: 999,
  });
});

// Create new project
app.post("/api/projects", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  const { niche, name, goal, audience } = body;

  if (!niche) {
    return c.json({ error: "Niche is required" }, 400);
  }

  // Check project limit
  const projectCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND is_archived = 0"
  ).bind(user.id).first();

  const limit = 999; // Pro plan limit
  if (projectCount && (projectCount.count as number) >= limit) {
    return c.json({ error: "Project limit reached. Upgrade your plan to create more projects." }, 403);
  }

  // Insert new project
  const result = await c.env.DB.prepare(
    "INSERT INTO projects (user_id, name, niche, goal, audience) VALUES (?, ?, ?, ?, ?)"
  ).bind(user.id, name, niche, goal, audience).run();

  const projectId = result.meta.last_row_id;

  return c.json({ id: projectId, name, niche, goal, audience });
});

// Discover tool ideas for a project
app.post("/api/projects/:id/discover", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const projectId = c.req.param("id");

  // Get project
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).bind(projectId, user.id).first();

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Check if already discovered
  const existingTools = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tools WHERE project_id = ?"
  ).bind(projectId).first();

  if (existingTools && (existingTools.count as number) > 0) {
    return c.json({ error: "Tools already discovered for this project" }, 400);
  }

  // Get user's OpenAI key
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const userApiKey = apiKeyRecord?.openai_key as string | null;
  const apiKey = userApiKey || c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: "OpenAI API key not configured. Please add your API key in Settings." }, 400);
  }

  try {
    console.log("[discover] Starting discovery for project:", projectId);
    console.log("[discover] Project niche:", project.niche);
    console.log("[discover] Project goal:", project.goal);
    console.log("[discover] Project audience:", project.audience);
    console.log("[discover] Using API key:", apiKey ? 'Present' : 'Missing');
    
    // Generate tool ideas
    const tools = await discoverToolIdeas(
      project.niche as string,
      project.goal as string | null,
      project.audience as string | null,
      apiKey
    );

    console.log("[discover] Discovery successful, got", tools.length, "tools");
    
    if (!tools || tools.length === 0) {
      console.error("[discover] No tools returned from discovery");
      return c.json({ error: "No tool ideas were generated. Please try a different niche." }, 500);
    }

    // Insert tools into database
    console.log("[discover] Inserting", tools.length, "tools into database");
    const insertPromises = tools.map((tool, index) => {
      // Calculate individual scores from potential ratings
      const trafficScore = tool.traffic_potential === "High" ? 85 : tool.traffic_potential === "Medium" ? 60 : 35;
      const backlinkScore = tool.link_magnet_score === "Strong" ? 90 : tool.link_magnet_score === "Medium" ? 60 : 30;
      const monetizationScore = tool.monetization === "Strong" ? 85 : tool.monetization === "Medium" ? 55 : 25;

      console.log(`[discover] Tool ${index + 1}:`, tool.name, "| Score:", tool.score);

      return c.env.DB.prepare(
        `INSERT INTO tools (
          user_id, project_id, name, category, description,
          traffic_score, link_score, monetization_score, overall_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          user.id,
          projectId,
          tool.name,
          tool.category,
          tool.why,
          trafficScore,
          backlinkScore,
          monetizationScore,
          tool.score
        )
        .run();
    });

    await Promise.all(insertPromises);
    console.log("[discover] All tools inserted successfully");

    // Update project status
    await c.env.DB.prepare(
      "UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(projectId).run();

    return c.json({ success: true, toolCount: tools.length });
  } catch (error) {
    console.error("[discover] Tool discovery error:", error);
    console.error("[discover] Error type:", typeof error);
    console.error("[discover] Error details:", error instanceof Error ? error.message : String(error));
    console.error("[discover] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Try to extract more detailed error info
    if (error && typeof error === 'object' && 'response' in error) {
      console.error("[discover] API response error:", JSON.stringify(error));
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return c.json({ 
      error: "Failed to discover tools",
      message: errorMessage,
      details: "Check your API key in Settings and try again."
    }, 500);
  }
});

// Get dashboard stats
app.get("/api/dashboard/stats", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get total projects
  const projectCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND is_archived = 0"
  ).bind(user.id).first();

  // Get total tools discovered
  const toolCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tools WHERE user_id = ?"
  ).bind(user.id).first();

  // Get total tools built (with HTML)
  const builtToolCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tools WHERE user_id = ? AND html_content IS NOT NULL"
  ).bind(user.id).first();

  // Get total SEO pages
  const seoPageCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM seo_content WHERE user_id = ?"
  ).bind(user.id).first();

  // Get recent projects with tool counts
  const recentProjects = await c.env.DB.prepare(
    `SELECT p.*, COUNT(t.id) as tool_count 
     FROM projects p 
     LEFT JOIN tools t ON p.id = t.project_id 
     WHERE p.user_id = ? AND p.is_archived = 0 
     GROUP BY p.id 
     ORDER BY p.updated_at DESC 
     LIMIT 5`
  ).bind(user.id).all();

  return c.json({
    projectCount: projectCount?.count || 0,
    toolCount: toolCount?.count || 0,
    builtToolCount: builtToolCount?.count || 0,
    seoPageCount: seoPageCount?.count || 0,
    recentProjects: recentProjects.results || []
  });
});

// Get all user projects
app.get("/api/projects", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const projects = await c.env.DB.prepare(
    `SELECT p.*, COUNT(t.id) as tool_count 
     FROM projects p 
     LEFT JOIN tools t ON p.id = t.project_id 
     WHERE p.user_id = ? AND p.is_archived = 0 
     GROUP BY p.id 
     ORDER BY p.created_at DESC`
  ).bind(user.id).all();

  return c.json({ projects: projects.results });
});

// Archive a project
app.post("/api/projects/:id/archive", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const projectId = c.req.param("id");

  const project = await c.env.DB.prepare(
    "SELECT id FROM projects WHERE id = ? AND user_id = ?"
  ).bind(projectId, user.id).first();

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE projects SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(projectId).run();

  return c.json({ success: true });
});

// Delete a project
app.delete("/api/projects/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const projectId = c.req.param("id");

  const project = await c.env.DB.prepare(
    "SELECT id FROM projects WHERE id = ? AND user_id = ?"
  ).bind(projectId, user.id).first();

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Delete all tools associated with this project
  await c.env.DB.prepare(
    "DELETE FROM tools WHERE project_id = ?"
  ).bind(projectId).run();

  // Delete all SEO content associated with tools in this project
  await c.env.DB.prepare(
    "DELETE FROM seo_content WHERE tool_id IN (SELECT id FROM tools WHERE project_id = ?)"
  ).bind(projectId).run();

  // Delete the project
  await c.env.DB.prepare(
    "DELETE FROM projects WHERE id = ?"
  ).bind(projectId).run();

  return c.json({ success: true });
});

// Get all magnets across all projects
app.get("/api/magnets", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const magnets = await c.env.DB.prepare(
    `SELECT t.*, p.name as project_name 
     FROM tools t 
     INNER JOIN projects p ON t.project_id = p.id 
     WHERE t.user_id = ? AND t.blueprint IS NOT NULL
     ORDER BY t.created_at DESC`
  ).bind(user.id).all();

  return c.json({ magnets: magnets.results });
});

// Get single project
app.get("/api/projects/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const projectId = c.req.param("id");

  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).bind(projectId, user.id).first();

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  // Get tools for this project
  const tools = await c.env.DB.prepare(
    "SELECT * FROM tools WHERE project_id = ? ORDER BY overall_score DESC"
  ).bind(projectId).all();

  // Return blueprints as-is (strings from database) - frontend will parse
  console.log("[GET /api/projects/:id] Returning tools with blueprint strings");

  return c.json({ project, tools: tools.results });
});

// Get single tool
app.get("/api/tools/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT t.*, p.name as project_name FROM tools t JOIN projects p ON t.project_id = p.id WHERE t.id = ? AND t.user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  // Return blueprint as-is (string from database) - frontend will parse
  console.log("[GET /api/tools/:id] Returning blueprint as string");

  // Get SEO content if exists
  const seoContent = await c.env.DB.prepare(
    "SELECT * FROM seo_content WHERE tool_id = ? LIMIT 1"
  ).bind(toolId).first();

  return c.json({ tool, seo_content: seoContent || null });
});

// Validation function — catches incomplete blueprints at the API level
function validateBlueprint(bp: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Essential fields only - be more lenient
  if (!bp.title || typeof bp.title !== 'string' || bp.title.length < 3) {
    errors.push(`title is required (got: ${bp.title})`);
  }
  
  if (!bp.purpose || typeof bp.purpose !== 'string' || bp.purpose.length < 10) {
    errors.push(`purpose is required and must be at least 10 characters (got ${bp.purpose?.length || 0})`);
  }
  
  // Optional but should be arrays if present
  if (bp.target_keywords && !Array.isArray(bp.target_keywords)) {
    errors.push("target_keywords must be an array");
  }
  
  if (bp.inputs_required && !Array.isArray(bp.inputs_required)) {
    errors.push("inputs_required must be an array");
  }
  
  if (bp.internal_links && !Array.isArray(bp.internal_links)) {
    errors.push("internal_links must be an array");
  }
  
  if (bp.features && !Array.isArray(bp.features)) {
    errors.push("features must be an array");
  }
  
  if (bp.theme_suggestions && !Array.isArray(bp.theme_suggestions)) {
    errors.push("theme_suggestions must be an array");
  }
  
  console.log("[validateBlueprint] Validation result:", { valid: errors.length === 0, errors, fields: Object.keys(bp) });
  
  return { valid: errors.length === 0, errors };
}

// Generate blueprint for a tool
app.post("/api/tools/:id/blueprint", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT t.*, p.niche, p.goal FROM tools t JOIN projects p ON t.project_id = p.id WHERE t.id = ? AND t.user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  if (tool.blueprint) {
    return c.json({ error: "Blueprint already generated" }, 400);
  }

  // Get API keys - try both Anthropic and OpenAI
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT anthropic_key, openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const anthropicKey = apiKeyRecord?.anthropic_key as string | null || c.env.ANTHROPIC_API_KEY;
  const openaiKey = apiKeyRecord?.openai_key as string | null || c.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    return c.json({ error: "API key not configured. Please add your OpenAI or Anthropic API key in Settings." }, 400);
  }

  try {
    console.log("[Blueprint] Starting generation for tool:", toolId);
    console.log("[Blueprint] Tool name:", tool.name);
    console.log("[Blueprint] Niche:", tool.niche);
    console.log("[Blueprint] Has Anthropic key:", !!anthropicKey);
    console.log("[Blueprint] Has OpenAI key:", !!openaiKey);

    const blueprintJson = await generateBlueprint(
      tool.name as string,
      tool.niche as string,
      tool.category as string | null,
      tool.goal as string | null,
      anthropicKey,
      openaiKey
    );

    console.log("[Blueprint] Generation complete, raw length:", blueprintJson?.length);

    // Parse and validate
    let blueprint;
    try {
      blueprint = JSON.parse(blueprintJson);
      console.log("[Blueprint] JSON parsed successfully");
      console.log("[Blueprint] Parsed blueprint fields:", Object.keys(blueprint));
      console.log("[Blueprint] Title:", blueprint.title);
      console.log("[Blueprint] Purpose length:", blueprint.purpose?.length);
      console.log("[Blueprint] Has target_keywords:", !!blueprint.target_keywords);
      console.log("[Blueprint] Has inputs_required:", !!blueprint.inputs_required);
    } catch (parseError) {
      console.error("[Blueprint] JSON parse failed:", parseError);
      console.error("[Blueprint] Raw response:", blueprintJson?.substring(0, 500));
      return c.json({ 
        error: "Invalid JSON response from AI", 
        details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        raw: blueprintJson?.substring(0, 200)
      }, 500);
    }

    const validation = validateBlueprint(blueprint);
    
    if (!validation.valid) {
      console.error("[Blueprint] Validation failed:", validation.errors);
      console.error("[Blueprint] Blueprint object:", JSON.stringify(blueprint, null, 2));
      return c.json({ 
        error: "Incomplete blueprint generated", 
        details: validation.errors,
        fields_received: Object.keys(blueprint)
      }, 500);
    }

    // Ensure all expected array fields exist (set defaults for missing ones)
    blueprint.target_keywords = blueprint.target_keywords || [];
    blueprint.inputs_required = blueprint.inputs_required || [];
    blueprint.internal_links = blueprint.internal_links || [];
    blueprint.features = blueprint.features || [];
    blueprint.theme_suggestions = blueprint.theme_suggestions || [];

    // CRITICAL: Clean text fields to ensure they don't contain serialized JSON
    // This prevents raw JSON fragments from appearing in the UI
    const cleanTextField = (field: any): string => {
      if (typeof field !== 'string') return '';
      
      // Remove any JSON-like patterns from text fields
      let cleaned = field
        .replace(/"target_keywords":\s*\[.*?\]/gi, '')
        .replace(/"internal_links":\s*\[.*?\]/gi, '')
        .replace(/"seo_title":\s*".*?"/gi, '')
        .replace(/"seo_description":\s*".*?"/gi, '')
        .replace(/"cta_text":\s*".*?"/gi, '')
        .replace(/"monetization_strategy":\s*".*?"/gi, '')
        .replace(/"features":\s*\[.*?\]/gi, '')
        .replace(/"inputs_required":\s*\[.*?\]/gi, '')
        .replace(/\{[^}]*"[^"]+"\s*:\s*[^}]+\}/g, '') // Remove inline JSON objects
        .trim();
      
      return cleaned;
    };

    // Clean all text fields
    blueprint.purpose = cleanTextField(blueprint.purpose);
    blueprint.description = cleanTextField(blueprint.description);
    blueprint.monetization_strategy = cleanTextField(blueprint.monetization_strategy);
    blueprint.cta_text = cleanTextField(blueprint.cta_text);
    blueprint.calculation_logic = cleanTextField(blueprint.calculation_logic);
    blueprint.output_type = cleanTextField(blueprint.output_type);
    blueprint.seo_title = cleanTextField(blueprint.seo_title);
    blueprint.seo_description = cleanTextField(blueprint.seo_description);

    console.log("[Blueprint] Cleaned text fields - checking purpose:", blueprint.purpose?.substring(0, 100));
    console.log("[Blueprint] Purpose contains JSON?", blueprint.purpose?.includes('"target_keywords"'));

    // Re-stringify the modified blueprint object
    const finalBlueprint = JSON.stringify(blueprint);

    console.log("[Blueprint] Validation passed, saving to database");

    await c.env.DB.prepare(
      "UPDATE tools SET blueprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(finalBlueprint, toolId).run();

    console.log("[Blueprint] Saved successfully");
    console.log("[Blueprint] Returning blueprint as string, length:", finalBlueprint.length);

    // Return as string (matches database storage) so frontend parses consistently
    return c.json({ blueprint: finalBlueprint });
  } catch (error) {
    console.error("[Blueprint] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("[Blueprint] Error stack:", errorStack);
    return c.json({ 
      error: "Blueprint generation failed", 
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error
    }, 500);
  }
});

// Regenerate blueprint for a tool
app.post("/api/tools/:id/blueprint/regenerate", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT t.*, p.niche, p.goal FROM tools t JOIN projects p ON t.project_id = p.id WHERE t.id = ? AND t.user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  // Get API key - try Anthropic first, then OpenAI
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT anthropic_key, openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const anthropicKey = apiKeyRecord?.anthropic_key as string | null || c.env.ANTHROPIC_API_KEY;
  const openaiKey = apiKeyRecord?.openai_key as string | null || c.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    return c.json({ error: "API key not configured. Please add your OpenAI or Anthropic API key in Settings." }, 400);
  }

  try {
    const blueprintJson = await regenerateBlueprintFromBlueprint(
      tool.blueprint as string,
      tool.niche as string,
      tool.goal as string || "Generate traffic",
      anthropicKey,
      openaiKey
    );

    // Parse and validate
    const blueprint = JSON.parse(blueprintJson);
    const validation = validateBlueprint(blueprint);
    
    if (!validation.valid) {
      console.error("Blueprint validation failed:", validation.errors);
      return c.json({ 
        error: "Incomplete blueprint generated", 
        details: validation.errors 
      }, 500);
    }

    // Ensure all expected array fields exist
    blueprint.target_keywords = blueprint.target_keywords || [];
    blueprint.inputs_required = blueprint.inputs_required || [];
    blueprint.internal_links = blueprint.internal_links || [];
    blueprint.features = blueprint.features || [];
    blueprint.theme_suggestions = blueprint.theme_suggestions || [];

    // CRITICAL: Clean text fields to ensure they don't contain serialized JSON
    const cleanTextField = (field: any): string => {
      if (typeof field !== 'string') return '';
      
      // Remove any JSON-like patterns from text fields
      let cleaned = field
        .replace(/"target_keywords":\s*\[.*?\]/gi, '')
        .replace(/"internal_links":\s*\[.*?\]/gi, '')
        .replace(/"seo_title":\s*".*?"/gi, '')
        .replace(/"seo_description":\s*".*?"/gi, '')
        .replace(/"cta_text":\s*".*?"/gi, '')
        .replace(/"monetization_strategy":\s*".*?"/gi, '')
        .replace(/"features":\s*\[.*?\]/gi, '')
        .replace(/"inputs_required":\s*\[.*?\]/gi, '')
        .replace(/\{[^}]*"[^"]+"\s*:\s*[^}]+\}/g, '')
        .trim();
      
      return cleaned;
    };

    // Clean all text fields
    blueprint.purpose = cleanTextField(blueprint.purpose);
    blueprint.description = cleanTextField(blueprint.description);
    blueprint.monetization_strategy = cleanTextField(blueprint.monetization_strategy);
    blueprint.cta_text = cleanTextField(blueprint.cta_text);
    blueprint.calculation_logic = cleanTextField(blueprint.calculation_logic);
    blueprint.output_type = cleanTextField(blueprint.output_type);
    blueprint.seo_title = cleanTextField(blueprint.seo_title);
    blueprint.seo_description = cleanTextField(blueprint.seo_description);

    // Re-stringify for storage
    const finalBlueprint = JSON.stringify(blueprint);

    await c.env.DB.prepare(
      "UPDATE tools SET blueprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(finalBlueprint, toolId).run();

    console.log("[Regenerate] Returning blueprint as string, length:", finalBlueprint.length);

    // Return as string (matches database storage) so frontend parses consistently
    return c.json({ blueprint: finalBlueprint });
  } catch (error) {
    console.error("Blueprint regeneration error:", error);
    return c.json({ error: "Failed to regenerate blueprint" }, 500);
  }
});

// Generate HTML for a tool
app.post("/api/tools/:id/html", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");
  const body = await c.req.json();
  const action = body.action || "standalone"; // "standalone" or "embed"

  const tool = await c.env.DB.prepare(
    "SELECT * FROM tools WHERE id = ? AND user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  if (!tool.blueprint) {
    return c.json({ error: "Blueprint must be generated first" }, 400);
  }

  // Get API key - try Anthropic first, then OpenAI
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT anthropic_key, openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const anthropicKey = apiKeyRecord?.anthropic_key as string | null || c.env.ANTHROPIC_API_KEY;
  const openaiKey = apiKeyRecord?.openai_key as string | null || c.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    return c.json({ error: "API key not configured. Please add your OpenAI or Anthropic API key in Settings." }, 400);
  }

  try {
    const html = await generateToolHTML(
      tool.blueprint as string,
      action as "standalone" | "embed",
      anthropicKey,
      openaiKey
    );

    await c.env.DB.prepare(
      "UPDATE tools SET html_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(html, toolId).run();

    return c.json({ html });
  } catch (error) {
    console.error("HTML generation error:", error);
    return c.json({ error: "Failed to generate HTML" }, 500);
  }
});

// Apply a blueprint variation to a tool
app.post("/api/tools/:id/blueprint/apply", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT * FROM tools WHERE id = ? AND user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  const body = await c.req.json();
  const { blueprint } = body;

  if (!blueprint) {
    return c.json({ error: "Blueprint required" }, 400);
  }

  try {
    await c.env.DB.prepare(
      "UPDATE tools SET blueprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
    ).bind(blueprint, toolId, user.id).run();

    console.log("[Apply Blueprint] Updated tool:", toolId);
    return c.json({ success: true });
  } catch (error) {
    console.error("[Apply Blueprint] Error:", error);
    return c.json({ error: "Failed to apply blueprint" }, 500);
  }
});

// Generate blueprint variations for a tool
app.post("/api/tools/:id/variations", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT * FROM tools WHERE id = ? AND user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  if (!tool.blueprint) {
    return c.json({ error: "Blueprint must be generated first" }, 400);
  }

  const body = await c.req.json();
  const { variationA, variationB } = body;

  if (!variationA || !variationB) {
    return c.json({ error: "Both variation configurations required" }, 400);
  }

  // Get API keys
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT anthropic_key, openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const anthropicKey = apiKeyRecord?.anthropic_key as string | null || c.env.ANTHROPIC_API_KEY;
  const openaiKey = apiKeyRecord?.openai_key as string | null || c.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    return c.json({ error: "API key not configured. Please add your OpenAI or Anthropic API key in Settings." }, 400);
  }

  try {
    console.log("[Variations Endpoint] Starting generation for tool:", toolId);
    
    // Parse the blueprint
    let blueprintObj;
    try {
      blueprintObj = JSON.parse(tool.blueprint as string);
    } catch (e) {
      // If blueprint is text format, create a minimal object
      blueprintObj = {
        title: tool.name,
        description: tool.description,
        category: tool.category,
        blueprint_text: tool.blueprint
      };
    }

    // Generate Variation A
    console.log("[Variations] Generating Variation A:", variationA.audience, variationA.monetization);
    const variationAJson = await generateVariation(
      blueprintObj,
      variationA.audience,
      variationA.monetization,
      anthropicKey,
      openaiKey
    );

    // Generate Variation B
    console.log("[Variations] Generating Variation B:", variationB.audience, variationB.monetization);
    const variationBJson = await generateVariation(
      blueprintObj,
      variationB.audience,
      variationB.monetization,
      anthropicKey,
      openaiKey
    );

    // Parse the results
    const varA = JSON.parse(variationAJson);
    const varB = JSON.parse(variationBJson);

    // Add summary field for each variation
    const variationAWithSummary = {
      ...varA,
      audience: variationA.audience,
      monetization: variationA.monetization,
      summary: `This angle is strong because it directly addresses the needs and challenges faced by ${variationA.audience}.`
    };

    const variationBWithSummary = {
      ...varB,
      audience: variationB.audience,
      monetization: variationB.monetization,
      summary: `This angle is strong because it directly addresses the needs and challenges faced by ${variationB.audience}.`
    };

    console.log("[Variations Endpoint] Generated successfully");

    return c.json({
      variationA: variationAWithSummary,
      variationB: variationBWithSummary
    });

  } catch (error) {
    console.error("[Variations] Generation error:", error);
    return c.json({ error: "Failed to generate variations" }, 500);
  }
});

// Generate landing page for a tool
app.post("/api/tools/:id/landing-page", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT * FROM tools WHERE id = ? AND user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  if (!tool.blueprint) {
    return c.json({ error: "Blueprint must be generated first" }, 400);
  }

  // Get API keys
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT anthropic_key, openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const anthropicKey = apiKeyRecord?.anthropic_key as string | null || c.env.ANTHROPIC_API_KEY;
  const openaiKey = apiKeyRecord?.openai_key as string | null || c.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    return c.json({ error: "API key not configured. Please add your OpenAI or Anthropic API key in Settings." }, 400);
  }

  try {
    console.log("[Landing Page Endpoint] Starting generation for tool:", toolId);

    let blueprint;
    try {
      blueprint = typeof tool.blueprint === "string"
        ? JSON.parse(tool.blueprint)
        : tool.blueprint;
    } catch (parseError) {
      console.warn("[Landing Page Endpoint] Blueprint JSON parse failed, using tool fallback:", parseError);
      blueprint = {};
    }

    blueprint = {
      title: tool.name,
      category: tool.category || "Calculator",
      description: tool.description || "",
      purpose: tool.description || `Help users with ${tool.name}`,
      target_keywords: [],
      inputs_required: [],
      features: [],
      cta_text: `Start using ${tool.name}`,
      ...blueprint,
    };

    if (typeof blueprint.title !== "string" || !blueprint.title.trim()) {
      blueprint.title = tool.name;
    }
    if (typeof blueprint.description !== "string") {
      blueprint.description = tool.description || "";
    }
    if (typeof blueprint.purpose !== "string" || !blueprint.purpose.trim()) {
      blueprint.purpose = tool.description || `Help users with ${tool.name}`;
    }
    if (typeof blueprint.category !== "string" || !blueprint.category.trim()) {
      blueprint.category = tool.category || "Calculator";
    }
    if (typeof blueprint.cta_text !== "string" || !blueprint.cta_text.trim()) {
      blueprint.cta_text = `Start using ${tool.name}`;
    }
    
    const landingPageHtml = await generateLandingPage(
      blueprint,
      anthropicKey,
      openaiKey
    );

    console.log("[Landing Page Endpoint] Generated successfully, length:", landingPageHtml.length);

    // Store in landing_page_html column (we may need to add this column)
    await c.env.DB.prepare(
      "UPDATE tools SET landing_page_html = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(landingPageHtml, toolId).run();

    return c.json({ html: landingPageHtml });
  } catch (error) {
    console.error("[Landing Page Endpoint] Generation error:", error);
    return c.json({
      error: "Failed to generate landing page",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Generate SEO content for a tool
app.post("/api/tools/:id/seo", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const toolId = c.req.param("id");

  const tool = await c.env.DB.prepare(
    "SELECT t.*, p.niche FROM tools t JOIN projects p ON t.project_id = p.id WHERE t.id = ? AND t.user_id = ?"
  ).bind(toolId, user.id).first();

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  if (!tool.html_content) {
    return c.json({ error: "HTML must be generated first" }, 400);
  }

  // Check if SEO content already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM seo_content WHERE tool_id = ? LIMIT 1"
  ).bind(toolId).first();

  // Get API key
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const userApiKey = apiKeyRecord?.openai_key as string | null;
  const apiKey = userApiKey || c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: "OpenAI API key not configured" }, 400);
  }

  try {
    const seoContent = await generateSEOContent(
      tool.name as string,
      tool.description as string,
      tool.niche as string,
      apiKey
    );

    if (existing) {
      // Update existing SEO content
      await c.env.DB.prepare(
        `UPDATE seo_content 
         SET intro_text = ?, h2_sections = ?, faqs = ?, meta_title = ?, meta_description = ?, cta_text = ?, updated_at = CURRENT_TIMESTAMP
         WHERE tool_id = ?`
      ).bind(
        seoContent.intro_text,
        JSON.stringify(seoContent.h2_sections),
        JSON.stringify(seoContent.faqs),
        seoContent.meta_title,
        seoContent.meta_description,
        seoContent.cta_text,
        toolId
      ).run();
    } else {
      // Insert new SEO content
      await c.env.DB.prepare(
        `INSERT INTO seo_content (tool_id, user_id, intro_text, h2_sections, faqs, meta_title, meta_description, cta_text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).bind(
        toolId,
        user.id,
        seoContent.intro_text,
        JSON.stringify(seoContent.h2_sections),
        JSON.stringify(seoContent.faqs),
        seoContent.meta_title,
        seoContent.meta_description,
        seoContent.cta_text
      ).run();
    }

    return c.json(seoContent);
  } catch (error) {
    console.error("SEO content generation error:", error);
    return c.json({ error: "Failed to generate SEO content" }, 500);
  }
});

// Generate content wrapper package
app.post("/api/content-wrapper/generate", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  const { blueprint, target_keyword, niche_topic, include_cta, cta_type, cta_text, cta_url } = body;

  if (!blueprint || !target_keyword || !niche_topic) {
    return c.json({ error: "Blueprint, target keyword, and niche topic are required" }, 400);
  }

  // Get API key
  const apiKeyRecord = await c.env.DB.prepare(
    "SELECT openai_key FROM api_keys WHERE user_id = ? LIMIT 1"
  ).bind(user.id).first();

  const userApiKey = apiKeyRecord?.openai_key as string | null;
  const apiKey = userApiKey || c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: "OpenAI API key not configured" }, 400);
  }

  try {
    const contentPackage = await generateContentWrapper(
      target_keyword,
      niche_topic,
      blueprint,
      include_cta || false,
      cta_type || null,
      cta_text || null,
      cta_url || null,
      apiKey
    );

    return c.json(contentPackage);
  } catch (error) {
    console.error("Content wrapper generation error:", error);
    return c.json({ error: "Failed to generate content package" }, 500);
  }
});

// Get all content campaigns
app.get("/api/content-campaigns", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const campaigns = await c.env.DB.prepare(
    `SELECT c.*, t.name as tool_name 
     FROM content_campaigns c 
     LEFT JOIN tools t ON c.tool_id = t.id 
     WHERE c.user_id = ? 
     ORDER BY c.created_at DESC`
  ).bind(user.id).all();

  return c.json({ campaigns: campaigns.results });
});

// Save a content campaign
app.post("/api/content-campaigns", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  const {
    name,
    project_id,
    tool_id,
    blueprint,
    target_keyword,
    niche_topic,
    embed_code,
    include_cta,
    cta_type,
    cta_text,
    cta_url,
    page_h1,
    introduction,
    how_it_works,
    key_benefits,
    semantic_keywords,
    faq_section,
    meta_title,
    meta_description,
    cta_block,
    full_page_html
  } = body;

  if (!name) {
    return c.json({ error: "Campaign name is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO content_campaigns (
      user_id, project_id, tool_id, name, blueprint, target_keyword, niche_topic, 
      embed_code, include_cta, cta_type, cta_text, cta_url, page_h1,
      introduction, how_it_works, key_benefits, semantic_keywords, faq_section,
      seo_title, meta_description, cta_block, full_page_html
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    project_id || null,
    tool_id || null,
    name,
    blueprint || null,
    target_keyword || null,
    niche_topic || null,
    embed_code || null,
    include_cta ? 1 : 0,
    cta_type || null,
    cta_text || null,
    cta_url || null,
    page_h1 || null,
    introduction || null,
    how_it_works || null,
    key_benefits || null,
    semantic_keywords || null,
    faq_section || null,
    meta_title || null,
    meta_description || null,
    cta_block || null,
    full_page_html || null
  ).run();

  return c.json({ id: result.meta.last_row_id, name });
});

// Get a specific campaign
app.get("/api/content-campaigns/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const campaignId = c.req.param("id");

  const campaign = await c.env.DB.prepare(
    "SELECT * FROM content_campaigns WHERE id = ? AND user_id = ?"
  ).bind(campaignId, user.id).first();

  if (!campaign) {
    return c.json({ error: "Campaign not found" }, 404);
  }

  return c.json(campaign);
});

// Delete a campaign
app.delete("/api/content-campaigns/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const campaignId = c.req.param("id");

  const campaign = await c.env.DB.prepare(
    "SELECT id FROM content_campaigns WHERE id = ? AND user_id = ?"
  ).bind(campaignId, user.id).first();

  if (!campaign) {
    return c.json({ error: "Campaign not found" }, 404);
  }

  await c.env.DB.prepare(
    "DELETE FROM content_campaigns WHERE id = ?"
  ).bind(campaignId).run();

  return c.json({ success: true });
});

export default app;
