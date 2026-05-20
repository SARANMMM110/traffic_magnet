import { Hono } from "hono";
import type { Context } from "hono";
import { handleAvatarUpload } from "./avatarHandler";

const gptRoutes = new Hono();

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  R2_BUCKET: R2Bucket;
}

interface MochaUser {
  id: string;
  email: string;
  google_user_data: {
    email: string;
    name?: string;
    picture?: string;
  };
}

// List all GPTs for user
gptRoutes.get("/", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await c.env.DB.prepare(
      `SELECT 
        g.*,
        (SELECT GROUP_CONCAT(capability_type) FROM gpt_capabilities WHERE gpt_id = g.id AND enabled = 1) as capabilities
      FROM gpts g 
      WHERE g.user_id = ? 
      ORDER BY g.updated_at DESC`
    )
      .bind(user.id)
      .all();

    const gpts = (result.results || []).map((row: any) => ({
      ...row,
      capabilities: row.capabilities ? row.capabilities.split(",") : [],
      memory_enabled: Boolean(row.memory_enabled),
      multi_step_reasoning: Boolean(row.multi_step_reasoning),
      web_awareness: Boolean(row.web_awareness),
    }));

    return c.json({ gpts });
  } catch (error) {
    console.error("Error fetching GPTs:", error);
    return c.json({ error: "Failed to fetch GPTs" }, 500);
  }
});

// Get single GPT
gptRoutes.get("/:id", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const gptResult = await c.env.DB.prepare(
      "SELECT * FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!gptResult) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Get capabilities
    const capabilitiesResult = await c.env.DB.prepare(
      "SELECT * FROM gpt_capabilities WHERE gpt_id = ?"
    )
      .bind(gptId)
      .all();

    // Get knowledge files
    const knowledgeResult = await c.env.DB.prepare(
      "SELECT * FROM gpt_knowledge_files WHERE gpt_id = ?"
    )
      .bind(gptId)
      .all();

    // Get actions
    const actionsResult = await c.env.DB.prepare(
      "SELECT * FROM gpt_actions WHERE gpt_id = ?"
    )
      .bind(gptId)
      .all();

    const gpt = {
      ...gptResult,
      memory_enabled: Boolean(gptResult.memory_enabled),
      multi_step_reasoning: Boolean(gptResult.multi_step_reasoning),
      web_awareness: Boolean(gptResult.web_awareness),
      capabilities: capabilitiesResult.results || [],
      knowledge_files: knowledgeResult.results || [],
      actions: actionsResult.results || [],
    };

    return c.json({ gpt });
  } catch (error) {
    console.error("Error fetching GPT:", error);
    return c.json({ error: "Failed to fetch GPT" }, 500);
  }
});

// Create new GPT
gptRoutes.post("/", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO gpts (
        user_id, name, description, avatar_url, category, model,
        instructions, personality, tone, welcome_message,
        conversation_starters, creativity, response_length,
        memory_enabled, multi_step_reasoning, web_awareness,
        visibility, deploy_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        user.id,
        body.name || "New GPT",
        body.description || "",
        body.avatar_url || null,
        body.category || "general",
        body.model || "gpt-4o",
        body.instructions || "",
        body.personality || "",
        body.tone || "",
        body.welcome_message || "Hello! How can I help you today?",
        body.conversation_starters || "",
        body.creativity || 0.7,
        body.response_length || "balanced",
        body.memory_enabled ? 1 : 0,
        body.multi_step_reasoning ? 1 : 0,
        body.web_awareness ? 1 : 0,
        body.visibility || "private",
        body.deploy_status || "draft"
      )
      .run();

    const gptId = result.meta.last_row_id;

    // Create default capabilities if provided
    if (body.capabilities && Array.isArray(body.capabilities)) {
      for (const cap of body.capabilities) {
        await c.env.DB.prepare(
          "INSERT INTO gpt_capabilities (gpt_id, capability_type, enabled) VALUES (?, ?, ?)"
        )
          .bind(gptId, cap, 1)
          .run();
      }
    }

    return c.json({ gpt_id: gptId, success: true });
  } catch (error) {
    console.error("Error creating GPT:", error);
    return c.json({ error: "Failed to create GPT" }, 500);
  }
});

