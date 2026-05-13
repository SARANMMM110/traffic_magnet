import OpenAI from "openai";

interface ToolIdea {
  name: string;
  category: string;
  score: number;
  why: string;
  traffic_potential: "High" | "Medium" | "Low";
  link_magnet_score: "Strong" | "Medium" | "Weak";
  monetization: "Strong" | "Medium" | "Weak";
  keywords: string[];
}

interface DiscoveryResult {
  tools: ToolIdea[];
}

export async function discoverToolIdeas(
  niche: string,
  goal: string | null,
  audience: string | null,
  apiKey: string
): Promise<ToolIdea[]> {
  if (!apiKey || apiKey.trim().length === 0) {
    console.error("[discoverToolIdeas] API key is empty or undefined");
    throw new Error("OpenAI API key is required");
  }

  if (!apiKey.startsWith("sk-")) {
    console.error("[discoverToolIdeas] API key format appears invalid");
    throw new Error("OpenAI API key must start with 'sk-'");
  }

  const client = new OpenAI({ apiKey });

  const userPrompt = `Platform Positioning: AI Online Business Opportunity Engine
Selected Niche and Category: ${niche}
Goal: ${goal || "Generate traffic and monetizable opportunities"}
Target Audience: ${audience || "General"}

IMPORTANT: You MUST generate exactly 12 unique premium business asset ideas.

Do NOT generate generic calculator concepts.
Avoid names that end with "Calculator" unless the selected category explicitly requires an ROI or savings estimator.

Generate premium, startup-grade assets such as:
- AI business assets
- Traffic systems
- Lead magnets
- Monetization engines
- Conversion tools
- SEO opportunity systems
- Growth dashboards
- Revenue optimization systems
- Authority-building interactive utilities

Each asset must:
- Solve an emotionally valuable business problem
- Rank on Google for buyer-intent or opportunity keywords
- Attract backlinks, shares, or embeds from other sites
- Create a believable monetization path through leads, affiliate revenue, SaaS upsells, services, sponsorships, or digital products
- Feel premium, conversion-focused, SEO-driven, and authority-building

Return ONLY valid JSON in this exact format with NO additional text:
{
  "tools": [
    {
      "name": "Tool Name",
      "category": "Category Name",
      "score": 85,
      "why": "One sentence explaining the value",
      "traffic_potential": "High",
      "link_magnet_score": "Strong",
      "monetization": "Medium",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Generate ALL 12 premium business asset ideas now.`;

  try {
    console.log("[discoverToolIdeas] Starting discovery for niche:", niche);
    console.log("[discoverToolIdeas] Using API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NONE");

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI online business opportunity strategist. Generate premium monetization assets, traffic systems, lead magnets, conversion engines, SEO opportunity systems, and growth dashboards. Do not generate generic calculators. Return ONLY valid JSON, no other text.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tool_discovery",
          schema: {
            type: "object",
            properties: {
              tools: {
                type: "array",
                minItems: 12,
                maxItems: 12,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    category: { type: "string" },
                    score: { type: "number" },
                    why: { type: "string" },
                    traffic_potential: { type: "string", enum: ["High", "Medium", "Low"] },
                    link_magnet_score: { type: "string", enum: ["Strong", "Medium", "Weak"] },
                    monetization: { type: "string", enum: ["Strong", "Medium", "Weak"] },
                    keywords: { type: "array", items: { type: "string" } },
                  },
                  required: [
                    "name",
                    "category",
                    "score",
                    "why",
                    "traffic_potential",
                    "link_magnet_score",
                    "monetization",
                    "keywords",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["tools"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 0.8,
    });

    console.log("[discoverToolIdeas] OpenAI API call successful");

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    console.log("[discoverToolIdeas] Response content length:", content.length);

    const result: DiscoveryResult = JSON.parse(content);
    console.log("[discoverToolIdeas] Parsed result, tools count:", result.tools?.length || 0);

    if (!result.tools || !Array.isArray(result.tools) || result.tools.length === 0) {
      console.error("[discoverToolIdeas] Invalid result structure:", result);
      throw new Error("OpenAI returned invalid tool structure");
    }

    if (result.tools.length !== 12) {
      console.warn(`[discoverToolIdeas] Received ${result.tools.length} assets instead of 12. Retrying...`);
      throw new Error(`${result.tools.length} assets generated instead of 12. Please try again or check your OpenAI API key quota.`);
    }

    console.log("[discoverToolIdeas] Successfully generated", result.tools.length, "tools");
    return result.tools;
  } catch (error) {
    console.error("[discoverToolIdeas] Error occurred:", error);
    if (error instanceof Error) {
      console.error("[discoverToolIdeas] Error message:", error.message);
      console.error("[discoverToolIdeas] Error stack:", error.stack);
    }
    throw new Error(`Tool discovery failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

const ALLOWED_VISUAL_THEMES = new Set(["modern", "ocean", "forest", "sunset", "purple", "slate"]);

/** Normalizes blueprint.visual_theme for HTML generation and API defaults. */
export function resolveVisualThemeKey(blueprint: any): string {
  const raw = (blueprint?.visual_theme ?? blueprint?.theme ?? "modern").toString().trim().toLowerCase();
  return ALLOWED_VISUAL_THEMES.has(raw) ? raw : "modern";
}

/** Detailed instructions so standalone/embed/landing outputs match the UI theme picker. */
function visualThemeGenerationContract(themeKey: string): string {
  const specs: Record<string, string> = {
    modern: `Theme "modern" (default): charcoal / near-black primary #111827 or #1F2937, white #FFFFFF surfaces, borders #E5E7EB, ONE restrained accent (deep indigo #4F46E5 or cool gray-blue) for primary buttons and focus only. No rainbow gradients; backgrounds stay white/off-white.`,
    ocean: `Theme "ocean": cool blues — primary #0EA5E9, hover #0284C7, backgrounds #F8FAFC / #F0F9FF, borders #BAE6FD / #E0F2FE, ink #0C4A6E. Trustworthy, corporate SaaS water palette throughout :root.`,
    forest: `Theme "forest": greens #059669 / #10B981 / #047857, soft cream or warm white #FAFAF9 backgrounds, borders #D1FAE5, deep green ink #14532D. Earthy but crisp UI, not neon.`,
    sunset: `Theme "sunset": warm accents only on CTAs/highlights — #EA580C to #FB923C gradients OK on buttons; page backgrounds stay #FFFBEB or white; text #1C1917; avoid painting entire sections orange.`,
    purple: `Theme "purple": premium violet — #7C3AED / #6D28D9 primary, soft lavender surfaces #FAF5FF, borders #EDE9FE, ink #1E1B4B. Creative SaaS, not harsh neon.`,
    slate: `Theme "slate": professional grayscale — #334155 / #475569 accents, white surfaces, borders #E2E8F0, body #1E293B. Single accent hue for CTAs only; calm enterprise look.`,
  };
  return specs[themeKey] || specs.modern;
}

function generateBlueprintPrompt(
  toolName: string,
  niche: string,
  category: string | null,
  goal: string | null
): string {
  return `You are creating a premium business strategy blueprint for an AI Online Business Opportunity Engine.

The output must feel like a real startup-grade strategy document, not a generic tool description.
Do NOT position this as a calculator marketplace. Do NOT generate low-value calculator language unless the selected category specifically says ROI Estimators or Savings Calculators.

Return ONLY valid JSON. No markdown fences. No explanation. The response must work directly with JSON.parse().

Return this exact JSON structure:
{
  "title": "",
  "category": "",
  "tool_type": "",
  "description": "",
  "purpose": "",
  "market_opportunity": "",
  "target_audience": "",
  "audience_pain_points": [],
  "target_keywords": [],
  "seo_opportunity": "",
  "traffic_acquisition_strategy": "",
  "inputs_required": [],
  "output_type": "",
  "calculation_logic": "",
  "features": [],
  "conversion_psychology": "",
  "monetization_strategy": "",
  "monetization_roadmap": [],
  "authority_positioning": "",
  "competitor_advantage": "",
  "eeat_structure": [],
  "internal_links": [],
  "cta_text": "",
  "theme_suggestions": [],
  "visual_theme": "modern",
  "seo_title": "",
  "seo_description": ""
}

Field requirements:
- title: premium asset name only. Prefer names like Engine, Dashboard, Intelligence System, Opportunity Scanner, Revenue Maximizer, Growth System, Funnel Optimizer, or AI Analyzer.
- category: the selected monetization category.
- tool_type: one phrase such as "AI growth engine", "traffic intelligence dashboard", "lead magnet system", "conversion engine", "revenue optimization asset", or "SEO opportunity system". Avoid generic "calculator".
- description: one compelling 15-25 word value proposition.
- purpose: 70-110 words explaining what the asset does, who it helps, and why the business outcome matters.
- market_opportunity: 50-90 words describing the commercial opportunity, demand, urgency, and why users would care now.
- target_audience: specific audience segments and the buyer/user roles.
- audience_pain_points: exactly 5 emotionally specific business pain points.
- target_keywords: exactly 6-8 SEO phrases, focused on buyer intent, traffic, revenue, lead generation, or monetization.
- seo_opportunity: 50-80 words explaining search demand, long-tail keyword angles, SERP opportunity, and topical authority potential.
- traffic_acquisition_strategy: 60-100 words covering organic search, share loops, backlinks, creator/social distribution, embeds, and partnerships where relevant.
- inputs_required: exactly 4-7 user-friendly fields that make the asset interactive and useful.
- output_type: 25-45 words describing the strategic report, score, roadmap, forecast, dashboard, or recommendations users receive.
- calculation_logic: 70-100 words explaining the business logic, scoring model, prioritization framework, or decision engine in plain language.
- features: exactly 6-8 premium SaaS-style features, each 3-8 words.
- conversion_psychology: 45-80 words explaining the trust triggers, urgency, personalization, proof, and decision-making psychology.
- monetization_strategy: 50-90 words with realistic revenue channels: lead capture, affiliate revenue, premium reports, SaaS upsells, consultations, sponsorships, digital products, or paid audits.
- monetization_roadmap: exactly 4 phased roadmap items from free asset to revenue capture.
- authority_positioning: 45-75 words explaining why this asset builds brand authority and EEAT.
- competitor_advantage: 40-70 words explaining how this asset is more valuable than static articles, generic templates, or simple calculators.
- eeat_structure: exactly 5 trust-building content or UX elements.
- internal_links: exactly 5-8 related premium business assets.
- cta_text: one strong conversion-focused sentence.
- theme_suggestions: exactly 3-5 premium SaaS visual themes (short labels only).
- visual_theme: MUST be exactly one string: "modern", "ocean", "forest", "sunset", "purple", or "slate" — pick the single best match for this asset's brand; use "modern" if unsure.
- seo_title: 50-60 characters, click-worthy, includes the primary keyword.
- seo_description: 140-160 characters, high CTR, mentions the asset outcome.

Generate the blueprint for:
Asset Name: ${toolName}
Selected Niche and Category: ${niche}
Category: ${category || "General"}
Goal: ${goal || "Generate traffic and monetizable opportunities"}

Final check before returning:
- Must feel expensive, strategic, professional, conversion-focused, and startup-grade.
- Must include pain points, monetization roadmap, SEO opportunity, traffic strategy, conversion psychology, authority positioning, competitor advantage, and EEAT structure.
- Must avoid repetitive calculator language.
- Return ONLY the complete JSON object.`;
}

export async function generateBlueprint(
  toolName: string,
  niche: string,
  category: string | null,
  goal: string | null,
  anthropicKey: string | null,
  openaiKey: string | null
): Promise<string> {
  const prompt = generateBlueprintPrompt(toolName, niche, category, goal);

  console.log("[Blueprint] Generating for tool:", toolName);
  console.log("[Blueprint] Has Anthropic key:", !!anthropicKey);
  console.log("[Blueprint] Has OpenAI key:", !!openaiKey);

  if (anthropicKey) {
    try {
      return await generateBlueprintWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Blueprint] Anthropic failed:", error);
      if (!openaiKey) {
        throw error;
      }
      console.log("[Blueprint] Falling back to OpenAI...");
    }
  }

  if (openaiKey) {
    return await generateBlueprintWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for blueprint generation");
}

async function generateBlueprintWithAnthropic(prompt: string, apiKey: string): Promise<string> {
  const MAX_RETRIES = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[Blueprint/Anthropic] Attempt ${attempt}/${MAX_RETRIES}`);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Blueprint/Anthropic] API error ${response.status}:`, errorText);
        lastError = `API returned ${response.status}: ${errorText}`;

        if (response.status === 401 || response.status === 403) {
          throw new Error("Invalid Anthropic API key");
        }
        continue;
      }

      const data = (await response.json()) as any;
      console.log("[Blueprint/Anthropic] API response received");

      let raw = "";
      if (data.content && Array.isArray(data.content)) {
        raw = data.content
          .filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("\n")
          .trim();
      } else {
        console.error("[Blueprint/Anthropic] Unexpected response structure:", data);
        lastError = "Unexpected API response structure";
        continue;
      }

      if (!raw) {
        console.error("[Blueprint/Anthropic] Empty response from AI");
        lastError = "Empty response from AI";
        continue;
      }

      let cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        console.error("[Blueprint/Anthropic] No JSON found in response:", cleaned.substring(0, 500));
        lastError = "No JSON object in AI response";
        continue;
      }
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);

      let blueprint;
      try {
        blueprint = JSON.parse(cleaned);
      } catch (e) {
        console.error("[Blueprint/Anthropic] JSON parse error:", e);
        lastError = `JSON parse error: ${e instanceof Error ? e.message : String(e)}`;
        continue;
      }

      if (!blueprint.title) {
        lastError = "Missing title field";
        continue;
      }
      if (!blueprint.purpose) {
        lastError = "Missing purpose field";
        continue;
      }

      console.log("[Blueprint/Anthropic] Generated successfully with all required fields");
      return JSON.stringify(blueprint);
    } catch (err) {
      console.error(`[Blueprint/Anthropic] Attempt ${attempt} threw:`, err);
      lastError = err instanceof Error ? err.message : String(err);

      if (err instanceof Error && err.message.includes("Invalid Anthropic API key")) {
        throw err;
      }
    }
  }

  throw new Error(`Anthropic blueprint generation failed after ${MAX_RETRIES} attempts: ${lastError}`);
}

