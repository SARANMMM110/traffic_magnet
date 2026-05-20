import { Hono } from "hono";
import type { Context } from "hono";

const gptConversationRoutes = new Hono();

interface Env {
  DB: D1Database;
}

interface MochaUser {
  id: string;
  email: string;
}

// Get conversations for a GPT
gptConversationRoutes.get("/:id/conversations", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const { getGPTConversations } = await import("../services/memoryService");
    const conversations = await getGPTConversations(c.env.DB, gptId, user.id, 50);

    // Get message count for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const msgCount = await c.env.DB.prepare(
          "SELECT COUNT(*) as count FROM gpt_messages WHERE conversation_id = ?"
        )
          .bind(conv.id)
          .first();

        const lastMessage = await c.env.DB.prepare(
          "SELECT content, role, created_at FROM gpt_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1"
        )
          .bind(conv.id)
          .first();

        return {
          ...conv,
          message_count: msgCount?.count || 0,
          last_message: lastMessage || null,
        };
      })
    );

    return c.json({ conversations: conversationsWithCounts });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return c.json({ error: "Failed to fetch conversations" }, 500);
  }
});

// Get conversation history
gptConversationRoutes.get("/:id/conversations/:convId", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  const convId = parseInt(c.req.param("convId"));

  try {
    // Verify ownership
    const conversation = await c.env.DB.prepare(
      "SELECT * FROM gpt_conversations WHERE id = ? AND gpt_id = ? AND user_id = ?"
    )
      .bind(convId, gptId, user.id)
      .first();

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    const { getConversationHistory } = await import("../services/memoryService");
    const messages = await getConversationHistory(c.env.DB, convId, 100);

    return c.json({ conversation, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return c.json({ error: "Failed to fetch conversation" }, 500);
  }
});

// Delete conversation
gptConversationRoutes.delete("/:id/conversations/:convId", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));
  const convId = parseInt(c.req.param("convId"));

  try {
    // Verify ownership
    const conversation = await c.env.DB.prepare(
      "SELECT * FROM gpt_conversations WHERE id = ? AND gpt_id = ? AND user_id = ?"
    )
      .bind(convId, gptId, user.id)
      .first();

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    const { deleteConversation } = await import("../services/memoryService");
    await deleteConversation(c.env.DB, convId);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return c.json({ error: "Failed to delete conversation" }, 500);
  }
});

// Get memories for a GPT
gptConversationRoutes.get("/:id/memories", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const { getMemories } = await import("../services/memoryService");
    const memories = await getMemories(c.env.DB, gptId, undefined, user.id);

    return c.json({ memories });
  } catch (error) {
    console.error("Error fetching memories:", error);
    return c.json({ error: "Failed to fetch memories" }, 500);
  }
});

// Clear memories for a GPT
gptConversationRoutes.delete("/:id/memories", async (c: Context<{ Bindings: Env }>) => {
  const user = c.get("user") as MochaUser;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const gptId = parseInt(c.req.param("id"));

  try {
    const { clearMemories } = await import("../services/memoryService");
    await clearMemories(c.env.DB, gptId, undefined, user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error clearing memories:", error);
    return c.json({ error: "Failed to clear memories" }, 500);
  }
});

export default gptConversationRoutes;
