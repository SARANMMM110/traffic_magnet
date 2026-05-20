/**
 * GPT Runtime Engine
 * 
 * Core execution orchestration for GPT conversations.
 * Handles prompt assembly, provider routing, streaming, and response generation.
 */

interface RuntimeContext {
  gptId: number;
  userId: string;
  conversationId?: number;
  sessionId: string;
}

interface GPTConfig {
  id: number;
  name: string;
  description: string;
  model: string;
  instructions: string;
  personality: string;
  tone: string;
  welcome_message: string;
  creativity: number;
  memory_enabled: boolean;
  multi_step_reasoning: boolean;
  web_awareness: boolean;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Action {
  id: number;
  name: string;
  description: string;
  openapi_schema: string;
  auth_type: string;
  api_key_encrypted: string;
  base_url: string;
}

/**
 * Execute a GPT conversation turn
 */
export async function executeGPT(
  context: RuntimeContext,
  userMessage: string,
  db: D1Database,
  apiKeys: { openai?: string; anthropic?: string; gemini?: string; deepseek?: string }
): Promise<ReadableStream> {
  // Load GPT configuration
  const gpt = await loadGPTConfig(context.gptId, db);
  
  // Load conversation history
  const history = await loadConversationHistory(context, db);
  
  // Load knowledge context (if enabled)
  const knowledgeContext = await retrieveKnowledge(context.gptId, userMessage, db, apiKeys.openai);
  
  // Load actions (if any)
  const actions = await loadActions(context.gptId, db);
  
  // Load memory (if enabled)
  const memoryContext = gpt.memory_enabled 
    ? await loadMemory(context.gptId, context.userId, db)
    : [];
  
  // Assemble prompt
  const messages = assemblePrompt({
    gpt,
    userMessage,
    history,
    knowledgeContext,
    memoryContext,
  });
  
  // Route to appropriate provider
  const provider = determineProvider(gpt.model);
  
  // Execute with streaming
  return streamGPTResponse({
    provider,
    model: gpt.model,
    messages,
    actions,
    apiKeys,
    creativity: gpt.creativity,
  });
}

/**
 * Load GPT configuration from database
 */
async function loadGPTConfig(gptId: number, db: D1Database): Promise<GPTConfig> {
  const result = await db
    .prepare("SELECT * FROM gpts WHERE id = ?")
    .bind(gptId)
    .first();
    
  if (!result) {
    throw new Error("GPT not found");
  }
  
  return result as any;
}

/**
 * Load conversation history
 */
async function loadConversationHistory(
  context: RuntimeContext,
  db: D1Database
): Promise<Message[]> {
  if (!context.conversationId) {
    return [];
  }
  
  const result = await db
    .prepare(
      `SELECT role, content FROM gpt_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC 
       LIMIT 50`
    )
    .bind(context.conversationId)
    .all();
    
  return (result.results || []).map((r: any) => ({
    role: r.role as "user" | "assistant" | "system",
    content: r.content as string,
  }));
}

/**
 * Retrieve relevant knowledge chunks using semantic search
 */
async function retrieveKnowledge(
  gptId: number,
  _query: string,
  db: D1Database,
  openaiKey?: string
): Promise<string[]> {
  if (!openaiKey) {
    return [];
  }
  
  // Check if GPT has knowledge files
  const filesResult = await db
    .prepare(
      "SELECT id FROM gpt_knowledge_files WHERE gpt_id = ? AND indexing_status = 'completed'"
    )
    .bind(gptId)
    .all();
    
  if (!filesResult.results || filesResult.results.length === 0) {
    return [];
  }
  
  // Generate query embedding
  // Note: In production, would use vector similarity search
  // const queryEmbedding = await generateEmbedding(query, openaiKey);
  
  // Retrieve top chunks (simple version - in production would use vector similarity)
  const chunksResult = await db
    .prepare(
      `SELECT chunk_text FROM gpt_embeddings 
       WHERE gpt_id = ? 
       ORDER BY id DESC 
       LIMIT 5`
    )
    .bind(gptId)
    .all();
    
  return (chunksResult.results || []).map((r: any) => r.chunk_text);
}

/**
 * Load actions/tools for the GPT
 */
async function loadActions(gptId: number, db: D1Database): Promise<Action[]> {
  const result = await db
    .prepare("SELECT * FROM gpt_actions WHERE gpt_id = ? AND enabled = 1")
    .bind(gptId)
    .all();
    
  return (result.results || []).map((r: any) => ({
    id: r.id as number,
    name: r.name as string,
    description: r.description as string,
    openapi_schema: r.openapi_schema as string,
    auth_type: r.auth_type as string,
    api_key_encrypted: r.api_key_encrypted as string,
    base_url: r.base_url as string,
  }));
}

/**
 * Load memory for the GPT
 */
async function loadMemory(
  gptId: number,
  userId: string,
  db: D1Database
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT memory_value FROM gpt_memories 
       WHERE gpt_id = ? AND user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`
    )
    .bind(gptId, userId)
    .all();
    
  return (result.results || []).map((r: any) => r.memory_value);
}

/**
 * Assemble the complete prompt with context
 */
function assemblePrompt(params: {
  gpt: GPTConfig;
  userMessage: string;
  history: Message[];
  knowledgeContext: string[];
  memoryContext: string[];
}): Message[] {
  const { gpt, userMessage, history, knowledgeContext, memoryContext } = params;
  
  // Build system prompt
  let systemPrompt = gpt.instructions || "You are a helpful AI assistant.";
  
  // Add personality and tone
  if (gpt.personality) {
    systemPrompt += `\n\nPersonality: ${gpt.personality}`;
  }
  if (gpt.tone) {
    systemPrompt += `\nTone: ${gpt.tone}`;
  }
  
  // Add knowledge context
  if (knowledgeContext.length > 0) {
    systemPrompt += "\n\n## Knowledge Base Context\n\n";
    systemPrompt += knowledgeContext.join("\n\n");
    systemPrompt += "\n\nUse the above context to answer questions when relevant.";
  }
  
  // Add memory context
  if (memoryContext.length > 0) {
    systemPrompt += "\n\n## Previous Context\n\n";
    systemPrompt += memoryContext.join("\n");
  }
  
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];
  
  return messages;
}

/**
 * Determine which provider to use based on model
 */
function determineProvider(model: string): "openai" | "anthropic" | "gemini" | "deepseek" {
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("deepseek")) return "deepseek";
  return "openai"; // default
}

/**
 * Stream GPT response from the selected provider
 */
async function streamGPTResponse(params: {
  provider: string;
  model: string;
  messages: Message[];
  actions: Action[];
  apiKeys: any;
  creativity: number;
}): Promise<ReadableStream> {
  const { provider, model, messages, apiKeys, creativity } = params;
  
  if (provider === "openai") {
    return streamOpenAI(model, messages, apiKeys.openai, creativity);
  } else if (provider === "anthropic") {
    return streamAnthropic(model, messages, apiKeys.anthropic, creativity);
  } else if (provider === "gemini") {
    return streamGemini(model, messages, apiKeys.gemini, creativity);
  } else if (provider === "deepseek") {
    return streamDeepSeek(model, messages, apiKeys.deepseek, creativity);
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Stream from OpenAI
 */
async function streamOpenAI(
  model: string,
  messages: Message[],
  apiKey?: string,
  temperature: number = 0.7
): Promise<ReadableStream> {
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o",
      messages,
      temperature,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  return response.body!;
}

/**
 * Stream from Anthropic
 */
async function streamAnthropic(
  model: string,
  messages: Message[],
  apiKey?: string,
  temperature: number = 0.7
): Promise<ReadableStream> {
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }
  
  // Extract system message
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemMessage?.content || "",
      messages: conversationMessages,
      temperature,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }
  
  return response.body!;
}

/**
 * Stream from Gemini
 */
async function streamGemini(
  model: string,
  messages: Message[],
  apiKey?: string,
  temperature: number = 0.7
): Promise<ReadableStream> {
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }
  
  // Convert messages to Gemini format
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");
  
  const contents = conversationMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash-exp"}:streamGenerateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: 8192,
        },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  return response.body!;
}

/**
 * Stream from DeepSeek
 */
async function streamDeepSeek(
  model: string,
  messages: Message[],
  apiKey?: string,
  temperature: number = 0.7
): Promise<ReadableStream> {
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured");
  }
  
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "deepseek-chat",
      messages,
      temperature,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }
  
  return response.body!;
}

/**
 * Generate embedding for a text query (currently unused)
 */
// @ts-expect-error - Keeping for future vector search implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to generate embedding");
  }
  
  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}