async function generateBlueprintWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  console.log("[Blueprint/OpenAI] Generating blueprint");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI business opportunity strategist creating premium startup-grade blueprints for monetization assets, traffic systems, SEO opportunity systems, and conversion engines. Output only valid JSON, no markdown or explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blueprint/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;
    let raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    let cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object in OpenAI response");
    }
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    let blueprint;
    try {
      blueprint = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (!blueprint.title) throw new Error("Missing title field");
    if (!blueprint.purpose) throw new Error("Missing purpose field");

    console.log("[Blueprint/OpenAI] Generated successfully with all required fields");
    return JSON.stringify(blueprint);
  } catch (error) {
    console.error("[Blueprint/OpenAI] Error:", error);
    throw error;
  }
}

export async function generateToolHTML(
  blueprint: any,
  action: "standalone" | "embed",
  anthropicKey: string | null,
  openaiKey: string | null
): Promise<string> {
  console.log("[HTML] Generating tool HTML for action:", action);

  const prompt = generateHTMLPrompt(blueprint, action);

  if (anthropicKey) {
    try {
      return await generateHTMLWithAnthropic(prompt, anthropicKey, action);
    } catch (error) {
      console.error("[HTML] Anthropic failed:", error);
      if (!openaiKey) throw error;
      console.log("[HTML] Falling back to OpenAI...");
    }
  }

  if (openaiKey) {
    return await generateHTMLWithOpenAI(prompt, openaiKey, action);
  }

  throw new Error("No API key available for HTML generation");
}

// ════════════════════════════════════════════════════════════════════════════
// LANDING PAGE GENERATION (MINIMALIST DESIGN)
// ════════════════════════════════════════════════════════════════════════════

/** Keeps landing prompts bounded (avoids huge DB blobs blowing prompt size / memory). */
function blueprintJsonForLandingPrompt(blueprint: unknown, maxChars: number): string {
  try {
    const text = JSON.stringify(blueprint, null, 2);
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}\n\n/* blueprint JSON truncated (${text.length} chars total) — infer remaining fields from title/description/inputs above */\n`;
  } catch {
    return "{}";
  }
}

export async function generateLandingPage(
  blueprint: any,
  anthropicKey: string | null,
  openaiKey: string | null
): Promise<string> {
  console.log("[Landing Page] Generating clean minimalist landing page");

  const prompt = generateLandingPagePrompt(blueprint);
  console.log("[Landing Page] Prompt length (chars):", prompt.length);

  if (anthropicKey) {
    try {
      return await generateLandingPageWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Landing Page] Anthropic failed:", error);
      if (!openaiKey) throw error;
      console.log("[Landing Page] Falling back to OpenAI...");
    }
  }

  if (openaiKey) {
    return await generateLandingPageWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for landing page generation");
}

function generateLandingPagePrompt(blueprint: any): string {
  const inputs =
    Array.isArray(blueprint.inputs_required) && blueprint.inputs_required.length > 0
      ? blueprint.inputs_required
      : ["Primary Input", "Secondary Input", "Category"];

  const features =
    Array.isArray(blueprint.features) && blueprint.features.length > 0
      ? blueprint.features.slice(0, 6)
      : ["Instant AI analysis", "Strategic recommendations", "Monetization insights"];

  const inputsFieldGuide = inputs
    .map((input: any, idx: number) => {
      const fieldName =
        typeof input === "string" ? input : input.label || input.name || "Field " + String(idx + 1);
      const safe = String(fieldName).replace(/[<>]/g, "");
      const fieldType = typeof input === "object" && input.type === "select" ? "select" : "text";
      return fieldType === "select"
        ? "<!-- field-card with select for " + safe + " -->"
        : "<!-- field-card with input for " + safe + " -->";
    })
    .join("\n        ");

  return `You are a principal SaaS product designer creating a PRODUCTION-READY PREMIUM landing page.

TARGET QUALITY: Stripe, Linear, Vercel, Framer, Notion, Anthropic, Posthog.
The page must feel like a funded AI startup's actual marketing site — sophisticated, polished, conversion-focused, with depth and craft.

NOT minimal/empty (boring). NOT cinematic/flashy (overdesigned).
The sweet spot: confident, premium, modern, with strategic visual interest.

═══════════════════════════════════════════════════════════
OUTPUT RULES
═══════════════════════════════════════════════════════════
- Output ONLY raw HTML starting with <!DOCTYPE html>
- NO markdown fences, NO explanations, NO preamble
- Single complete HTML file
- Inter from Google Fonts (weights 400, 500, 600, 700, 800)
- One <style> block in <head>, one <script> block before </body>
- Target file size: 40-80KB (substantial but not bloated)

═══════════════════════════════════════════════════════════
DESIGN SYSTEM (use these tokens)
═══════════════════════════════════════════════════════════
:root {
  /* Brand */
  --brand-primary: #6E57E0;
  --brand-primary-hover: #5B48D0;
  --brand-primary-soft: #F4F1FE;
  --brand-secondary: #4F46E5;
  --brand-accent: #A78BFA;
  
  /* Surfaces */
  --surface: #FFFFFF;
  --surface-soft: #FAFBFC;
  --surface-strong: #F5F6F8;
  --surface-dark: #0F0F12;
  
  /* Ink */
  --ink: #0A0A0A;
  --ink-soft: #1F2937;
  --muted: #6B7280;
  --muted-light: #9CA3AF;
  
  /* Lines */
  --line: #E5E7EB;
  --line-soft: #F3F4F6;
  --line-dark: rgba(255,255,255,0.1);
  
  /* Effects */
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.04);
  --shadow-md: 0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04);
  --shadow-lg: 0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.05);
  --shadow-xl: 0 20px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.06);
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
}

