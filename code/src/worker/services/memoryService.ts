export interface Memory {
  id: number;
  gpt_id: number;
  user_id: string | null;
  session_id: string | null;
  memory_key: string;
  memory_value: string;
  memory_type: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  gpt_id: number;
  session_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a conversation for a session
 */
export async function getOrCreateConversation(
  db: D1Database,
  gptId: number,
  sessionId: string,
  userId?: string
): Promise<Conversation> {
  // Try to find existing conversation
  const existing = await db
    .prepare("SELECT * FROM gpt_conversations WHERE gpt_id = ? AND session_id = ?")
    .bind(gptId, sessionId)
    .first();

  if (existing) {
    return existing as unknown as Conversation;
  }

  // Create new conversation
  const result = await db
    .prepare(
      "INSERT INTO gpt_conversations (gpt_id, session_id, user_id, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
    )
    .bind(gptId, sessionId, userId || null)
    .run();

  const newConversation = await db
    .prepare("SELECT * FROM gpt_conversations WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();

  return newConversation as unknown as Conversation;
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  db: D1Database,
  conversationId: number,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  const result = await db
    .prepare(
      "INSERT INTO gpt_messages (conversation_id, role, content, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
    )
    .bind(conversationId, role, content)
    .run();

  // Update conversation updated_at
  await db
    .prepare("UPDATE gpt_conversations SET updated_at = datetime('now') WHERE id = ?")
    .bind(conversationId)
    .run();

  const newMessage = await db
    .prepare("SELECT * FROM gpt_messages WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();

  return newMessage as unknown as Message;
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  db: D1Database,
  conversationId: number,
  limit = 50
): Promise<Message[]> {
  const messages = await db
    .prepare(
      "SELECT * FROM gpt_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .bind(conversationId, limit)
    .all();

  return (messages.results as unknown as Message[]).reverse();
}

/**
 * Store a memory
 */
export async function storeMemory(
  db: D1Database,
  gptId: number,
  memoryKey: string,
  memoryValue: string,
  memoryType: "fact" | "preference" | "context" | "instruction",
  sessionId?: string,
  userId?: string
): Promise<void> {
  // Check if memory exists
  const existing = await db
    .prepare(
      "SELECT id FROM gpt_memories WHERE gpt_id = ? AND memory_key = ? AND (user_id = ? OR (user_id IS NULL AND ? IS NULL)) AND (session_id = ? OR (session_id IS NULL AND ? IS NULL))"
    )
    .bind(gptId, memoryKey, userId || null, userId || null, sessionId || null, sessionId || null)
    .first();

  if (existing) {
    // Update existing memory
    await db
      .prepare(
        "UPDATE gpt_memories SET memory_value = ?, memory_type = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(memoryValue, memoryType, existing.id)
      .run();
  } else {
    // Create new memory
    await db
      .prepare(
        "INSERT INTO gpt_memories (gpt_id, user_id, session_id, memory_key, memory_value, memory_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
      )
      .bind(gptId, userId || null, sessionId || null, memoryKey, memoryValue, memoryType)
      .run();
  }
}

/**
 * Retrieve memories for context injection
 */
export async function getMemories(
  db: D1Database,
  gptId: number,
  sessionId?: string,
  userId?: string
): Promise<Memory[]> {
  // Get user-specific memories first, then session-specific, then global GPT memories
  let query = "SELECT * FROM gpt_memories WHERE gpt_id = ?";
  const params: any[] = [gptId];

  if (userId) {
    query += " AND (user_id = ? OR user_id IS NULL)";
    params.push(userId);
  } else if (sessionId) {
    query += " AND (session_id = ? OR session_id IS NULL)";
    params.push(sessionId);
  } else {
    query += " AND user_id IS NULL AND session_id IS NULL";
  }

  query += " ORDER BY updated_at DESC";

  const result = await db.prepare(query).bind(...params).all();
  return result.results as unknown as Memory[];
}

/**
 * Format memories for prompt injection
 */
export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (memories.length === 0) return "";

  const sections: { [key: string]: string[] } = {
    fact: [],
    preference: [],
    context: [],
    instruction: [],
  };

  for (const memory of memories) {
    if (sections[memory.memory_type]) {
      sections[memory.memory_type].push(`- ${memory.memory_key}: ${memory.memory_value}`);
    }
  }

  let formatted = "\n\n## Memory Context\n";

  if (sections.fact.length > 0) {
    formatted += "\n### Known Facts:\n" + sections.fact.join("\n");
  }
  if (sections.preference.length > 0) {
    formatted += "\n### User Preferences:\n" + sections.preference.join("\n");
  }
  if (sections.context.length > 0) {
    formatted += "\n### Conversation Context:\n" + sections.context.join("\n");
  }
  if (sections.instruction.length > 0) {
    formatted += "\n### Special Instructions:\n" + sections.instruction.join("\n");
  }

  return formatted;
}

/**
 * Clear all memories for a GPT
 */
export async function clearMemories(
  db: D1Database,
  gptId: number,
  sessionId?: string,
  userId?: string
): Promise<void> {
  let query = "DELETE FROM gpt_memories WHERE gpt_id = ?";
  const params: any[] = [gptId];

  if (userId) {
    query += " AND user_id = ?";
    params.push(userId);
  } else if (sessionId) {
    query += " AND session_id = ?";
    params.push(sessionId);
  }

  await db.prepare(query).bind(...params).run();
}

/**
 * Get all conversations for a GPT
 */
export async function getGPTConversations(
  db: D1Database,
  gptId: number,
  userId?: string,
  limit = 20
): Promise<Conversation[]> {
  let query = "SELECT * FROM gpt_conversations WHERE gpt_id = ?";
  const params: any[] = [gptId];

  if (userId) {
    query += " AND user_id = ?";
    params.push(userId);
  }

  query += " ORDER BY updated_at DESC LIMIT ?";
  params.push(limit);

  const result = await db.prepare(query).bind(...params).all();
  return result.results as unknown as Conversation[];
}

/**
 * Delete a conversation and its messages
 */
export async function deleteConversation(
  db: D1Database,
  conversationId: number
): Promise<void> {
  // Delete messages first
  await db
    .prepare("DELETE FROM gpt_messages WHERE conversation_id = ?")
    .bind(conversationId)
    .run();

  // Delete conversation
  await db
    .prepare("DELETE FROM gpt_conversations WHERE id = ?")
    .bind(conversationId)
    .run();
}