// Update GPT
gptRoutes.patch("/:id", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const body = await c.req.json();

    // Verify ownership
    const existing = await c.env.DB.prepare(
      "SELECT id FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!existing) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(body.description);
    }
    if (body.avatar_url !== undefined) {
      updates.push("avatar_url = ?");
      values.push(body.avatar_url);
    }
    if (body.category !== undefined) {
      updates.push("category = ?");
      values.push(body.category);
    }
    if (body.model !== undefined) {
      updates.push("model = ?");
      values.push(body.model);
    }
    if (body.instructions !== undefined) {
      updates.push("instructions = ?");
      values.push(body.instructions);
    }
    if (body.personality !== undefined) {
      updates.push("personality = ?");
      values.push(body.personality);
    }
    if (body.tone !== undefined) {
      updates.push("tone = ?");
      values.push(body.tone);
    }
    if (body.welcome_message !== undefined) {
      updates.push("welcome_message = ?");
      values.push(body.welcome_message);
    }
    if (body.conversation_starters !== undefined) {
      updates.push("conversation_starters = ?");
      values.push(body.conversation_starters);
    }
    if (body.creativity !== undefined) {
      updates.push("creativity = ?");
      values.push(body.creativity);
    }
    if (body.response_length !== undefined) {
      updates.push("response_length = ?");
      values.push(body.response_length);
    }
    if (body.memory_enabled !== undefined) {
      updates.push("memory_enabled = ?");
      values.push(body.memory_enabled ? 1 : 0);
    }
    if (body.multi_step_reasoning !== undefined) {
      updates.push("multi_step_reasoning = ?");
      values.push(body.multi_step_reasoning ? 1 : 0);
    }
    if (body.web_awareness !== undefined) {
      updates.push("web_awareness = ?");
      values.push(body.web_awareness ? 1 : 0);
    }
    if (body.visibility !== undefined) {
      updates.push("visibility = ?");
      values.push(body.visibility);
    }
    if (body.deploy_status !== undefined) {
      updates.push("deploy_status = ?");
      values.push(body.deploy_status);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    if (updates.length > 0) {
      await c.env.DB.prepare(
        `UPDATE gpts SET ${updates.join(", ")} WHERE id = ?`
      )
        .bind(...values, gptId)
        .run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating GPT:", error);
    return c.json({ error: "Failed to update GPT" }, 500);
  }
});

// Delete GPT
gptRoutes.delete("/:id", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    // Verify ownership
    const existing = await c.env.DB.prepare(
      "SELECT id FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!existing) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Delete related records
    await c.env.DB.prepare("DELETE FROM gpt_capabilities WHERE gpt_id = ?")
      .bind(gptId)
      .run();
    await c.env.DB.prepare("DELETE FROM gpt_knowledge_files WHERE gpt_id = ?")
      .bind(gptId)
      .run();
    await c.env.DB.prepare("DELETE FROM gpt_actions WHERE gpt_id = ?")
      .bind(gptId)
      .run();
    await c.env.DB.prepare("DELETE FROM gpt_memories WHERE gpt_id = ?")
      .bind(gptId)
      .run();
    await c.env.DB.prepare("DELETE FROM gpt_embeddings WHERE gpt_id = ?")
      .bind(gptId)
      .run();

    // Delete GPT
    await c.env.DB.prepare("DELETE FROM gpts WHERE id = ?").bind(gptId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting GPT:", error);
    return c.json({ error: "Failed to delete GPT" }, 500);
  }
});

// Update capabilities
gptRoutes.post("/:id/capabilities", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    // Verify ownership
    const existing = await c.env.DB.prepare(
      "SELECT id FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!existing) {
      return c.json({ error: "GPT not found" }, 404);
    }

    const body = await c.req.json();
    const { capability_type, enabled } = body;

    // Check if capability exists
    const capResult = await c.env.DB.prepare(
      "SELECT id FROM gpt_capabilities WHERE gpt_id = ? AND capability_type = ?"
    )
      .bind(gptId, capability_type)
      .first();

    if (capResult) {
      // Update existing
      await c.env.DB.prepare(
        "UPDATE gpt_capabilities SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE gpt_id = ? AND capability_type = ?"
      )
        .bind(enabled ? 1 : 0, gptId, capability_type)
        .run();
    } else {
      // Create new
      await c.env.DB.prepare(
        "INSERT INTO gpt_capabilities (gpt_id, capability_type, enabled) VALUES (?, ?, ?)"
      )
        .bind(gptId, capability_type, enabled ? 1 : 0)
        .run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating capability:", error);
    return c.json({ error: "Failed to update capability" }, 500);
  }
});