═══════════════════════════════════════════════════════════
VISUAL THEME LOCK (from blueprint.visual_theme — REQUIRED)
═══════════════════════════════════════════════════════════
Theme key: ${resolveVisualThemeKey(blueprint)}
${visualThemeGenerationContract(resolveVisualThemeKey(blueprint))}
Map theme hues onto the semantic tokens above (--brand-primary, --brand-primary-hover, accents, surfaces, lines). Honor the user's selection from the app.

═══════════════════════════════════════════════════════════
TYPOGRAPHY (refined, professional)
═══════════════════════════════════════════════════════════
- Eyebrow: 13px, weight 600, uppercase, letter-spacing 0.08em, brand-primary
- Body: 16px / 1.7 line-height, ink-soft
- Lead: 18-19px / 1.6, ink-soft
- H1 hero: clamp(44px, 5.5vw, 68px), weight 700, letter-spacing -0.025em, line-height 1.05
- H2 section: clamp(32px, 4vw, 48px), weight 700, letter-spacing -0.02em, line-height 1.1
- H3 card: 20-22px, weight 600, line-height 1.3
- H4: 16-17px, weight 600

═══════════════════════════════════════════════════════════
REQUIRED PAGE STRUCTURE
═══════════════════════════════════════════════════════════
All class names below MUST appear in the HTML for validation.

