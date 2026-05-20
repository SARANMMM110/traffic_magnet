/**
 * GPT Runtime Engine
 * 
 * Executes GPT conversations with:
 * - Instructions
 * - Personality
 * - Knowledge retrieval
 * - Capabilities
 * - Memory
 * - Actions
 */

interface GPTConfig {
  instructions: string;
  personality?: string;
  tone?: string;
  model: string;
  creativity?: number;
  memory_enabled?: boolean;
  multi_step_reasoning?: boolean;
  web_awareness?: boolean;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GPTRuntimeOptions {
  gptId: number;
  config: GPTConfig;
  conversationHistory: Array<{ role: string; content: string }>;
  userMessage: string;
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  deepseekKey?: string;
  knowledgeContext?: string;
  enabledCapabilities?: string[];
  actions?: any[];
  db?: D1Database;
}

/**
 * Build the system prompt for the GPT
 */
function buildSystemPrompt(config: GPTConfig, knowledgeContext?: string): string {
  const parts: string[] = [];

  // Base instructions
  if (config.instructions) {
    parts.push(config.instructions);
  }

  // Personality
  if (config.personality) {
    parts.push(`\nPersonality: ${config.personality}`);
  }

  // Tone
  if (config.tone) {
    parts.push(`Tone: ${config.tone}`);
  }

  // Knowledge context
  if (knowledgeContext) {
    parts.push(`\n\nKnowledge Base:\n${knowledgeContext}`);
    parts.push("\nUse the knowledge base above to answer questions when relevant. Cite specific information when you use it.");
  }

  // Capabilities
  const capabilities: string[] = [];
  if (config.web_awareness) {
    capabilities.push("web search");
  }
  if (config.multi_step_reasoning) {
    capabilities.push("multi-step reasoning");
  }

  if (capabilities.length > 0) {
    parts.push(`\n\nYou have access to: ${capabilities.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Execute GPT with OpenAI
 */
async function executeWithOpenAI(
  options: GPTRuntimeOptions,
  apiKey: string
): Promise<ReadableStream> {
  const systemPrompt = buildSystemPrompt(options.config, options.knowledgeContext);

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...options.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: options.userMessage },
  ];

  // Map model names
  let model = options.config.model;
  if (model === "auto") model = "gpt-4o";
  if (model === "gpt-4.1") model = "gpt-4-turbo";

  const requestBody: any = {
    model,
    messages,
    temperature: options.config.creativity || 0.7,
    stream: true,
  };

  // Add function calling if actions are available
  if (options.actions && options.actions.length > 0) {
    requestBody.tools = options.actions.map((action: any) => ({
      type: "function",
      function: {
        name: action.name,
        description: action.description,
        parameters: action.parameters,
      },
    }));
    requestBody.tool_choice = "auto";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.body!;
}

/**
 * Execute GPT with Anthropic
 */
async function executeWithAnthropic(
  options: GPTRuntimeOptions,
  apiKey: string
): Promise<ReadableStream> {
  const systemPrompt = buildSystemPrompt(options.config, options.knowledgeContext);

  const messages = [
    ...options.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: options.userMessage },
  ];

  // Map model names
  let model = options.config.model;
  if (model === "auto") model = "claude-sonnet-4-20250514";
  if (model === "claude-sonnet") model = "claude-sonnet-4-20250514";

  const requestBody: any = {
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
    temperature: options.config.creativity || 0.7,
    stream: true,
  };

  // Add tool calling if actions are available
  if (options.actions && options.actions.length > 0) {
    requestBody.tools = options.actions.map((action: any) => ({
      name: action.name,
      description: action.description,
      input_schema: action.parameters,
    }));
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  return response.body!;
}

/**
 * Execute GPT with Gemini
 */
async function executeWithGemini(
  options: GPTRuntimeOptions,
  apiKey: string
): Promise<ReadableStream> {
  const systemPrompt = buildSystemPrompt(options.config, options.knowledgeContext);

  // Gemini uses a different message format
  const contents = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    ...options.conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [{ text: options.userMessage }],
    },
  ];

  let model = options.config.model;
  if (model === "auto" || model === "gemini") model = "gemini-2.0-flash-exp";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.config.creativity || 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  return response.body!;
}

/**
 * Execute GPT with DeepSeek
 */
async function executeWithDeepSeek(
  options: GPTRuntimeOptions,
  apiKey: string
): Promise<ReadableStream> {
  const systemPrompt = buildSystemPrompt(options.config, options.knowledgeContext);

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...options.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: options.userMessage },
  ];

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options.config.creativity || 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  return response.body!;
}

/**
 * Main GPT execution function
 * Routes to the appropriate provider based on model and available keys
 */
export async function executeGPT(options: GPTRuntimeOptions): Promise<ReadableStream> {
  const model = options.config.model;

  // Determine which provider to use
  let provider: "openai" | "anthropic" | "gemini" | "deepseek" | null = null;

  if (model.includes("gpt") || model.includes("openai") || model === "auto") {
    if (options.openaiKey) provider = "openai";
  } else if (model.includes("claude") || model.includes("anthropic")) {
    if (options.anthropicKey) provider = "anthropic";
  } else if (model.includes("gemini")) {
    if (options.geminiKey) provider = "gemini";
  } else if (model.includes("deepseek")) {
    if (options.deepseekKey) provider = "deepseek";
  }

  // Fallback logic
  if (!provider) {
    if (options.openaiKey) provider = "openai";
    else if (options.anthropicKey) provider = "anthropic";
    else if (options.geminiKey) provider = "gemini";
    else if (options.deepseekKey) provider = "deepseek";
  }

  if (!provider) {
    throw new Error("No API key available for any provider");
  }

  // Execute with the selected provider
  switch (provider) {
    case "openai":
      return executeWithOpenAI(options, options.openaiKey!);
    case "anthropic":
      return executeWithAnthropic(options, options.anthropicKey!);
    case "gemini":
      return executeWithGemini(options, options.geminiKey!);
    case "deepseek":
      return executeWithDeepSeek(options, options.deepseekKey!);
    default:
      throw new Error("Invalid provider");
  }
}

/**
 * Parse streaming response based on provider
 */
export function createStreamParser(provider: "openai" | "anthropic" | "gemini" | "deepseek") {
  return new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);

            if (provider === "openai" || provider === "deepseek") {
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            } else if (provider === "anthropic") {
              if (json.type === "content_block_delta") {
                const content = json.delta?.text;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              }
            } else if (provider === "gemini") {
              const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    },
  });
}