// Chat endpoint
gptRoutes.post("/:id/chat", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const body = await c.req.json();
    const { message, conversation_history } = body;

    if (!message || typeof message !== "string") {
      return c.json({ error: "Message is required" }, 400);
    }

    // Get GPT config
    const gpt = await c.env.DB.prepare(
      "SELECT * FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!gpt) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Get API keys
    const apiKeysResult = await c.env.DB.prepare(
      "SELECT openai_key, anthropic_key, gemini_key, deepseek_key FROM api_keys WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    if (!apiKeysResult?.openai_key && !apiKeysResult?.anthropic_key && !apiKeysResult?.gemini_key && !apiKeysResult?.deepseek_key) {
      return c.json({ error: "No API key configured" }, 400);
    }

    // Get or create conversation and session
    const sessionId = body.session_id || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { getOrCreateConversation, saveMessage, getMemories, formatMemoriesForPrompt } = await import("../services/memoryService");
    
    const conversation = await getOrCreateConversation(c.env.DB, gptId, sessionId, user.id);

    // Retrieve relevant knowledge if available
    let knowledgeContext = "";
    if (apiKeysResult?.openai_key) {
      const { retrieveRelevantKnowledge } = await import("../services/knowledgeProcessor");
      const relevantChunks = await retrieveRelevantKnowledge(
        message,
        gptId,
        c.env.DB,
        apiKeysResult.openai_key as string,
        5
      );
      if (relevantChunks.length > 0) {
        knowledgeContext = relevantChunks.join("\n\n---\n\n");
      }
    }

    // Retrieve memories if enabled
    let memoryContext = "";
    if (gpt.memory_enabled) {
      const memories = await getMemories(c.env.DB, gptId, sessionId, user.id);
      memoryContext = formatMemoriesForPrompt(memories);
    }

    // Import GPT runtime
    const { executeGPT, createStreamParser } = await import("../services/gptRuntime");

    // Determine provider
    const model = (gpt.model as string) || "auto";
    let provider: "openai" | "anthropic" | "gemini" | "deepseek" = "openai";
    if (model.includes("claude") || model.includes("anthropic")) {
      provider = "anthropic";
    } else if (model.includes("gemini")) {
      provider = "gemini";
    } else if (model.includes("deepseek")) {
      provider = "deepseek";
    }

    // Execute GPT
    const stream = await executeGPT({
      gptId,
      config: {
        instructions: (gpt.instructions as string) || "",
        personality: (gpt.personality as string) || "",
        tone: (gpt.tone as string) || "",
        model: model,
        creativity: (gpt.creativity as number) || 0.7,
        memory_enabled: Boolean(gpt.memory_enabled),
        multi_step_reasoning: Boolean(gpt.multi_step_reasoning),
        web_awareness: Boolean(gpt.web_awareness),
      },
      conversationHistory: conversation_history || [],
      userMessage: message,
      openaiKey: apiKeysResult?.openai_key as string | undefined,
      anthropicKey: apiKeysResult?.anthropic_key as string | undefined,
      geminiKey: apiKeysResult?.gemini_key as string | undefined,
      deepseekKey: apiKeysResult?.deepseek_key as string | undefined,
      knowledgeContext: knowledgeContext + memoryContext,
    });

    // Save user message
    await saveMessage(c.env.DB, conversation.id, "user", message);

    // Collect assistant response for saving
    let assistantResponse = "";
    
    // Create transform stream to capture response
    const captureStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        assistantResponse += text;
        controller.enqueue(chunk);
      },
      flush: async () => {
        // Save assistant message after stream completes
        await saveMessage(c.env.DB, conversation.id, "assistant", assistantResponse);
      }
    });

    // Return streaming response
    const parser = createStreamParser(provider);
    const parsedStream = stream.pipeThrough(parser).pipeThrough(captureStream);

    return new Response(parsedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Session-Id": sessionId,
        "X-Conversation-Id": conversation.id.toString(),
      },
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