<main class="experience-shell">

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       1. NAVIGATION — sticky, refined, with subtle backdrop blur
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <nav class="site-nav">
    - Sticky top, white/95% with backdrop-filter: blur(12px)
    - Border-bottom 1px solid var(--line)
    - Height 68px, max-width 1200px container with side padding
    - Brand logo (text + small colored dot/square mark): weight 700, 18px
    - 3-4 center nav links: weight 500, 15px, ink-soft, hover to ink
    - Right side: secondary "Log in" link + primary CTA button
    - CTA button: brand-primary bg, white text, 10px radius, 9px 18px padding
  </nav>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       2. HERO — split 55/45 layout, premium and confident
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="hero-grid">
    - Padding clamp(80px, 12vw, 140px) top/bottom, container 1200px
    - Background: subtle radial gradient — 
      radial-gradient(ellipse 800px 600px at 70% 0%, rgba(110,87,224,0.04), transparent)
    - Grid: 1.1fr 1fr, gap 80px, align-items center
    
    <div class="hero-copy">
      - Pill badge at top: small icon dot + label like "New: AI-powered insights"
        Style: brand-soft bg, brand-primary text, 12px 14px, 999px radius, 13px
      - H1 with one phrase in brand-primary color (NOT gradient text, just colored span)
        Example: "Generate a <span style="color:var(--brand-primary)">winning strategy</span> in seconds"
      - Subheadline: 19px lead text, max-width 540px, ink-soft
      - Two CTAs in cta-group:
        Primary: brand-primary bg, white, 14px 28px, 12px radius, weight 600, shadow-md
        Secondary: transparent, 1px border, ink, hover bg surface-soft
      - 3 trust indicators below buttons: small checkmark icon (CSS) + text
        Style: muted color, 14px, horizontal row with gaps
    </div>
    
    <div class="hero-composition">
      <div class="ai-product-preview">
        - This is the visual centerpiece — make it look like a real product UI
        - Container: white bg, 1px border var(--line), 16px radius, shadow-xl
        - Padding 24px 28px
        - Top bar: 3 small colored dots (window controls style) + "AI Strategy Engine" label
        - Below: tabs or status bar — "Analyzing..." with small animated dot
        - Main area: 3 signal-card rows, each showing:
          - Small colored circle icon (different colors: green, purple, orange)
          - Strong title text
          - Smaller muted description
          - Right side: small badge or metric chip
        - One highlighted "recommendation" card with brand-soft background
        - Subtle ::before pseudo-element with offset gradient for depth (optional)
        
        Example signal-card content (qualitative, NOT fake numbers):
        - "Buyer-intent keywords identified" / "12 long-tail opportunities"
        - "Conversion gap detected" / "Improve CTA placement"
        - "Revenue path: Affiliate + lead capture" / "Recommended"
      </div>
    </div>
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       3. TRUST BAR — refined logo strip or stat row
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="trust-bar">
    - Background var(--surface-soft), border-top/bottom 1px var(--line)
    - Padding 48px 24px
    - Small centered "Trusted by growth teams at" label (13px uppercase, muted)
    - Below: 5-6 horizontally arranged text "logos" — just brand names in 
      weight 600, 15-16px, muted-light color, evenly spaced with 48-64px gaps
    - Example names (use realistic-sounding business names, NOT real companies):
      "Lumen Labs", "Northwave", "Atlas Studio", "Helio Group", "Vector AI"
    - On mobile: 2x3 grid, smaller text
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       4. TOOL PANEL — the interactive AI configurator (centerpiece)
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="tool-panel">
    - Padding clamp(80px, 10vw, 120px) 24px
    - Max-width 880px, centered
    
    <div class="section-head">
      - Eyebrow label "Try it free" / "Interactive Demo"
      - H2 headline (2 lines max)
      - Subheadline paragraph below
    </div>
    
    <div class="configurator-card">
      - White bg, 1px border var(--line), 20px radius
      - Shadow-lg, padding clamp(32px, 5vw, 56px)
      - At top: small step indicator row (3-4 dots/pills) showing progress
      
      <form id="business-asset-form">
        - Render each input as a field-card
        ${inputsFieldGuide}
        
        Each field-card:
        - Background var(--surface-soft), 1px border var(--line), 14px radius
        - Padding 20px
        - Hover: border-color brand-primary, very subtle lift
        - Label row: icon-chip (8px colored circle) + label text (14px weight 600)
        - Description below label (13px muted)
        - Input/select below: white bg, 1px border, 10px radius, 12px 14px padding
        - Input focus: border brand-primary, 3px outline brand-primary at 12% opacity
        - Custom select arrow (CSS-only, no native arrow)
        
        Submit button:
        - Full width, brand-primary bg, white text, 14px 28px, 12px radius
        - Weight 600, 16px font, shadow-md
        - Hover: slight lift, darker brand color
        - Icon on right (CSS arrow)
        - Text: dynamic from blueprint.cta_text or "Generate My Strategy →"
      </form>
      
      <div class="analysis-workspace" style="display:none;">
        - Shown after submit, separated by 32px margin and 1px border-top
        - Padding-top 40px
        - Top: success badge "Analysis Complete" + small timestamp
        
        - score-meter (visual): 
          Circular SVG, 120px wide, brand-primary stroke at 75% progress
          OR horizontal progress bar with percentage label
          Always shows a qualitative score (e.g., 85/100) with label "Opportunity Score"
        
        - Grid of insight cards (3 columns, 1 on mobile):
          
          <div class="signal-card">
            - White bg, 1px border, 14px radius, 24px padding
            - Top: small colored icon chip (CSS, not image)
            - Title (16px weight 600)
            - Description (14px muted, 2-3 lines)
            - Bottom: small metric/badge
          </div>
          
          <div class="strategy-card">
            - Same structure, different accent color
            - Title: "Recommended Action"
            - Description with strategic recommendation
          </div>
          
          <div class="monetization-card">
            - Background brand-soft (subtle purple tint)
            - 1px border brand-primary at 20% opacity
            - Same internal structure
            - Title: "Revenue Path"
            - Description: realistic monetization approach
          </div>
        
        - Bottom: secondary CTA button "Export Full Report" or "Get Detailed Analysis"
      </div>
    </div>
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       5. METRICS / OUTCOMES — premium stat showcase
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="metrics-section">
    - Background var(--surface-soft), padding clamp(72px, 10vw, 100px) 24px
    - Centered section-head (eyebrow + h2 + subhead)
    - Below: 4-column grid of metric blocks (2x2 on mobile)
    - Each metric:
      - Large number: 48-56px, weight 800, ink color (or brand-primary for emphasis)
      - Label below: 14-15px, weight 500, muted
      - Optional small description: 13px, muted-light
    - Use qualitative outcomes NOT fake numbers:
      Example: "10x faster" / "Strategy generation"
               "AI-powered" / "Insights engine"
               "Real-time" / "Recommendations"
               "End-to-end" / "Monetization paths"
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       6. BENEFITS — feature grid with icons and depth
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="benefits-grid">
    - Padding clamp(80px, 10vw, 120px) 24px, max-width 1200px
    - section-head at top
    - 3-column grid (1 col on mobile), gap 32px
    - 6 benefit-card items (use blueprint.features):
      Each card:
      - White bg, 1px border var(--line), 16px radius, 32px padding
      - Hover: border brand-primary at 30% opacity, shadow-md, slight lift
      - Top: icon-chip — 48px square, brand-soft bg, brand-primary text
        Inside: CSS-only icon shape (rotated square, circle with line, etc.)
      - H3 title (18px weight 600), margin 20px top
      - Description (15px muted, 1.6 line height)
      - Optional small link "Learn more →" at bottom
    - Features to highlight: ${JSON.stringify(features)}
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       7. TIMELINE / MONETIZATION ROADMAP — process steps
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="timeline-rail">
    - Padding clamp(80px, 10vw, 120px) 24px, max-width 1100px
    - section-head: eyebrow "How it works" / "From free asset to revenue"
    - 4 roadmap-step items in horizontal row (vertical stack on mobile)
    - Each step:
      - Number badge: 40px circle, brand-primary bg, white text, weight 700
      - Title (17px weight 600) below number
      - Description (14px muted, 1.6) below title
      - Connecting line between steps: 2px dashed line in brand-primary at 20% opacity
    - Use blueprint.monetization_roadmap content if available
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       8. TESTIMONIALS — credible quotes (no avatars, no fake logos)
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="testimonial-grid">
    - Padding clamp(72px, 10vw, 100px) 24px, max-width 1100px
    - section-head with eyebrow "Loved by builders" / "Real outcomes"
    - 2-3 column grid, gap 32px
    - 3 testimonial-card items:
      - White bg, 1px border, 16px radius, 32px padding
      - Top: quote mark (large stylized " in brand-primary at 30% opacity)
      - Quote text: 16-17px ink-soft, line-height 1.65, weight 500
      - Bottom attribution row:
        - Initials avatar: 40px circle, brand-soft bg, brand-primary text initials
        - Name (15px weight 600) + role (13px muted)
    - Use plausible names like "Sarah Chen / Growth Lead at Atlas Studio"
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       9. FAQ — native accordion, clean styling
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="faq-section">
    - Padding clamp(72px, 10vw, 100px) 24px
    - Max-width 760px, centered
    - section-head: eyebrow + h2 "Frequently asked questions"
    - 6-8 FAQ items as <details>:
      Each: 
      - 1px border var(--line), 14px radius, margin-bottom 12px
      - Padding 0 (controlled by summary/content padding)
      - <summary>: 20px padding, weight 600 16px, cursor pointer
        - Has list-style: none and ::-webkit-details-marker { display:none }
        - Plus icon on right (CSS-only) that rotates to minus on open
      - Open state content: padding 4px 20px 24px, 15px muted, 1.65 line-height
      - Open state: background var(--surface-soft)
    - Generate FAQs from blueprint context (relevant to the tool/asset)
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       10. FINAL CTA — premium conversion block
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="final-cta">
    - Container max-width 1100px, padding clamp(64px, 10vw, 100px) 24px
    - Inside: large rounded container (24px radius)
    - Background: rich dark surface var(--surface-dark)
      WITH subtle gradient overlay:
      background: linear-gradient(135deg, #0F0F12 0%, #1A1530 100%)
    - OR use brand-tinted version:
      background: linear-gradient(135deg, var(--brand-primary), #3D2D9E)
    - Padding clamp(56px, 8vw, 88px) clamp(32px, 6vw, 64px)
    - Text-align center, color white
    - H2 emotional headline (40-48px weight 700, white)
    - Subheadline (18-19px, white at 80% opacity, max-width 640px)
    - Single primary CTA button:
      - White bg, brand-primary text, 16px 36px, 12px radius
      - Weight 700, 17px, shadow-lg
      - Hover: subtle lift + slight scale (1.02)
    - Below button: small text "No credit card required • Cancel anytime" in white at 60%
  </section>

  <!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       11. FOOTER — polished 4-column SaaS footer
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <footer class="site-footer">
    - Background white, border-top 1px var(--line)
    - Padding 72px 24px 40px, max-width 1200px
    
    <div class="footer-grid">
      - 4-column grid (2x2 on tablet, 1 col on mobile), gap 48px
      
      Column 1 (wider, 1.5fr):
      - Brand mark (logo dot + name)
      - Brand description (2 lines, 14px muted)
      - <div class="newsletter">
          - Small heading "Get monthly insights"
          - Email input + button row (compact)
          - Input: 1px border, 8px radius, 10px 14px padding, 14px font
          - Button: brand-primary bg, white, 8px radius, 10px 16px
        </div>
      
      Columns 2-4 (Product, Resources, Company):
      - Heading: 13px uppercase, weight 600, ink, letter-spacing 0.05em
      - List: 4-5 links each, 14px, muted, hover ink
      - No bullet points, just stacked links with 12px line-height spacing
    </div>
    
    Bottom row (margin-top 56px, padding-top 32px, border-top 1px line-soft):
    - Flex justify-between
    - Left: copyright "© 2025 [Brand]. All rights reserved." (13px muted)
    - Right: text social links (Twitter, LinkedIn, GitHub) — 13px muted, hover ink
    - NO icon images, just text
  </footer>

</main>

═══════════════════════════════════════════════════════════
INTERACTIVE BEHAVIOR
═══════════════════════════════════════════════════════════
<script>
  // Form submit reveals analysis-workspace
  const form = document.getElementById('business-asset-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const originalText = button.innerHTML;
      
      // Brief loading state
      button.innerHTML = '<span>Analyzing...</span>';
      button.disabled = true;
      
      setTimeout(() => {
        const workspace = document.querySelector('.analysis-workspace');
        if (workspace) {
          workspace.style.display = 'block';
          workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        button.innerHTML = originalText;
        button.disabled = false;
      }, 800);
    });
  }
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
</script>

═══════════════════════════════════════════════════════════
PREMIUM POLISH RULES
═══════════════════════════════════════════════════════════

DEPTH (use these subtly for premium feel):
- Layered shadows on key cards (shadow-md or shadow-lg, NOT shadow-xl everywhere)
- Subtle 1px borders + soft shadow combo (NOT shadow only)
- Hover lifts: transform translateY(-2px), 200ms ease — subtle, not bouncy
- Hero composition: ONE small absolutely-positioned decorative element behind the preview card (like a subtle gradient blob with low opacity, 60% blur, positioned with -10% offset)
- The final-cta IS allowed a dark background and tinted gradient (it's the only section)

COLOR USAGE:
- Brand-primary used on: CTAs, key icons, eyebrow text, focus rings, brand mark dot
- Most surfaces stay white or near-white
- One section (final-cta) is dark for visual rhythm
- Subtle brand tints in: monetization-card background, hero radial glow, badge

WHITESPACE:
- Section padding 80-120px is non-negotiable
- Generous internal padding on cards (28-32px on benefit-cards, 32-56px on configurator)
- Inter-element gaps: 16-24px between text blocks, 32-48px between major elements

MOTION:
- All transitions: 150-200ms ease (fast and responsive)
- Hover states: subtle color shifts, 2-4px lifts, NO bouncy or dramatic animations
- One subtle animated element OK: pulsing dot in product preview, or shimmer on primary CTA
- Respect prefers-reduced-motion media query

DO NOT:
✗ Use gradient text effects (-webkit-background-clip)
✗ Use glassmorphism (backdrop-filter blur over 12px)
✗ Use multiple dark sections (only final-cta is dark)
✗ Use floating gradient orbs as primary visuals
✗ Use border-radius over 24px
✗ Use shadows with blur over 30px
✗ Use Font Awesome, icon libraries, or Tailwind CDN
✗ Use Arial or system fonts (Inter only)
✗ Use fake hard numbers ("10,000 users") — use qualitative outcomes
✗ Use real company logos in trust bar
✗ Use cinematic/overwhelming gradients
✗ Use over-the-top neon glows

═══════════════════════════════════════════════════════════
RESPONSIVE DESIGN
═══════════════════════════════════════════════════════════
@media (max-width: 1024px) — tablet adjustments
@media (max-width: 768px) — mobile:
  - hero-grid: 1 column, hero-composition below hero-copy
  - benefits-grid, testimonial-grid, metrics: stack to 1 column
  - timeline-rail: vertical stack
  - footer-grid: 2 columns or stacked
  - All padding reduced by 30-40%
  - H1: clamp(36px, 8vw, 48px)
  - Section padding: 64px

═══════════════════════════════════════════════════════════
BLUEPRINT DATA TO IMPLEMENT
═══════════════════════════════════════════════════════════
${blueprintJsonForLandingPrompt(blueprint, 22000)}

═══════════════════════════════════════════════════════════
FINAL CHECKLIST
═══════════════════════════════════════════════════════════
Your HTML output MUST include ALL these class names:
□ experience-shell, site-nav, hero-grid, hero-copy, hero-composition
□ ai-product-preview, trust-bar, tool-panel, configurator-card
□ field-card (one per input), analysis-workspace
□ signal-card, strategy-card, monetization-card
□ score-ring or score-meter
□ benefits-grid (with benefit-card items inside)
□ timeline-rail (with roadmap-step items)
□ testimonial-grid (with testimonial-card items)
□ faq-section, final-cta
□ site-footer, footer-grid, newsletter

Quality requirements:
□ Real <form id="business-asset-form"> with <input>/<select> + <button type="submit">
□ <script> block with form interactivity
□ @media query for responsive
□ Inter font loaded from Google Fonts
□ ALL CSS variables defined (--brand-primary, --surface, --ink, --line, etc.)
□ No --primary-color (use --brand-primary)
□ Final file size 40-80KB
□ Feels like Stripe/Linear/Vercel — premium, polished, confident
□ Has visual depth without being cinematic
□ Has clear conversion path with multiple CTAs

Generate the complete production-ready premium SaaS landing page HTML now:`;
}

type HtmlQualityMode = "landing" | "standalone" | "embed";

function fillEmptyClassContainer(html: string, className: string, fallbackContent: string): string {
  const emptyContainerPattern = new RegExp(
    `<div([^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*)>\\s*</div>`,
    "gi"
  );

  return html.replace(emptyContainerPattern, `<div$1>${fallbackContent}</div>`);
}

function normalizeGeneratedHtml(html: string): string {
  let normalized = html
    .replace(/^```(?:html)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .replace(/--primary-color/gi, "--brand-primary")
    .replace(/--secondary-color/gi, "--brand-secondary")
    .replace(/border-radius:\s*8px/gi, "border-radius: 10px")
    .trim();

  if (!normalized.toLowerCase().includes("@media") && /<\/style>/i.test(normalized)) {
    const responsiveFallback = `

@media (max-width: 900px) {
  .hero-grid, .tool-panel, .footer-grid, .testimonial-grid, .benefits-grid, .timeline-rail, .tool-form-grid {
    grid-template-columns: 1fr !important;
  }

  .experience-shell, .taf-widget {
    overflow-x: hidden;
  }

  .hero-composition, .ai-product-preview, .configurator-card, .analysis-workspace, .tool-card, .taf-tool-panel, .taf-insight-dashboard {
    border-radius: 14px;
  }
}

@media (max-width: 640px) {
  body, .experience-shell {
    padding-inline: 0;
  }

  .site-nav, .hero-grid, .tool-panel, .site-footer, .taf-widget {
    padding-inline: 18px !important;
  }

  h1 {
    font-size: clamp(2rem, 9vw, 2.75rem) !important;
    line-height: 1.1 !important;
  }

  .field-card, .signal-card, .strategy-card, .monetization-card, .taf-field-card, .taf-strategy-card {
    padding: 18px !important;
  }
}`;

    normalized = normalized.replace(/<\/style>/i, `${responsiveFallback}\n</style>`);
  }

  const aiProductPreviewFallback = `
    <div class="preview-header">
      <p class="eyebrow">AI insight preview</p>
      <h3>Strategy Console</h3>
    </div>
    <div class="preview-grid">
      <article class="signal-card">
        <small>Traffic signal</small>
        <strong>Buyer-intent topics detected</strong>
        <p>Prioritize comparison pages and conversion-focused content clusters.</p>
      </article>
      <article class="signal-card">
        <small>Conversion gap</small>
        <strong>Lead capture can be stronger</strong>
        <p>Use a guided assessment with a clear next step.</p>
      </article>
      <article class="strategy-card">
        <small>Recommendation</small>
        <strong>Lead with authority</strong>
        <p>Pair the interactive report with trust signals and use-case pages.</p>
      </article>
      <article class="monetization-card">
        <small>Revenue path</small>
        <strong>Consulting or productized offer</strong>
        <p>Route qualified visitors into a clear next step.</p>
      </article>
    </div>`;

  normalized = fillEmptyClassContainer(normalized, "ai-product-preview", aiProductPreviewFallback);

  return normalized;
}

/**
 * Quality gate requires a literal `<form` in embed HTML. Models often emit div-only
 * step UIs. When both tool panel and insight dashboard exist, wrap panel content in a
 * semantic form (submit still handled in JS).
 */
function ensureEmbedSemanticForm(html: string): string {
  const lower = html.toLowerCase();
  if (lower.includes("<form")) return html;

  const toolPanelOpen = /<div\b[^>]*\bclass\s*=\s*["'][^"']*\btaf-tool-panel\b[^"']*["'][^>]*>/i;
  const insightOpen = /<div\b[^>]*\bclass\s*=\s*["'][^"']*\btaf-insight-dashboard\b[^"']*["'][^>]*>/i;

  const toolMatch = html.match(toolPanelOpen);
  const insightMatch = html.match(insightOpen);
  if (!toolMatch || !insightMatch || toolMatch.index === undefined || insightMatch.index === undefined) {
    return html;
  }
  if (toolMatch.index > insightMatch.index) {
    return html;
  }

  return html
    .replace(
      toolPanelOpen,
      (m) =>
        `${m}<form id="taf-assessment-form" class="taf-assessment-form" onsubmit="event.preventDefault();">`
    )
    .replace(insightOpen, "</form>$&");
}

function assertPremiumHtmlQuality(html: string, mode: HtmlQualityMode): void {
  const lower = html.toLowerCase();
  const bannedPatterns = [
    { pattern: "font-family: 'arial'", label: "Arial typography" },
    { pattern: "font-family: arial", label: "Arial typography" },
    { pattern: "darken(", label: "invalid darken() CSS" },
    { pattern: "bootstrap", label: "Bootstrap-style dependency" },
    { pattern: "cdn.tailwindcss.com", label: "Tailwind CDN dependency" },
    { pattern: "font-awesome", label: "Font Awesome dependency" },
    { pattern: "cdnjs.cloudflare.com/ajax/libs/font-awesome", label: "icon CDN dependency" },
    { pattern: "--primary-color", label: "generic legacy CSS tokens" },
    { pattern: "--secondary-color", label: "generic legacy CSS tokens" },
    { pattern: "© 2023", label: "cheap autogenerated footer year" },
  ];

  const violations = bannedPatterns
    .filter(({ pattern }) => lower.includes(pattern))
    .map(({ label }) => label);

  if (mode !== "embed" && !lower.includes("<!doctype html")) {
    violations.push("missing <!DOCTYPE html>");
  }

  if (mode === "embed" && !lower.includes("taf-")) {
    violations.push("embed output missing taf- scoped IDs/classes");
  }

  if (mode === "embed") {
    const forbiddenEmbedMarkup = ["<!doctype", "<html", "<head", "<body", "<footer"];
    const forbiddenEmbedMatches = forbiddenEmbedMarkup.filter((pattern) => lower.includes(pattern));
    if (forbiddenEmbedMatches.length > 0) {
      violations.push(`embed output includes forbidden page-level markup: ${forbiddenEmbedMatches.join(", ")}`);
    }
  }

  if (!lower.includes("<style")) {
    violations.push("missing reusable CSS style block");
  }

  if (html.length > 120000) {
    violations.push("HTML output is too bloated for stable preview/publishing");
  }

  if (!lower.includes("@media")) {
    violations.push("missing responsive media queries");
  }

  if (!/inter|manrope|sf pro/.test(lower)) {
    violations.push("missing premium font system");
  }

  if (mode !== "embed") {
    const hasInteractiveControls =
      lower.includes("<form") ||
      ((lower.includes("<input") || lower.includes("<select") || lower.includes("<textarea")) &&
        lower.includes("<button"));

    if (!lower.includes("<footer")) violations.push("missing premium footer");
    if (!hasInteractiveControls) violations.push("missing interactive tool controls");
    if (!lower.includes("<script")) violations.push("missing interaction script");
  }

  // For both "landing" and "standalone" modes, use the same minimalist component set
  if (mode === "standalone" || mode === "landing") {
    const coreStandaloneComponents = [
      "experience-shell",
      "hero-grid",
      "hero-composition",
      "tool-panel",
      "configurator-card",
      "field-card",
      "analysis-workspace",
      "site-footer",
    ];

    const missingCoreComponents = coreStandaloneComponents.filter((component) => !lower.includes(component));
    if (missingCoreComponents.length > 0) {
      violations.push(`missing core minimalist components: ${missingCoreComponents.join(", ")}`);
    }

    const premiumStandaloneSignals = [
      "ai-product-preview",
      "trust-bar",
      "signal-card",
      "strategy-card",
      "monetization-card",
      "timeline-rail",
      "testimonial-card",
      "faq-section",
      "footer-grid",
      "newsletter",
    ];
    const presentPremiumSignals = premiumStandaloneSignals.filter((component) => lower.includes(component));
    if (presentPremiumSignals.length < 6) {
      violations.push(`needs more premium sections (${presentPremiumSignals.length}/6 found)`);
    }

    if (!lower.includes("score-ring") && !lower.includes("score-meter")) {
      violations.push("missing visual score component");
    }
  }

  if (mode === "embed") {
    const coreEmbedComponents = [
      "taf-widget",
      "taf-widget-header",
      "taf-stepper",
      "taf-tool-panel",
      "taf-field-card",
      "taf-insight-dashboard",
    ];

    const missingCoreComponents = coreEmbedComponents.filter((component) => !lower.includes(component));
    if (missingCoreComponents.length > 0) {
      violations.push(`missing core embed mini-SaaS components: ${missingCoreComponents.join(", ")}`);
    }

    const premiumEmbedSignals = [
      "taf-ai-badge",
      "taf-progress",
      "taf-step-card",
      "taf-metric-card",
      "taf-strategy-card",
      "taf-cta-block",
      "taf-lead-capture",
      "taf-export-actions",
    ];

    const presentPremiumSignals = premiumEmbedSignals.filter((component) => lower.includes(component));
    if (presentPremiumSignals.length < 5) {
      violations.push(`embed widget needs more premium interaction sections (${presentPremiumSignals.length}/5 found)`);
    }

    if (!lower.includes("taf-score-ring") && !lower.includes("taf-score-meter")) {
      violations.push("missing embed visual opportunity score component");
    }

    if (!lower.includes("<form")) {
      violations.push("missing embed interactive form");
    }

    if (!lower.includes("<script")) {
      violations.push("missing embed interaction script");
    }

    if (html.length > 80000) {
      violations.push("embed HTML output is too bloated for stable embedding");
    }
  }

  if (violations.length > 0) {
    throw new Error(`Generated HTML failed premium quality checks: ${violations.join(", ")}`);
  }
}

async function generateLandingPageWithAnthropic(prompt: string, apiKey: string): Promise<string> {
  console.log("[Landing Page/Anthropic] Generating");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 20000,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Landing Page/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = (await response.json()) as any;

    let html = "";
    if (data.content && Array.isArray(data.content)) {
      html = data.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n")
        .trim();
    } else {
      throw new Error("Unexpected API response structure");
    }

    html = normalizeGeneratedHtml(html);
    // FIXED: Use "standalone" validation mode since the prompt produces standalone-style classes
    assertPremiumHtmlQuality(html, "standalone");

    console.log("[Landing Page/Anthropic] Generated successfully, length:", html.length);
    return html;
  } catch (error) {
    console.error("[Landing Page/Anthropic] Generation error:", error);
    throw error;
  }
}

async function generateLandingPageWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  console.log("[Landing Page/OpenAI] Generating");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a principal SaaS product designer. Output only raw HTML. Create clean, minimalist, professional landing pages with reusable CSS, Inter typography, polished sections, and no flashy effects. Think Linear, Vercel, Stripe — restrained and confident.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        // gpt-4o chat completions cap completion tokens at 16384; higher values return HTTP 400.
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Landing Page/OpenAI] API error ${response.status}:`, errorText);
      const detail = errorText.replace(/\s+/g, " ").trim().slice(0, 400);
      throw new Error(
        detail ? `OpenAI API ${response.status}: ${detail}` : `OpenAI API returned ${response.status}`
      );
    }

    const data = (await response.json()) as any;
    let html = data.choices?.[0]?.message?.content || "";

    if (!html) {
      throw new Error("Empty response from OpenAI");
    }

    html = normalizeGeneratedHtml(html);
    // FIXED: Use "standalone" validation mode since the prompt produces standalone-style classes
    assertPremiumHtmlQuality(html, "standalone");

    console.log("[Landing Page/OpenAI] Generated successfully, length:", html.length);
    return html;
  } catch (error) {
    console.error("[Landing Page/OpenAI] Generation error:", error);
    throw error;
  }
}

function generateHTMLPrompt(blueprint: any, action: "standalone" | "embed"): string {
  const standaloneRequirements = `
STANDALONE EXPERIENCE CONTRACT (PREMIUM PRODUCTION SaaS — same philosophy as landing generator)
Target quality: Stripe, Linear, Vercel, Framer, Notion — sophisticated, polished, conversion-focused, with depth and craft.
NOT empty minimal pages. NOT cinematic / neon / flashy overload. Confident premium modern UI with strategic visual interest.

OUTPUT (standalone):
- Raw HTML only, starting with <!DOCTYPE html>; one <style> in <head>, one <script> before </body>
- Inter from Google Fonts (weights 400, 500, 600, 700, 800)
- Aim ~40–80KB: substantial sections, real copy, no hollow placeholders
- Real <form id="business-asset-form"> with inputs/selects + <button type="submit">
- Script: preventDefault submit → brief "Analyzing..." on button → reveal .analysis-workspace and smooth scroll; anchor # smooth scroll

DESIGN SYSTEM (:root — define all in CSS; no --primary-color):
--brand-primary, --brand-primary-hover, --brand-primary-soft, --brand-secondary, --brand-accent
--surface, --surface-soft, --surface-strong, --surface-dark
--ink, --ink-soft, --muted, --muted-light
--line, --line-soft, --line-dark
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
--radius-sm through --radius-2xl (max 24px)

TYPOGRAPHY: eyebrow 13px/600 uppercase tracked; body 16px/1.7; lead 18–19px; H1 clamp(44px,5.5vw,68px); H2 clamp(32px,4vw,48px); card titles 20–22px/600.

REQUIRED CLASS NAMES (must all appear for automated validation):
experience-shell, site-nav, hero-grid, hero-copy, hero-composition, ai-product-preview,
trust-bar, tool-panel, configurator-card, field-card (per blueprint input), analysis-workspace,
signal-card, strategy-card, monetization-card, score-ring OR score-meter,
metrics-section, benefits-grid with benefit-card items, timeline-rail with roadmap-step,
testimonial-grid with testimonial-card, faq-section, final-cta,
site-footer, footer-grid, newsletter

SECTION INTENT (implement as real HTML/CSS, not comments):
1) site-nav: sticky, white/~95% + backdrop-filter blur ≤12px, 68px height, border-bottom, brand mark + 3–4 links + Log in + primary CTA.
2) hero-grid: ~55/45 split, generous padding, subtle radial brand glow in background; hero-copy with pill badge, H1 with one brand-colored span (no gradient text), cta-group (primary + secondary), 3 trust checks; hero-composition holds ai-product-preview (product UI mock: window dots, status, rows, one highlighted row).
3) trust-bar: fictional company names as text only (e.g. Lumen Labs, Northwave) — no real logos.
4) tool-panel + configurator-card + section-head: step dots; form with elevated field-cards (hover border/lift), icon-chip labels, custom select arrow CSS-only; submit full-width; hidden analysis-workspace with success state, score component, 3-column insight cards + secondary CTA.
5) metrics-section: qualitative headline metrics (no fake "10,000 users").
6) benefits-grid: six benefit-cards with icon-chips, borders, hover lift + shadow-md.
7) timeline-rail: four roadmap-step items + dashed connector.
8) testimonial-grid: three testimonial-cards, initials circles only (no photos).
9) faq-section: 6–8 native <details> with styled summary + plus/minus CSS.
10) final-cta: ONLY dark section — deep gradient (surface-dark / brand tint), white type, one strong CTA, reassurance line.
11) site-footer: footer-grid 4 columns + newsletter row; bottom legal + text social links.

