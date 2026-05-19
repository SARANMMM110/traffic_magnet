import OpenAI from "openai";
import {
  type AssistantConfig,
  type ConversationContext,
  enrichContextWithData,
  formatConversationHistory,
  generateSystemPrompt,
} from "../services/assistantPrompts";
import type { D1Like } from "../audience/audienceRateLimit";

export type AssistantRow = {
  id: number;
  user_id: string;
  public_id: string;
  name: string;
  status: string;
  assistant_type: string;
  target_goal?: string | null;
  personality?: string | null;
  tone?: string | null;
  expertise_areas?: string | null;
  instructions?: string | null;
  context_data?: string | null;
  knowledge_sources?: string | null;
  engagement_settings?: string | null;
  niche?: string | null;
  monetization_goal?: string | null;
  capture_flow_public_id?: string | null;
  asset_key?: string | null;
  linked_tool_id?: number | null;
  linked_project_id?: number | null;
};

export type PageContext = {
  currentPage?: string;
  referringSource?: string;
  assetKey?: string;
  niche?: string;
  calculationResult?: string;
  audienceType?: string;
  monetizationGoal?: string;
  ctaLabel?: string;
  toolName?: string;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function rowToAssistantConfig(row: AssistantRow): AssistantConfig {
  return {
    name: row.name,
    assistant_type: row.assistant_type,
    target_goal: row.target_goal,
    personality: row.personality,
    tone: row.tone,
    expertise_areas: row.expertise_areas,
    instructions: row.instructions,
    context_data: row.context_data,
  };
}

export function buildRuntimeContext(row: AssistantRow, page?: PageContext): ConversationContext {
  return enrichContextWithData(rowToAssistantConfig(row), {
    current_page: page?.currentPage || row.asset_key || undefined,
    referring_source: page?.referringSource,
    visitor_history: page?.currentPage ? [page.currentPage] : undefined,
  });
}

export function buildAugmentedSystemPrompt(
  row: AssistantRow,
  page?: PageContext,
  history?: Array<{ role: string; content: string }>,
  platformContext?: {
    projectData?: { id: number; name: string; niche: string; goal: string };
    toolData?: { id: number; name: string; category: string; blueprint?: string };
    wordpressSite?: { site_name: string; site_url: string; publishing_access: boolean };
    assistantDeployments?: number;
    activeFlows?: number;
  }
): string {
  const base = generateSystemPrompt(rowToAssistantConfig(row), buildRuntimeContext(row, page));
  const engagement = parseJson<Record<string, unknown>>(row.engagement_settings, {});
  const knowledge = parseJson<Array<{ title?: string; content?: string }>>(row.knowledge_sources, []);

  const extras: string[] = [];

  // Platform Awareness - Deep Integration Context
  extras.push(`PLATFORM OPERATING SYSTEM AWARENESS:
You are integrated into Traffic Magnet, an AI Growth Operating System. You have access to the user's entire workspace context and can trigger workflow actions.

AVAILABLE PLATFORM CAPABILITIES:
- Generate landing pages and blueprints
- Deploy AI assistants to assets
- Create audience capture flows
- Publish to WordPress
- Build SEO content campaigns
- Create traffic magnets (tools)
- Manage projects and campaigns

When users express intent, RECOMMEND specific platform actions they can take.`);

  // Current Context
  if (platformContext?.projectData) {
    extras.push(`ACTIVE PROJECT CONTEXT:
- Project: "${platformContext.projectData.name}"
- Niche: ${platformContext.projectData.niche}
- Goal: ${platformContext.projectData.goal}
You are operating within this project workspace. Reference it naturally and suggest actions relevant to this project.`);
  }

  if (platformContext?.toolData) {
    extras.push(`ACTIVE ASSET CONTEXT:
- Tool/Asset: "${platformContext.toolData.name}"
- Category: ${platformContext.toolData.category}
${platformContext.toolData.blueprint ? `- Has Blueprint: Yes (purpose, keywords, and strategy defined)` : `- Blueprint Status: Not yet generated - suggest creating one`}
You are embedded in this specific asset. Help users optimize and leverage it.`);
  }

  if (platformContext?.wordpressSite) {
    extras.push(`CONNECTED WORDPRESS SITE:
- Site: ${platformContext.wordpressSite.site_name}
- URL: ${platformContext.wordpressSite.site_url}
- Publishing: ${platformContext.wordpressSite.publishing_access ? "Enabled - can publish directly" : "Limited access"}
When publishing intent is detected, mention the connected WordPress site and offer to help publish.`);
  }

  if (row.niche || page?.niche) {
    extras.push(`NICHE EXPERTISE: ${page?.niche || row.niche}
Apply industry-specific knowledge and recommendations for this niche.`);
  }

  if (row.monetization_goal || page?.monetizationGoal) {
    extras.push(`MONETIZATION STRATEGY: ${page?.monetizationGoal || row.monetization_goal}
Guide conversations toward this revenue goal naturally.`);
  }

  if (page?.calculationResult) {
    extras.push(`USER TOOL INTERACTION:
The visitor just used this tool and got results:
${page.calculationResult}

Reference these results contextually and suggest next steps based on their output.`);
  }

  if (page?.audienceType) {
    extras.push(`TARGET AUDIENCE: ${page.audienceType}`);
  }

  if (page?.toolName) {
    extras.push(`CURRENT ASSET: ${page.toolName}`);
  }

  if (page?.ctaLabel || engagement.ctaLabel) {
    extras.push(`PRIMARY CONVERSION ACTION: ${page?.ctaLabel || engagement.ctaLabel}`);
  }

  if (row.capture_flow_public_id) {
    extras.push(
      `AUDIENCE CAPTURE ENABLED: Flow ID ${row.capture_flow_public_id}
When engagement is high, offer personalized resources in exchange for email. The capture system is active.`,
    );
  }

  if (platformContext?.activeFlows && platformContext.activeFlows > 0) {
    extras.push(`PLATFORM STATUS: ${platformContext.activeFlows} active audience flow(s), ${platformContext.assistantDeployments || 0} assistant deployment(s)`);
  }

  if (knowledge.length > 0) {
    extras.push(
      `KNOWLEDGE BASE:\n${knowledge
        .slice(0, 6)
        .map((k) => `- ${k.title || "Source"}: ${(k.content || "").slice(0, 600)}`)
        .join("\n")}`,
    );
  }

  if (typeof engagement.leadCaptureEnabled === "boolean" && engagement.leadCaptureEnabled) {
    extras.push("LEAD CAPTURE MODE: After demonstrating value (2-3 exchanges), offer personalized resources for email.");
  }

  if (typeof engagement.showPricingCta === "boolean" && engagement.showPricingCta) {
    extras.push("PRICING GUIDANCE: When cost questions arise, address clearly and suggest appropriate next steps.");
  }

  // Intent Detection Instructions
  extras.push(`INTENT DETECTION & WORKFLOW ACTIONS:

Detect these intents and recommend platform actions:

1. WEBSITE/LANDING PAGE INTENT
   Triggers: "create website", "build landing page", "need a site", "make a page"
   Action: Offer to generate complete landing page with blueprint, SEO, and design
   Suggest: "I can generate a complete landing page for you right now - with structure, copy, SEO, and professional design"

2. LEAD GENERATION INTENT
   Triggers: "get leads", "capture emails", "build audience", "grow list"
   Action: Recommend audience capture flow setup
   Suggest: "Let's set up an audience capture flow with email gates and lead magnets"

3. SEO/CONTENT INTENT
   Triggers: "rank on Google", "SEO", "content marketing", "blog posts"
   Action: Offer to create SEO content campaigns and wrapped pages
   Suggest: "I can help you build an SEO content campaign with optimized articles and internal linking"

4. MONETIZATION INTENT
   Triggers: "make money", "revenue", "monetize", "sell", "affiliate"
   Action: Discuss monetization strategies and recommend tool variations
   Suggest: "Let's explore monetization strategies - affiliate links, lead gen, or product recommendations"

5. PUBLISHING INTENT
   Triggers: "publish", "go live", "deploy", "launch"
   Action: Guide through deployment to WordPress or standalone
   Suggest: "I can help you publish this directly to your WordPress site or as a standalone page"

6. TOOL/MAGNET CREATION INTENT
   Triggers: "create tool", "build calculator", "make widget"
   Action: Recommend blueprint generation and tool builder workflow
   Suggest: "Let's create a traffic magnet tool - I'll help you define the blueprint and build it"

RESPONSE LAYERING STRATEGY:
1. Give concise strategic response (2-3 sentences)
2. Offer 2-3 specific platform actions as bullets
3. Ask ONE focused question about preferences/direction

Example:
"Based on your tech niche, I'd recommend building a modern SaaS-style landing page with lead capture.

I can help you:
• Generate complete landing page (structure, copy, design)
• Set up audience capture flow for emails
• Create SEO content to drive traffic

What visual style fits your brand? (Modern startup / Premium enterprise / Tech-forward)"

This creates premium, action-oriented responses.`);

  const historyBlock = history?.length ? `\n\nRECENT CONVERSATION:\n${formatConversationHistory(history)}` : "";

  return `${base}\n\n${extras.join("\n\n")}${historyBlock}`;
}

export async function resolveOwnerOpenAIKey(
  db: D1Like,
  ownerUserId: string,
  envOpenAI?: string,
): Promise<string> {
  const row = await db
    .prepare("SELECT openai_key FROM api_keys WHERE user_id = ? LIMIT 1")
    .bind(ownerUserId)
    .first<{ openai_key: string | null }>();
  const key = (row?.openai_key || envOpenAI || "").trim();
  if (!key) throw new Error("OpenAI API key not configured for this account");
  return key;
}

export async function streamAssistantChat(params: {
  apiKey: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  onToken: (token: string) => void;
  signal?: AbortSignal;
}): Promise<{ fullText: string; tokenCount: number }> {
  const client = new OpenAI({ apiKey: params.apiKey });
  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: params.systemPrompt }, ...params.messages],
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  let fullText = "";
  let tokenCount = 0;

  for await (const chunk of stream) {
    if (params.signal?.aborted) break;
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      fullText += delta;
      tokenCount += 1;
      params.onToken(delta);
    }
  }

  return { fullText, tokenCount };
}

export function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  };
}

export function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