// GPT Builder assistant endpoint
gptRoutes.post("/builder-assistant", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { message, current_config } = await c.req.json();

    // Get API keys
    const apiKeysResult = await c.env.DB.prepare(
      "SELECT openai_key, anthropic_key, gemini_key, deepseek_key FROM api_keys WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    const openai_key = apiKeysResult?.openai_key as string;
    const anthropic_key = apiKeysResult?.anthropic_key as string;

    if (!openai_key && !anthropic_key) {
      return c.json({
        response:
          "Please add your OpenAI or Anthropic API key in Settings to use the GPT Builder assistant.",
      });
    }

    // Build the builder assistant prompt
    const systemPrompt = `You are the GPT Builder assistant. Your role is to help users create custom GPTs through natural conversation.

IMPORTANT: You must respond with two parts:
1. A conversational response to the user
2. A JSON configuration block wrapped in <CONFIG>...</CONFIG> tags

Current GPT config:
Name: ${current_config.name}
Description: ${current_config.description || "(none)"}
Instructions: ${current_config.instructions || "(none)"}
Conversation Starters: ${current_config.conversation_starters || "(none)"}

Your goals:
- Extract intent from user messages and generate appropriate GPT configuration
- Ask contextual follow-up questions to refine the GPT
- Suggest capabilities based on what they describe
- Generate conversation starters that fit the GPT's purpose
- Be proactive - if they describe something specific, auto-generate the config

When the user describes their GPT, ALWAYS include a <CONFIG> block with updated fields.

Format:
[Your conversational response here]

<CONFIG>
{
  "name": "GPT Name",
  "description": "Clear one-sentence description",
  "instructions": "Detailed instructions for how this GPT should behave",
  "conversation_starters": "Starter 1\\nStarter 2\\nStarter 3\\nStarter 4",
  "personality": "Brief personality description",
  "tone": "professional/casual/friendly/etc"
}
</CONFIG>

Example interaction:
User: "Make me a marketing strategist"
You: "I'll create a marketing strategist GPT for you. This will be an expert who helps with marketing strategy, campaigns, and brand positioning. What specific areas of marketing are most important - content, social media, B2B, ecommerce, or something else?

<CONFIG>
{
  "name": "Marketing Strategist",
  "description": "An expert marketing assistant that provides strategic advice for campaigns and brand growth",
  "instructions": "You are an experienced marketing strategist with expertise across digital marketing, content strategy, social media, and brand positioning. Help users develop effective marketing campaigns, analyze market opportunities, and create actionable marketing plans. Provide specific, actionable advice based on marketing best practices. Ask clarifying questions about their target audience, goals, and constraints to give tailored recommendations.",
  "conversation_starters": "Help me create a content marketing strategy\\nWhat are the best channels for B2B marketing?\\nHow can I improve my email open rates?\\nSuggest ideas for a social media campaign",
  "personality": "Strategic, analytical, creative, and results-oriented",
  "tone": "professional"
}
</CONFIG>"

Now help the user build their GPT.`;

    const userMessage = message;

    let aiResponse = "";
    let updatedConfig: any = null;

    // Try OpenAI first, fall back to Anthropic
    if (openai_key) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openai_key}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          aiResponse = data.choices[0].message.content;

          // Parse the response to extract configuration updates
          updatedConfig = parseBuilderResponse(aiResponse, current_config);
        }
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    if (!aiResponse && anthropic_key) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropic_key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          aiResponse = data.content[0].text;

          // Parse the response to extract configuration updates
          updatedConfig = parseBuilderResponse(aiResponse, current_config);
        }
      } catch (error) {
        console.error("Anthropic error:", error);
      }
    }

    if (!aiResponse) {
      aiResponse =
        "I apologize, but I'm having trouble connecting to the AI service. Please try again.";
    }

    // Strip CONFIG tags from response shown to user
    const displayResponse = aiResponse.replace(/<CONFIG>[\s\S]*?<\/CONFIG>/g, "").trim();

    return c.json({
      response: displayResponse,
      updated_config: updatedConfig,
    });
  } catch (error) {
    console.error("Error in builder assistant:", error);
    return c.json({ error: "Builder assistant failed" }, 500);
  }
});

// Avatar upload endpoint
gptRoutes.post("/:id/avatar", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  
  // Verify ownership
  const existing = await c.env.DB.prepare(
    "SELECT id FROM gpts WHERE id = ? AND user_id = ?"
  )
    .bind(gptId, user.id)
    .first();

  if (!existing) {
    return c.json({ error: "GPT not found" }, 404);
  }

  return handleAvatarUpload(c, gptId, user);
});