POLISH: combine 1px borders with soft shadows; hover translateY(-2px) 200ms ease; one subtle decorative blob behind preview OK (low opacity, ≤60% blur); respect prefers-reduced-motion.
FORBIDDEN: gradient text (-webkit-background-clip), backdrop blur >12px except light nav, multiple dark sections, Tailwind CDN, Font Awesome, Arial, fake hard stats, real company logos in trust bar, shadow blur >30px, radius >24px.

RESPONSIVE: @media (max-width:1024px) tablet tweaks; @media (max-width:768px) stack hero, grids, timeline; reduce paddings 30–40%.
`;

  const embedRequirements = `
EMBED EXPERIENCE CONTRACT
Create one compact premium mini SaaS application, not a form snippet, copy-paste calculator, or generic embed.

NON-NEGOTIABLE TECHNICAL MARKERS (automated quality gate — omission causes build failure):
- The output string MUST contain a real semantic form start tag: use <form (e.g. <form id="taf-assessment-form" class="taf-assessment-form" onsubmit="event.preventDefault();">) wrapping every blueprint input/select inside .taf-tool-panel. Step-based UX hides/shows field groups; do not replace the form with a <div role="form">.
- The generated HTML MUST contain a script element (the literal characters <script) for step navigation, validation, and revealing .taf-insight-dashboard.

Required component architecture and exact class names:
- taf-widget: the outer scoped widget shell.
- taf-widget-header: premium header with badge, title, positioning statement, and trust indicators.
- taf-ai-badge: small AI-powered business intelligence badge.
- taf-stepper: step navigation row with 3-4 steps.
- taf-progress: animated/proportional progress indicator.
- taf-step-card: each progressive step panel.
- taf-tool-panel: main interactive area that contains the step experience.
- taf-field-card: each input/select lives in a premium grouped field card.
- taf-icon-chip: small CSS-only icon/pictogram chip beside labels.
- taf-insight-dashboard: hidden AI results dashboard that appears after submit.
- taf-score-ring or taf-score-meter: visual opportunity score/progress component.
- taf-metric-card: compact KPI cards for traffic, conversion, monetization, and authority.
- taf-strategy-card: recommendations for traffic, conversion, offer, and monetization.
- taf-cta-block: premium next-action CTA block after results.
- taf-lead-capture: compact lead capture or follow-up section.
- taf-export-actions: lightweight export/share/action controls.

Step-based UX requirements (inside the single <form>):
- Organize inputs into progressive steps (Audience, Business Goal, Offer Details, Generate Insights) using field groups or panels.
- Include Back/Next buttons, current step state, and a final "Generate Insights" action that submits via JavaScript.
- If the blueprint has fewer than 4 fields, still create a 3-step experience by grouping related prompts.

Embed visual requirements:
- Clean, minimalist design — same philosophy as standalone mode.
- Inputs must use label-over-field cards, optional icon-chip, smooth focus states, and grouped spacing.
- Results must be a clean insight dashboard, not flashy effects.
- Use only scoped "taf-" classes and IDs. Do not include global nav, footer, page-level tags, or unscoped generic classes.
`;

  return `You are a principal SaaS frontend engineer creating a ${
    action === "standalone"
      ? "premium production-grade, conversion-focused"
      : "clean, minimalist, production-ready"
  } business asset.

Output ONLY raw HTML. No markdown, no code fences, no explanations, no preamble.

Mode: ${action.toUpperCase()}