// Knowledge file upload endpoint
gptRoutes.post("/:id/knowledge/upload", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    // Verify ownership
    const existing = await c.env.DB.prepare(
      "SELECT id FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!existing) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Get API key for embeddings
    const apiKeysResult = await c.env.DB.prepare(
      "SELECT openai_key FROM api_keys WHERE user_id = ?"
    )
      .bind(user.id)
      .first();

    if (!apiKeysResult?.openai_key) {
      return c.json({ error: "OpenAI API key required for knowledge processing" }, 400);
    }

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "File too large (max 10MB)" }, 400);
    }

    // Generate storage key
    const storageKey = `gpt-knowledge/${user.id}/${gptId}/${Date.now()}-${file.name}`;

    // Upload to R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(storageKey, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Create database record
    const insertResult = await c.env.DB.prepare(
      `INSERT INTO gpt_knowledge_files (gpt_id, user_id, filename, file_type, file_size, storage_key, indexing_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`
    )
      .bind(gptId, user.id, file.name, file.type, file.size, storageKey)
      .run();

    const fileId = insertResult.meta.last_row_id;

    // Process file asynchronously
    const { processKnowledgeFile } = await import("../services/knowledgeProcessor");
    
    // Fire and forget - process in background
    processKnowledgeFile(
      Number(fileId),
      gptId,
      fileBuffer,
      file.type,
      file.name,
      c.env.DB,
      apiKeysResult.openai_key as string
    ).catch((error) => {
      console.error("Background processing error:", error);
    });

    return c.json({
      id: fileId,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      indexing_status: "processing",
    });
  } catch (error) {
    console.error("Error uploading knowledge file:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

// Delete knowledge file endpoint
gptRoutes.delete("/:id/knowledge/:fileId", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  const fileId = parseInt(c.req.param("fileId"));

  try {
    // Verify ownership
    const file = await c.env.DB.prepare(
      "SELECT * FROM gpt_knowledge_files WHERE id = ? AND gpt_id = ? AND user_id = ?"
    )
      .bind(fileId, gptId, user.id)
      .first();

    if (!file) {
      return c.json({ error: "File not found" }, 404);
    }

    // Delete from R2
    await c.env.R2_BUCKET.delete(file.storage_key as string);

    // Delete embeddings
    await c.env.DB.prepare("DELETE FROM gpt_embeddings WHERE knowledge_file_id = ?")
      .bind(fileId)
      .run();

    // Delete file record
    await c.env.DB.prepare("DELETE FROM gpt_knowledge_files WHERE id = ?")
      .bind(fileId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting knowledge file:", error);
    return c.json({ error: "Failed to delete file" }, 500);
  }
});

// Get knowledge file status
gptRoutes.get("/:id/knowledge/:fileId/status", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  const fileId = parseInt(c.req.param("fileId"));

  try {
    const file = await c.env.DB.prepare(
      "SELECT indexing_status, chunk_count, processing_error FROM gpt_knowledge_files WHERE id = ? AND gpt_id = ? AND user_id = ?"
    )
      .bind(fileId, gptId, user.id)
      .first();

    if (!file) {
      return c.json({ error: "File not found" }, 404);
    }

    return c.json({
      indexing_status: file.indexing_status,
      chunk_count: file.chunk_count,
      processing_error: file.processing_error,
    });
  } catch (error) {
    console.error("Error getting file status:", error);
    return c.json({ error: "Failed to get file status" }, 500);
  }
});

// Publish GPT
gptRoutes.post("/:id/publish", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const gpt = await c.env.DB.prepare(
      "SELECT * FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!gpt) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Generate public ID if not exists
    let publicUrl = gpt.public_url as string;
    if (!publicUrl) {
      const publicId = `${(gpt.name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
      publicUrl = `/gpt/${publicId}`;

      await c.env.DB.prepare(
        "UPDATE gpts SET public_url = ?, deploy_status = 'published', updated_at = datetime('now') WHERE id = ?"
      )
        .bind(publicUrl, gptId)
        .run();
    } else {
      await c.env.DB.prepare(
        "UPDATE gpts SET deploy_status = 'published', updated_at = datetime('now') WHERE id = ?"
      )
        .bind(gptId)
        .run();
    }

    return c.json({ public_url: publicUrl });
  } catch (error) {
    console.error("Error publishing GPT:", error);
    return c.json({ error: "Failed to publish GPT" }, 500);
  }
});

// Unpublish GPT
gptRoutes.post("/:id/unpublish", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM gpts WHERE id = ? AND user_id = ?"
    )
      .bind(gptId, user.id)
      .first();

    if (!existing) {
      return c.json({ error: "GPT not found" }, 404);
    }

    await c.env.DB.prepare(
      "UPDATE gpts SET deploy_status = 'draft', updated_at = datetime('now') WHERE id = ?"
    )
      .bind(gptId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error unpublishing GPT:", error);
    return c.json({ error: "Failed to unpublish GPT" }, 500);
  }
});

// Public GPT endpoints (no auth required)
gptRoutes.get("/public/:publicId", async (c: Context<{ Bindings: Env }>) => {
  const publicId = c.req.param("publicId");

  try {
    const gpt = await c.env.DB.prepare(
      "SELECT id, name, description, avatar_url, welcome_message FROM gpts WHERE public_url = ? AND deploy_status = 'published'"
    )
      .bind(`/gpt/${publicId}`)
      .first();

    if (!gpt) {
      return c.json({ error: "GPT not found" }, 404);
    }

    return c.json(gpt);
  } catch (error) {
    console.error("Error loading public GPT:", error);
    return c.json({ error: "Failed to load GPT" }, 500);
  }
});

// Public GPT chat endpoint (no auth required)
gptRoutes.post("/public/:publicId/chat", async (c: Context<{ Bindings: Env }>) => {
  const publicId = c.req.param("publicId");

  try {
    const body = await c.req.json();
    const { message, conversation_history, session_id } = body;

    if (!message || typeof message !== "string") {
      return c.json({ error: "Message is required" }, 400);
    }

    // Get GPT config
    const gpt = await c.env.DB.prepare(
      "SELECT * FROM gpts WHERE public_url = ? AND deploy_status = 'published'"
    )
      .bind(`/gpt/${publicId}`)
      .first();

    if (!gpt) {
      return c.json({ error: "GPT not found" }, 404);
    }

    // Get owner's API keys
    const apiKeysResult = await c.env.DB.prepare(
      "SELECT openai_key, anthropic_key FROM api_keys WHERE user_id = ?"
    )
      .bind(gpt.user_id)
      .first();

    if (!apiKeysResult?.openai_key && !apiKeysResult?.anthropic_key) {
      return c.json({ error: "GPT not configured" }, 500);
    }

    // Handle conversation persistence if memory enabled
    let conversationContext = "";
    let historyToUse = conversation_history || [];
    const memoryEnabled = Boolean(gpt.memory_enabled);
    
    if (memoryEnabled && session_id) {
      const { getOrCreateConversation, saveMessage, getConversationHistory, getMemories, formatMemoriesForPrompt } = await import("../services/memoryService");
      
      // Get or create conversation
      const conversation = await getOrCreateConversation(
        c.env.DB,
        gpt.id as number,
        session_id
      );

      // Save user message
      await saveMessage(c.env.DB, conversation.id, "user", message);

      // Get conversation history
      const history = await getConversationHistory(c.env.DB, conversation.id, 20);
      
      // Get memories
      const memories = await getMemories(c.env.DB, gpt.id as number, session_id);
      
      // Format memory context
      if (memories.length > 0) {
        conversationContext = formatMemoriesForPrompt(memories);
      }

      // Use stored history instead of client-provided
      historyToUse = history.slice(0, -1).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    // Retrieve relevant knowledge if available
    let knowledgeContext = "";
    if (apiKeysResult?.openai_key) {
      const { retrieveRelevantKnowledge } = await import("../services/knowledgeProcessor");
      const relevantChunks = await retrieveRelevantKnowledge(
        message,
        gpt.id as number,
        c.env.DB,
        apiKeysResult.openai_key as string,
        5
      );
      if (relevantChunks.length > 0) {
        knowledgeContext = relevantChunks.join("\n\n---\n\n");
      }
    }

    // Import GPT runtime
    const { executeGPT, createStreamParser } = await import("../services/gptRuntime");

    // Determine provider
    const model = (gpt.model as string) || "auto";
    let provider: "openai" | "anthropic" | "gemini" | "deepseek" = "openai";
    if (model.includes("claude") || model.includes("anthropic")) {
      provider = "anthropic";
    } else if (model.includes("gemini")) {
      provider = "gemini";
    } else if (model.includes("deepseek")) {
      provider = "deepseek";
    }

    // Combine contexts
    let fullContext = "";
    if (conversationContext) fullContext += conversationContext;
    if (knowledgeContext) {
      fullContext += "\n\n## Knowledge Base\n\n" + knowledgeContext;
    }

    // Execute GPT
    const stream = await executeGPT({
      gptId: gpt.id as number,
      config: {
        instructions: (gpt.instructions as string) || "",
        personality: (gpt.personality as string) || "",
        tone: (gpt.tone as string) || "",
        model: model,
        creativity: (gpt.creativity as number) || 0.7,
        memory_enabled: Boolean(gpt.memory_enabled),
        multi_step_reasoning: Boolean(gpt.multi_step_reasoning),
        web_awareness: Boolean(gpt.web_awareness),
      },
      conversationHistory: historyToUse,
      userMessage: message,
      openaiKey: apiKeysResult?.openai_key as string,
      anthropicKey: apiKeysResult?.anthropic_key as string,
      knowledgeContext: fullContext || undefined,
    });

    // Save assistant response if memory enabled
    if (memoryEnabled && session_id) {
      // We'll save it in a background task after streaming completes
      // For now, we'll save a placeholder and update it later
      // In production, you'd want to buffer the response
    }

    // Return streaming response
    const parser = createStreamParser(provider);
    const parsedStream = stream.pipeThrough(parser);

    return new Response(parsedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in public chat:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

function parseBuilderResponse(aiResponse: string, currentConfig: any): any {
  // First try to extract CONFIG block
  const configMatch = aiResponse.match(/<CONFIG>([\s\S]*?)<\/CONFIG>/);
  if (configMatch) {
    try {
      const configJson = JSON.parse(configMatch[1].trim());
      return configJson;
    } catch (error) {
      console.error("Failed to parse CONFIG block:", error);
    }
  }

  // Fallback: extract from natural language
  const updates: any = {};

  // Look for name suggestions
  const nameMatch = aiResponse.match(/(?:name|call it|named?)[:\s]+["']([^"']+)["']/i);
  if (nameMatch && (currentConfig.name === "Untitled GPT" || currentConfig.name === "New GPT")) {
    updates.name = nameMatch[1];
  }

  // Look for description
  const descMatch = aiResponse.match(/(?:description|about)[:\s]+["']([^"']+)["']/i);
  if (descMatch) {
    updates.description = descMatch[1];
  }

  // Look for instructions
  const instMatch = aiResponse.match(/(?:instructions?|behave)[:\s]+["']([^"']+)["']/i);
  if (instMatch) {
    updates.instructions = instMatch[1];
  }

  // Intelligent fallback based on user intent
  if (Object.keys(updates).length === 0 && !currentConfig.instructions) {
    // Try to detect common patterns
    const lowerMessage = aiResponse.toLowerCase();
    
    if (lowerMessage.includes("marketing")) {
      updates.name = "Marketing Assistant";
      updates.description = "A helpful marketing expert that provides strategic advice and creative solutions";
      updates.instructions = "You are a marketing expert who helps users develop effective marketing campaigns, content strategies, and brand positioning. Provide actionable advice based on best practices in digital marketing, SEO, social media, and content creation.";
      updates.conversation_starters = "Help me create a content marketing strategy\nWhat are the best channels for B2B marketing?\nHow can I improve my email open rates?\nSuggest ideas for social media campaigns";
    } else if (lowerMessage.includes("code") || lowerMessage.includes("programming")) {
      updates.name = "Code Assistant";
      updates.description = "A programming expert that helps with code, debugging, and software development";
      updates.instructions = "You are an experienced software engineer who helps users write, debug, and optimize code. Provide clear explanations, suggest best practices, and help solve programming challenges across multiple languages and frameworks.";
      updates.conversation_starters = "Help me debug this code\nExplain how async/await works\nReview my code for improvements\nSuggest a better algorithm for this problem";
    } else if (lowerMessage.includes("writing") || lowerMessage.includes("content")) {
      updates.name = "Writing Assistant";
      updates.description = "A creative writing expert that helps craft compelling content";
      updates.instructions = "You are a skilled writer and editor who helps users create engaging, well-structured content. Provide feedback on writing style, grammar, clarity, and impact. Help brainstorm ideas and refine drafts.";
      updates.conversation_starters = "Help me write a blog post\nReview this draft\nSuggest a better opening paragraph\nBrainstorm article ideas";
    }
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

export function registerGPTRoutes(app: Hono) {
  app.route("/api/gpts", gptRoutes);
}

export default gptRoutes;