${
  action === "standalone"
    ? `
Standalone rules:
- Output a complete <!DOCTYPE html> document with html, head, and body.
- Must work as one uploadable .html file.
- Include responsive CSS in one reusable <style> block with CSS variables and component classes.
- Include Inter from Google Fonts.
- Include a clean multi-column footer inside the generated page.
- Wrap the visible page in <main class="experience-shell">.
${standaloneRequirements}
`
    : `
Embed rules:
- Do not include <!DOCTYPE>, html, head, or body tags.
- Output one embeddable wrapper div plus scoped CSS and JavaScript.
- Prefix wrapper, form, input, and result IDs with "taf-" to avoid page conflicts.
- Keep the embed self-contained and responsive.
- Do not include a full site footer in embed mode.
${embedRequirements}
`
}

${
  action === "standalone"
    ? `Design mandate (PREMIUM STANDALONE):
- Follow the STANDALONE EXPERIENCE CONTRACT above: every listed class name, real form + script, qualitative metrics, fictional trust-bar names only.
- Substantial content per section; depth from borders + restrained shadows + hover lifts — not empty whitespace minimalism.
- One dark block only: .final-cta; elsewhere white/near-white. Nav blur ≤12px.
- No gradient text, no Tailwind CDN, no icon fonts, no Arial, no fake hard user counts.
- Inter weights 400–800; @media responsive; prefers-reduced-motion respected.`
    : `Design mandate (EMBED):
- Compact premium mini SaaS per embed contract: scoped taf- classes, semantic form in .taf-tool-panel, restrained polish.
- Clean insight dashboard after submit; avoid flashy chrome, external images, invalid CSS.`
}

Business mandate:
- This is a business opportunity asset, growth engine, lead magnet, conversion tool, traffic system, SEO system, or revenue optimization dashboard.
- Avoid generic calculator framing. Button labels should say things like "Reveal My Opportunity", "Generate My Strategy", "Analyze Growth Potential", or "Build My Revenue Plan".
- The results section must provide strategic recommendations, opportunity scores, prioritized next steps, and monetization guidance.

Functionality requirements:
- Render every field listed in blueprint.inputs_required.
- Validate required inputs.
- Show a hidden results panel after submission without page reload.
- Use JavaScript that is complete, safe, and has no undefined variables.
- Use focus-visible styles, reduced-motion media query, semantic labels, and responsive grouped fields.

SELECTED VISUAL THEME (from blueprint.visual_theme — user chose in the app; MUST drive :root colors, button accents, and link/focus hues):
Theme key: ${resolveVisualThemeKey(blueprint)}
${visualThemeGenerationContract(resolveVisualThemeKey(blueprint))}
Apply these hues to CSS variables (--brand-primary, --brand-secondary if used, surfaces, lines). Standalone and embed must visually match this theme, not a generic purple template unless theme is purple.

Blueprint to implement:
${JSON.stringify(blueprint, null, 2)}

Pre-flight checklist:
- Raw HTML only.
- Responsive on desktop, tablet, and mobile.
- Uses premium reusable CSS, not mostly inline styles.
- Uses Inter, never Arial.
- No invalid CSS functions.
- ${
    action === "standalone"
      ? "Standalone: premium SaaS marketing depth without cinematic overload; embed: no flashy widget chrome."
      : "No flashy or cinematic design."
  }
- No generic calculator wording unless required.
- Standalone mode includes a polished footer; embed mode does not.
- JavaScript runs without errors.

Generate the complete ${
    action === "standalone" ? "premium production-ready SaaS" : "clean minimalist"
  } HTML now:`;
}

async function generateHTMLWithAnthropic(
  prompt: string,
  apiKey: string,
  mode: "standalone" | "embed"
): Promise<string> {
  console.log("[HTML/Anthropic] Generating");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: mode === "standalone" ? 16000 : 10000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[HTML/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = (await response.json()) as any;

    let html = "";
    if (data.content && Array.isArray(data.content)) {
      html = data.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n")
        .trim();
    } else {
      throw new Error("Unexpected API response structure");
    }

    html = normalizeGeneratedHtml(html);
    if (mode === "embed") {
      html = ensureEmbedSemanticForm(html);
    }
    assertPremiumHtmlQuality(html, mode);

    console.log("[HTML/Anthropic] Generated successfully, length:", html.length);
    return html;
  } catch (error) {
    console.error("[HTML/Anthropic] Generation error:", error);
    throw error;
  }
}

async function generateHTMLWithOpenAI(
  prompt: string,
  apiKey: string,
  mode: "standalone" | "embed"
): Promise<string> {
  console.log("[HTML/OpenAI] Generating");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a principal SaaS product designer. Output only raw HTML. Create clean, minimalist, professional AI business asset experiences with reusable component classes, Inter typography, calm spacing, subtle shadows, soft borders, and no flashy effects. Think Linear, Vercel, Stripe. In embed mode always include a literal <form element wrapping tool inputs and a <script block for interaction.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: mode === "standalone" ? 16000 : 10000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[HTML/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = (await response.json()) as any;
    let html = data.choices?.[0]?.message?.content || "";

    if (!html) {
      throw new Error("Empty response from OpenAI");
    }

    html = normalizeGeneratedHtml(html);
    if (mode === "embed") {
      html = ensureEmbedSemanticForm(html);
    }
    assertPremiumHtmlQuality(html, mode);

    console.log("[HTML/OpenAI] Generated successfully, length:", html.length);
    return html;
  } catch (error) {
    console.error("[HTML/OpenAI] Generation error:", error);
    throw error;
  }
}

export async function regenerateBlueprintFromBlueprint(
  currentBlueprint: string,
  niche: string,
  goal: string,
  anthropicKey: string | null,
  openaiKey: string | null
): Promise<string> {
  console.log("[Blueprint Regenerate] Starting");

  const prompt = generateRegenerateBlueprintPrompt(currentBlueprint, niche, goal);

  if (anthropicKey) {
    try {
      return await regenerateBlueprintWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Blueprint Regenerate] Anthropic failed:", error);
      if (!openaiKey) throw error;
      console.log("[Blueprint Regenerate] Falling back to OpenAI...");
    }
  }

  if (openaiKey) {
    return await regenerateBlueprintWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for blueprint regeneration");
}

function generateRegenerateBlueprintPrompt(currentBlueprint: string, niche: string, goal: string): string {
  return `Regenerate this blueprint as a premium AI Online Business Opportunity strategy document.

Return ONLY valid JSON. No markdown fences. No explanations.

Current Blueprint:
${currentBlueprint}

Context:
- Niche and Category: ${niche}
- Goal: ${goal}

Improve it so it feels startup-grade, monetizable, authority-building, SEO-driven, and conversion-focused.

Required strategy coverage:
- Market opportunity
- Target audience
- Emotional audience pain points
- SEO opportunity
- Traffic acquisition strategy
- Conversion psychology
- Monetization strategy and roadmap
- Authority positioning
- Competitor advantage
- EEAT structure

Keep all existing useful fields and add any missing strategy fields from this schema:
{
  "title": "",
  "category": "",
  "tool_type": "",
  "description": "",
  "purpose": "",
  "market_opportunity": "",
  "target_audience": "",
  "audience_pain_points": [],
  "target_keywords": [],
  "seo_opportunity": "",
  "traffic_acquisition_strategy": "",
  "inputs_required": [],
  "output_type": "",
  "calculation_logic": "",
  "features": [],
  "conversion_psychology": "",
  "monetization_strategy": "",
  "monetization_roadmap": [],
  "authority_positioning": "",
  "competitor_advantage": "",
  "eeat_structure": [],
  "internal_links": [],
  "cta_text": "",
  "theme_suggestions": [],
  "visual_theme": "modern",
  "seo_title": "",
  "seo_description": ""
}

Preserve visual_theme from the current blueprint if it is one of: modern, ocean, forest, sunset, purple, slate. Otherwise set visual_theme to "modern".

Avoid generic calculator framing unless explicitly required. Return ONLY the improved JSON object.`;
}

async function regenerateBlueprintWithAnthropic(prompt: string, apiKey: string): Promise<string> {
  console.log("[Blueprint Regenerate/Anthropic] Generating");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blueprint Regenerate/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = (await response.json()) as any;

    let raw = "";
    if (data.content && Array.isArray(data.content)) {
      raw = data.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n")
        .trim();
    } else {
      throw new Error("Unexpected API response structure");
    }

    raw = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    let blueprint;
    try {
      blueprint = JSON.parse(raw);
    } catch (e) {
      console.error("[Blueprint Regenerate/Anthropic] JSON parse failed:", raw.substring(0, 1000));
      throw new Error("Failed to parse blueprint JSON");
    }

    console.log("[Blueprint Regenerate/Anthropic] Regenerated successfully");
    return JSON.stringify(blueprint);
  } catch (error) {
    console.error("[Blueprint Regenerate/Anthropic] Error:", error);
    throw error;
  }
}

async function regenerateBlueprintWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  console.log("[Blueprint Regenerate/OpenAI] Generating");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI business opportunity strategist creating premium monetization, SEO, authority, and conversion blueprints. Output only valid JSON, no markdown or explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blueprint Regenerate/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = (await response.json()) as any;
    let raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    raw = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const blueprint = JSON.parse(raw);
    console.log("[Blueprint Regenerate/OpenAI] Regenerated successfully");
    return JSON.stringify(blueprint);
  } catch (error) {
    console.error("[Blueprint Regenerate/OpenAI] Error:", error);
    throw error;
  }
}

// Legacy function - kept for backwards compatibility
interface SEOContent {
  intro_text: string;
  h2_sections: Array<{ heading: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  meta_title: string;
  meta_description: string;
  cta_text: string;
}

export async function generateSEOContent(
  toolName: string,
  toolDescription: string,
  niche: string,
  apiKey: string
): Promise<SEOContent> {
  const client = new OpenAI({ apiKey });

  const prompt = `Generate high-authority semantic SEO content for this premium business opportunity asset:

Asset Name: ${toolName}
Description: ${toolDescription}
Niche: ${niche}

Create comprehensive SEO content that helps this asset rank, builds EEAT, and converts high-intent visitors:

1. intro_text: 2-3 paragraph introduction (150-220 words) that explains the business opportunity, user pain, monetization value, and how to use the asset. Include the asset name naturally.

2. h2_sections: 3 content sections with H2 headings and detailed content (110-170 words each). Cover market opportunity, how the asset works, traffic strategy, monetization use cases, and implementation best practices.

3. faqs: 5 frequently asked questions with detailed answers (60-90 words each). Cover buyer-intent questions, trust objections, monetization potential, SEO value, and implementation.

4. meta_title: SEO-optimized page title (50-60 characters) that includes the tool name and primary keyword

5. meta_description: Compelling meta description (140-160 characters) that encourages clicks from search results

6. cta_text: Call-to-action text (20-40 words) that encourages users to try the tool or take next steps

Focus on semantic SEO, NLP keyword coverage, expert-style formatting, EEAT signals, conversion copywriting, and internal linking opportunities. Avoid generic calculator/blog language.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert SEO strategist and conversion copywriter who creates high-authority, EEAT-focused content for premium business opportunity assets.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "seo_content",
          schema: {
            type: "object",
            properties: {
              intro_text: { type: "string" },
              h2_sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["heading", "content"],
                  additionalProperties: false,
                },
              },
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
              meta_title: { type: "string" },
              meta_description: { type: "string" },
              cta_text: { type: "string" },
            },
            required: ["intro_text", "h2_sections", "faqs", "meta_title", "meta_description", "cta_text"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No SEO content generated");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("SEO content generation error:", error);
    throw error;
  }
}

export async function generateVariation(
  blueprint: any,
  audience: string,
  monetization: string,
  anthropicKey: string | null,
  openaiKey: string | null
): Promise<string> {
  const prompt = `You are generating a premium VARIATION of an existing AI business opportunity blueprint optimized for a specific audience and monetization strategy.

ORIGINAL BLUEPRINT:
${JSON.stringify(blueprint, null, 2)}

NEW TARGET AUDIENCE: ${audience}
NEW MONETIZATION STRATEGY: ${monetization}

Your task: Generate a NEW blueprint that reimagines this asset as a startup-grade business opportunity system for the specified audience and monetization approach.

KEY REQUIREMENTS:
1. Keep the same core business asset concept and category
2. Adapt ALL content to appeal to the new target audience
3. Redesign the monetization strategy to align with the specified approach
4. Update keywords, features, and CTAs to match the new focus
5. Strengthen SEO opportunity, traffic strategy, authority positioning, conversion psychology, and EEAT
6. Keep visual_theme from the original blueprint if valid (modern, ocean, forest, sunset, purple, slate); otherwise use "modern"

RETURN THIS EXACT STRUCTURE:
{
"title": "",
"category": "",
"tool_type": "",
"description": "",
"purpose": "",
"market_opportunity": "",
"target_audience": "",
"audience_pain_points": [],
"target_keywords": [],
"seo_opportunity": "",
"traffic_acquisition_strategy": "",
"inputs_required": [],
"output_type": "",
"calculation_logic": "",
"features": [],
"conversion_psychology": "",
"monetization_strategy": "",
"monetization_roadmap": [],
"authority_positioning": "",
"competitor_advantage": "",
"eeat_structure": [],
"internal_links": [],
"cta_text": "",
"theme_suggestions": [],
"visual_theme": "modern",
"seo_title": "",
"seo_description": ""
}

CRITICAL FIELD REQUIREMENTS:
- purpose: EXACTLY 60-100 words
- target_keywords: EXACTLY 5-8 keywords (2-4 words each)
- calculation_logic: EXACTLY 60-80 words
- features: 5-8 items
- monetization_strategy: EXACTLY 40-80 words (must align with: ${monetization})
- internal_links: 5-8 related tools
- cta_text: 1 sentence, conversion-focused
- audience_pain_points: exactly 5 items
- monetization_roadmap: exactly 4 items
- eeat_structure: exactly 5 items

Return ONLY valid JSON, NO markdown fences, NO additional text.`;

  console.log("[Variation] Generating for audience:", audience, "monetization:", monetization);

  if (anthropicKey) {
    try {
      return await generateVariationWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Variation] Anthropic failed:", error);
      if (!openaiKey) throw error;
      console.log("[Variation] Falling back to OpenAI...");
    }
  }

  if (openaiKey) {
    return await generateVariationWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for variation generation");
}

async function generateVariationWithAnthropic(prompt: string, apiKey: string): Promise<string> {
  console.log("[Variation/Anthropic] Generating variation");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Variation/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = (await response.json()) as any;
    let raw = data.content?.[0]?.text || "";

    if (!raw) {
      throw new Error("Empty response from Anthropic");
    }

    let cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object in response");
    }
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    const blueprint = JSON.parse(cleaned);

    if (!blueprint.title || !blueprint.purpose) {
      throw new Error("Missing required fields in variation");
    }

    console.log("[Variation/Anthropic] Generated successfully");
    return JSON.stringify(blueprint);
  } catch (error) {
    console.error("[Variation/Anthropic] Error:", error);
    throw error;
  }
}

async function generateVariationWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  console.log("[Variation/OpenAI] Generating variation");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI business opportunity strategist. Create premium monetization asset variations with strong SEO, conversion, authority, and revenue strategy. Output only valid JSON, no markdown or explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Variation/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = (await response.json()) as any;
    let raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    let cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object in response");
    }
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    const blueprint = JSON.parse(cleaned);

    if (!blueprint.title || !blueprint.purpose) {
      throw new Error("Missing required fields in variation");
    }

    console.log("[Variation/OpenAI] Generated successfully");
    return JSON.stringify(blueprint);
  } catch (error) {
    console.error("[Variation/OpenAI] Error:", error);
    throw error;
  }
}

export async function generateContentWrapper(
  keyword: string,
  niche: string,
  blueprint: string,
  includeCta: boolean,
  ctaType: string | null,
  ctaText: string | null,
  ctaUrl: string | null,
  apiKey: string
): Promise<any> {
  console.log("[Content Wrapper] Generating with keyword:", keyword, "niche:", niche);

  const userPrompt = `Generate a premium semantic SEO content package for an AI business opportunity asset landing page.

Target Keyword: ${keyword}
Niche: ${niche}
Business Asset Blueprint: ${blueprint}
Include CTA: ${includeCta}
CTA Type: ${ctaType || "N/A"}
CTA Text: ${ctaText || "N/A"}
CTA URL: ${ctaUrl || "N/A"}

REQUIREMENTS:

1. Page H1: Engaging, keyword-rich headline (8-12 words) with premium business positioning
2. Introduction: Expert-written opening section (180-240 words) that frames the audience pain, business opportunity, monetization value, and naturally includes the target keyword
3. How It Works: 3-5 numbered steps explaining the strategy asset, scoring logic, recommendations, and business outcome
4. Key Benefits: 5-8 specific benefits tied to traffic, leads, revenue, authority, conversion, or monetization
5. Semantic Keywords: 18-25 related keywords/entities for NLP coverage, topical authority, and search intent
6. FAQ Section: 6-8 common questions with detailed EEAT-style answers
7. Meta Title: SEO-optimized title (55-60 chars)
8. Meta Description: Compelling meta description (150-155 chars)
9. CTA Block: Conversion-focused call-to-action HTML

CONTENT QUALITY RULES:
- Must feel like high-authority content, not an AI-generated blog post.
- Include semantic SEO, NLP keyword coverage, EEAT structure, expert-style formatting, internal linking opportunities, conversion copy, rich sections, FAQs, and trust-building blocks.
- Use language around business opportunity, monetization, traffic generation, lead generation, affiliate revenue, SEO growth, creator revenue, SaaS growth, and passive income when relevant.
- Avoid generic calculator wording unless the blueprint explicitly requires it.
- Write for readers who want a serious online business advantage.

Return ONLY valid JSON in this exact format:
{
  "page_h1": "string",
  "introduction": "string (HTML formatted)",
  "how_it_works": [
    {"step_number": 1, "title": "string", "description": "string"}
  ],
  "key_benefits": [
    "benefit text (1-2 sentences)"
  ],
  "semantic_keywords": [
    "keyword or entity"
  ],
  "faq_section": [
    {"question": "string", "answer": "string (HTML formatted)"}
  ],
  "meta_title": "string",
  "meta_description": "string",
  "cta_block": "string (HTML) or null"
}`;

  try {
    console.log("[Content Wrapper] Making API call to OpenAI");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert semantic SEO strategist, EEAT editor, and conversion copywriter for premium online business assets. Generate publish-ready authority content that ranks and converts. Return ONLY valid JSON with no markdown formatting.",
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Content Wrapper] API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    console.log("[Content Wrapper] API response received");

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content wrapper generated");
    }

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleanedContent);
    console.log("[Content Wrapper] Successfully parsed content package");

    return parsed;
  } catch (error) {
    console.error("[Content Wrapper] Generation error:", error);
    throw error;
  }
}