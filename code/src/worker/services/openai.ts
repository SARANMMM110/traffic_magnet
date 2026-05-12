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
  // Validate API key before proceeding
  if (!apiKey || apiKey.trim().length === 0) {
    console.error("[discoverToolIdeas] API key is empty or undefined");
    throw new Error("OpenAI API key is required");
  }
  
  if (!apiKey.startsWith('sk-')) {
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
    console.log("[discoverToolIdeas] Using API key:", apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');
    
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
                    traffic_potential: {
                      type: "string",
                      enum: ["High", "Medium", "Low"],
                    },
                    link_magnet_score: {
                      type: "string",
                      enum: ["Strong", "Medium", "Weak"],
                    },
                    monetization: {
                      type: "string",
                      enum: ["Strong", "Medium", "Weak"],
                    },
                    keywords: {
                      type: "array",
                      items: { type: "string" },
                    },
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
    
    // Ensure we got exactly 12 premium assets
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
    throw new Error(`Tool discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
- theme_suggestions: exactly 3-5 premium SaaS visual themes.
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

  // Try Anthropic first if available
  if (anthropicKey) {
    try {
      return await generateBlueprintWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Blueprint] Anthropic failed:", error);
      // If OpenAI key is available, try it as fallback
      if (!openaiKey) {
        throw error;
      }
      console.log("[Blueprint] Falling back to OpenAI...");
    }
  }

  // Try OpenAI
  if (openaiKey) {
    return await generateBlueprintWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for blueprint generation");
}

async function generateBlueprintWithAnthropic(
  prompt: string,
  apiKey: string
): Promise<string> {
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
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Blueprint/Anthropic] API error ${response.status}:`, errorText);
        lastError = `API returned ${response.status}: ${errorText}`;
        
        // Don't retry on auth errors
        if (response.status === 401 || response.status === 403) {
          throw new Error("Invalid Anthropic API key");
        }
        continue;
      }

      const data = await response.json() as any;
      console.log("[Blueprint/Anthropic] API response received");

      // Extract text from response
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

      console.log("[Blueprint/Anthropic] ===== RAW AI RESPONSE START =====");
      console.log(raw);
      console.log("[Blueprint/Anthropic] ===== RAW AI RESPONSE END =====");
      console.log("[Blueprint/Anthropic] Raw response length:", raw.length);

      // Clean markdown wrappers
      let cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      
      console.log("[Blueprint/Anthropic] After markdown removal:", cleaned.substring(0, 200));
      
      // Find JSON boundaries (extra safety)
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        console.error("[Blueprint/Anthropic] No JSON found in response:", cleaned.substring(0, 500));
        lastError = "No JSON object in AI response";
        continue;
      }
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);

      console.log("[Blueprint/Anthropic] Extracted JSON:", cleaned.substring(0, 200));

      // Parse JSON
      let blueprint;
      try {
        blueprint = JSON.parse(cleaned);
      } catch (e) {
        console.error("[Blueprint/Anthropic] ===== JSON PARSE ERROR =====");
        console.error("[Blueprint/Anthropic] Error:", e);
        console.error("[Blueprint/Anthropic] Failed to parse this content:");
        console.log(cleaned);
        console.error("[Blueprint/Anthropic] ===== END ERROR =====");
        lastError = `JSON parse error: ${e instanceof Error ? e.message : String(e)}`;
        continue;
      }

      // Validate required fields
      if (!blueprint.title) {
        console.error("[Blueprint/Anthropic] Validation failed: Missing title");
        lastError = "Missing title field";
        continue;
      }
      if (!blueprint.purpose) {
        console.error("[Blueprint/Anthropic] Validation failed: Missing purpose");
        lastError = "Missing purpose field";
        continue;
      }

      // SUCCESS - return as stringified JSON for storage
      console.log("[Blueprint/Anthropic] Generated successfully with all required fields");
      return JSON.stringify(blueprint);

    } catch (err) {
      console.error(`[Blueprint/Anthropic] Attempt ${attempt} threw:`, err);
      lastError = err instanceof Error ? err.message : String(err);
      
      // Re-throw auth errors immediately
      if (err instanceof Error && err.message.includes("Invalid Anthropic API key")) {
        throw err;
      }
    }
  }

  // All retries exhausted
  throw new Error(`Anthropic blueprint generation failed after ${MAX_RETRIES} attempts: ${lastError}`);
}

async function generateBlueprintWithOpenAI(
  prompt: string,
  apiKey: string
): Promise<string> {
  console.log("[Blueprint/OpenAI] Generating blueprint");
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert AI business opportunity strategist creating premium startup-grade blueprints for monetization assets, traffic systems, SEO opportunity systems, and conversion engines. Output only valid JSON, no markdown or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blueprint/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;
    let raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    console.log("[Blueprint/OpenAI] ===== RAW AI RESPONSE START =====");
    console.log(raw);
    console.log("[Blueprint/OpenAI] ===== RAW AI RESPONSE END =====");
    console.log("[Blueprint/OpenAI] Raw response length:", raw.length);

    // Clean markdown wrappers
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    console.log("[Blueprint/OpenAI] After markdown removal:", cleaned.substring(0, 200));
    
    // Find JSON boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("[Blueprint/OpenAI] No JSON found in response");
      throw new Error("No JSON object in OpenAI response");
    }
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    console.log("[Blueprint/OpenAI] Extracted JSON:", cleaned.substring(0, 200));

    // Parse and validate
    let blueprint;
    try {
      blueprint = JSON.parse(cleaned);
    } catch (e) {
      console.error("[Blueprint/OpenAI] ===== JSON PARSE ERROR =====");
      console.error("[Blueprint/OpenAI] Error:", e);
      console.error("[Blueprint/OpenAI] Failed to parse this content:");
      console.log(cleaned);
      console.error("[Blueprint/OpenAI] ===== END ERROR =====");
      throw new Error(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Validate required fields
    if (!blueprint.title) {
      console.error("[Blueprint/OpenAI] Validation failed: Missing title");
      throw new Error("Missing title field");
    }
    if (!blueprint.purpose) {
      console.error("[Blueprint/OpenAI] Validation failed: Missing purpose");
      throw new Error("Missing purpose field");
    }

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
  console.log("[HTML] Has Anthropic key:", !!anthropicKey);
  console.log("[HTML] Has OpenAI key:", !!openaiKey);

  const prompt = generateHTMLPrompt(blueprint, action);

  // Try Anthropic first if available
  if (anthropicKey) {
    try {
      return await generateHTMLWithAnthropic(prompt, anthropicKey, action);
    } catch (error) {
      console.error("[HTML] Anthropic failed:", error);
      // If OpenAI key is available, try it as fallback
      if (!openaiKey) {
        throw error;
      }
      console.log("[HTML] Falling back to OpenAI...");
    }
  }

  // Try OpenAI
  if (openaiKey) {
    return await generateHTMLWithOpenAI(prompt, openaiKey, action);
  }

  throw new Error("No API key available for HTML generation");
}

// ════════════════════════════════════════════════════════════════════════════
// LANDING PAGE GENERATION
// ════════════════════════════════════════════════════════════════════════════

export async function generateLandingPage(
  blueprint: any,
  anthropicKey: string | null,
  openaiKey: string | null
): Promise<string> {
  console.log("[Landing Page] Generating full landing page");
  console.log("[Landing Page] Has Anthropic key:", !!anthropicKey);
  console.log("[Landing Page] Has OpenAI key:", !!openaiKey);

  const prompt = generateLandingPagePrompt(blueprint);

  // Try Anthropic first if available
  if (anthropicKey) {
    try {
      return await generateLandingPageWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Landing Page] Anthropic failed:", error);
      if (!openaiKey) {
        throw error;
      }
      console.log("[Landing Page] Falling back to OpenAI...");
    }
  }

  // Try OpenAI
  if (openaiKey) {
    return await generateLandingPageWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for landing page generation");
}

function generateLandingPagePrompt(blueprint: any): string {
  return `You are a principal product designer, SaaS frontend engineer, and conversion copywriter.

Create a production-ready PREMIUM SaaS landing page for an AI Online Business Opportunity Engine.
Output ONLY a complete HTML document. No markdown fences. No explanations. No preamble.

QUALITY BAR
- The final page must feel inspired by Linear, Stripe, Framer, Notion, Vercel, and modern AI SaaS startups.
- It must look like a polished startup website that customers would pay for, not a generic AI template.
- The UI must be modern, minimal, elegant, highly polished, professional, conversion-focused, and startup-grade.
- Use visual hierarchy, sophisticated spacing, premium typography, soft depth, dashboard-style mockups, metric cards, and conversion sections.

ABSOLUTE BANS
- Do NOT use Arial, Times, Georgia, default sans-serif-only typography, Bootstrap-style layouts, generic color variables like --primary-color, or invalid CSS such as darken().
- Do NOT create a centered gradient header followed by plain white boxes.
- Do NOT use tiny 8px radii, flat cards, basic stacked forms, generic "Get Started" pages, or old-school HTML templates.
- Do NOT rely on external CSS frameworks, Bootstrap, Tailwind CDN, Font Awesome, icon CDNs, images, canvas, iframes, or build tooling.
- Do NOT overuse inline style attributes. Use reusable CSS classes and CSS variables in one <style> block.
- Do NOT place a raw/default HTML form inside the tool area. The embedded tool UI is the product experience and must be premium.
- Do NOT add cheap autogenerated footer text like "© 2023 AI-Powered..." anywhere.

TECHNICAL REQUIREMENTS
- Complete <!DOCTYPE html> document with semantic HTML.
- One <style> block with reusable component classes.
- One small <script> block for form interaction only.
- Use Google Fonts for Inter or Manrope with strong weights.
- Total HTML should be efficient and stable for preview, ideally under 70KB.
- Vanilla JavaScript only. No dependencies.
- Responsive from 360px mobile to desktop.
- Use accessible labels, focus-visible states, reduced-motion support, and no console logs.

DESIGN SYSTEM
- Font: Inter or Manrope, never Arial.
- Background: premium near-white base with layered radial gradients and subtle grid/noise effect using CSS only.
- Containers: max-width 1180-1240px, generous padding, modern grid system.
- Cards: 20px-32px radius, 1px soft borders, subtle shadows, hover lift, glass-light surfaces.
- Buttons: gradient primary button, elevated hover state, subtle icon arrow, focus glow.
- Inputs: grouped fields, floating-label or label-over-field pattern, icon chip or prefix, 14px+ padding, rounded 16px-20px, soft shadow, focus glow.
- Hero: left/right split layout with badge, large headline, premium CTA block, proof row, trust indicators, dashboard mockup, floating metric cards, layered gradients.
- Footer: modern multi-column footer with product links, company links, resources, social text links, newsletter CTA, and premium spacing.

PREMIUM EMBEDDED TOOL CARD CONTRACT
The outer landing page can follow the required architecture, but the MAIN quality priority is the embedded tool inside .tool-card.
This .tool-card must visually match the premium page around it and feel like a mini SaaS product, not a pasted form.

Required class/component architecture inside the interactive tool section:
- tool-card: glass-light premium container with 24px-36px radius, layered surfaces, soft border, shadow, and subtle gradient.
- tool-header: AI-powered header with badge, title, positioning statement, and trust indicators.
- tool-ai-badge: premium badge showing AI/business intelligence positioning.
- tool-progress: small visual progress or readiness bar above the form/report flow.
- tool-form-grid: responsive grouped form layout.
- tool-field-card: each input/select must live inside a premium field card.
- tool-icon-chip: small CSS-only icon/pictogram chip beside field labels.
- tool-select-wrap: custom styled select wrapper with premium arrow treatment.
- tool-primary-button: strong gradient CTA with hover lift/glow and loading-ready styling.
- tool-result-dashboard: hidden premium AI report layout revealed after submit.
- tool-score-card or tool-score-ring: visual opportunity score indicator.
- tool-insight-card: strategic insight cards.
- tool-recommendation-card: action recommendation cards.
- tool-monetization-card: monetization path card.

Embedded tool UI requirements:
- The tool form must NOT look like browser-default inputs/selects. Use custom CSS classes, rounded fields, focus glow, hover transitions, and grouped labels.
- Selects must be wrapped and styled; no plain browser-default select presentation.
- Results must be an AI insight dashboard with score, traffic insight, conversion opportunity, monetization recommendation, and next-step strategy blocks.
- Use visual hierarchy inside the tool: header, progress/trust row, grouped inputs, premium CTA, report dashboard.
- Remove any basic local footer inside the tool area. Only the page-level footer may exist, and it must be premium.
- On mobile, tool-card spacing, fields, CTA, and result cards must stack cleanly without cramped layout.

REQUIRED PAGE ARCHITECTURE
1. Sticky/light top nav with brand, short links, and CTA.
2. Split hero section: copy on the left, dashboard/product mockup on the right.
3. Trust bar with proof points or customer outcomes.
4. Interactive business asset section centered around the premium .tool-card system above, using every field from blueprint.inputs_required.
5. Hidden .tool-result-dashboard that reveals a strategic opportunity report with score, insights, prioritized actions, monetization path, and traffic recommendations.
6. Metrics dashboard with 3-4 KPI cards.
7. Benefits grid using blueprint.features.
8. Process timeline showing how the visitor gets value.
9. Monetization roadmap section using blueprint.monetization_roadmap if available.
10. Authority/EEAT section using blueprint.eeat_structure, authority_positioning, and competitor_advantage.
11. Testimonials or outcome cards.
12. FAQ section using modern disclosure/cards.
13. Premium final CTA section.
14. Multi-column footer with newsletter signup.

COPYWRITING REQUIREMENTS
- Position this as a business opportunity asset, growth engine, revenue system, traffic strategy, lead magnet, monetization roadmap, authority asset, or SEO opportunity system.
- Avoid generic calculator positioning unless the blueprint explicitly requires it.
- Make the visitor feel: "This tool alone is worth paying for."
- Use concrete business outcomes, not vague marketing filler.

FUNCTIONAL REQUIREMENTS
- Render every input in blueprint.inputs_required.
- Prevent page reload on submit.
- Validate required inputs.
- Reveal the result panel with smooth scroll.
- Results must feel like a premium report: opportunity score, 3 strategic insights, 3 next actions, monetization path, traffic strategy, and authority recommendation.
- Use stable IDs and classes. No undefined variables. No TODO comments.
- The submit interaction must update the premium tool-result-dashboard, not insert plain text into a generic card.

BLUEPRINT
${JSON.stringify(blueprint, null, 2)}

Generate the complete premium HTML document now:`;

  // Build icon array for form inputs
  const iconOptions = ['sun', 'dollar-sign', 'wifi', 'globe', 'calendar', 'users', 'map-marker-alt', 'clock', 'percent', 'calculator', 'chart-line', 'database'];
  
  // Build inputs HTML from blueprint
  const inputsHTML = Array.isArray(blueprint.inputs_required) && blueprint.inputs_required.length > 0
    ? blueprint.inputs_required.map((input: any, idx: number) => {
        const fieldName = typeof input === 'string' ? input : (input.name || input.label || `Input ${idx + 1}`);
        const fieldType = typeof input === 'object' && input.type === 'select' ? 'select' : 'text';
        const icon = iconOptions[idx % iconOptions.length];
        const placeholder = `e.g., ${fieldType === 'select' ? 'Select' : fieldName === 'Monthly budget (USD)' || fieldName.toLowerCase().includes('budget') ? '1800' : fieldName.toLowerCase().includes('internet') || fieldName.toLowerCase().includes('speed') ? '50' : 'Enter value'}`;
        
        if (fieldType === 'select') {
          return `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <label style="font-weight:600; font-size:14px; letter-spacing:-0.2px; color:#2C3A58; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-${icon}" style="color:#6E57E0; width:18px;"></i> ${fieldName}
          </label>
          <select id="input${idx}" style="background:#F9FAFE; border:1.5px solid #E9EDF4; border-radius:24px; padding:14px 20px; font-family:'Inter',sans-serif; font-size:15px; transition:0.2s; outline:none; color:#13182A; width:100%; cursor:pointer; appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path fill=%22%236E57E0%22 d=%22M0 0l6 8 6-8z%22/></svg>'); background-repeat:no-repeat; background-position:calc(100% - 16px) center;" onfocus="this.style.borderColor='#6E57E0'; this.style.boxShadow='0 0 0 3px rgba(110,87,224,0.15)'; this.style.background='white'" onblur="this.style.borderColor='#E9EDF4'; this.style.boxShadow='none'; this.style.background='#F9FAFE'">
            <option value="">Select</option>
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>`;
        }
        
        return `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <label style="font-weight:600; font-size:14px; letter-spacing:-0.2px; color:#2C3A58; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-${icon}" style="color:#6E57E0; width:18px;"></i> ${fieldName}
          </label>
          <input type="text" id="input${idx}" placeholder="${placeholder}" style="background:#F9FAFE; border:1.5px solid #E9EDF4; border-radius:24px; padding:14px 20px; font-family:'Inter',sans-serif; font-size:15px; transition:0.2s; outline:none; color:#13182A; width:100%;" onfocus="this.style.borderColor='#6E57E0'; this.style.boxShadow='0 0 0 3px rgba(110,87,224,0.15)'; this.style.background='white'" onblur="this.style.borderColor='#E9EDF4'; this.style.boxShadow='none'; this.style.background='#F9FAFE'" required>
        </div>`;
      }).join('\n')
    : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <label style="font-weight:600; font-size:14px; letter-spacing:-0.2px; color:#2C3A58; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-calculator" style="color:#6E57E0; width:18px;"></i> Input Value
          </label>
          <input type="text" id="input0" placeholder="e.g., 100" style="background:#F9FAFE; border:1.5px solid #E9EDF4; border-radius:24px; padding:14px 20px; font-family:'Inter',sans-serif; font-size:15px; transition:0.2s; outline:none; color:#13182A; width:100%;" onfocus="this.style.borderColor='#6E57E0'; this.style.boxShadow='0 0 0 3px rgba(110,87,224,0.15)'; this.style.background='white'" onblur="this.style.borderColor='#E9EDF4'; this.style.boxShadow='none'; this.style.background='#F9FAFE'" required>
        </div>`;

  // Build benefits HTML from blueprint features
  const benefitsHTML = Array.isArray(blueprint.features) && blueprint.features.length > 0
    ? blueprint.features.slice(0, 6).map((feature: any, idx: number) => {
        const icons = ['bolt', 'chart-line', 'shield-alt', 'clock', 'users', 'check-circle'];
        const text = typeof feature === 'string' ? feature : (feature.title || feature.name || `Benefit ${idx + 1}`);
        const desc = typeof feature === 'object' && feature.description ? feature.description : 'Powerful feature to help you succeed';
        return `
      <div style="background:#FFFFFF; border-radius:28px; padding:24px 28px; display:flex; gap:20px; align-items:flex-start; border:1px solid #F0F2F9; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
        <div style="width:52px; height:52px; background:linear-gradient(135deg, #F5F3FF, #FFFFFF); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:24px; color:#6E57E0; border:1px solid #E8E5FF; flex-shrink:0;">
          <i class="fas fa-${icons[idx % icons.length]}"></i>
        </div>
        <div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:8px; color:#1A1E2B;">${text}</h3>
          <p style="font-size:15px; color:#64748B; line-height:1.6;">${desc}</p>
        </div>
      </div>`;
      }).join('\n')
    : `
      <div style="background:#FFFFFF; border-radius:28px; padding:24px 28px; display:flex; gap:20px; align-items:flex-start; border:1px solid #F0F2F9;">
        <div style="width:52px; height:52px; background:linear-gradient(135deg, #F5F3FF, #FFFFFF); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:24px; color:#6E57E0; border:1px solid #E8E5FF; flex-shrink:0;">
          <i class="fas fa-check"></i>
        </div>
        <div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:8px; color:#1A1E2B;">Fast & Accurate</h3>
          <p style="font-size:15px; color:#64748B; line-height:1.6;">Get instant, reliable results every time</p>
        </div>
      </div>`;

  return `You are an expert landing page designer. Create a CLEAN, PROFESSIONAL landing page HTML document matching the NOMADIC style EXACTLY.


CRITICAL: Output ONLY the complete HTML document. No markdown code fences, no explanations.

TOOL DETAILS:
- Title: ${blueprint.title}
- Description: ${blueprint.description || blueprint.purpose}
- Purpose: ${blueprint.purpose}
- Category: ${blueprint.category || 'Calculator'}
- Keywords: ${Array.isArray(blueprint.target_keywords) ? blueprint.target_keywords.join(', ') : ''}

Generate the complete HTML now:

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${blueprint.seo_title || blueprint.title}</title>
  <meta name="description" content="${blueprint.seo_description || blueprint.description}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1A1E2B;
      scroll-behavior: smooth;
      overflow-x: hidden;
    }
    .page-container { max-width: 1280px; margin: 0 auto; padding: 0 32px; }
    
    /* Hero */
    .hero-premium {
      position: relative;
      padding: 140px 0 100px;
      background: radial-gradient(ellipse at 80% 30%, rgba(110, 87, 224, 0.05), transparent 60%);
      overflow: hidden;
    }
    .hero-premium::before {
      content: "";
      position: absolute;
      top: -20%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(110, 87, 224, 0.2) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .hero-inner { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; text-align: center; }
    .badge-premium {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(110, 87, 224, 0.12);
      backdrop-filter: blur(2px);
      padding: 8px 20px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
      color: #4F46E5;
      margin-bottom: 28px;
      border: 1px solid rgba(110, 87, 224, 0.25);
    }
    .hero-premium h1 {
      font-size: clamp(44px, 7vw, 78px);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #1A1E2B;
      margin-bottom: 24px;
    }
    .gradient-glow {
      background: linear-gradient(135deg, #6E57E0, #A78BFA);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .hero-description {
      font-size: 18px;
      line-height: 1.6;
      color: #4B5565;
      max-width: 700px;
      margin: 0 auto 36px;
    }
    .trust-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 32px;
      margin-top: 32px;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4B5565;
      font-size: 14px;
      font-weight: 500;
    }
    .trust-item i { color: #6E57E0; font-size: 18px; }
    .btn-group { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin: 32px 0 20px; }
    .btn-primary-premium {
      background: linear-gradient(105deg, #5B48E0, #8A6EFF);
      padding: 14px 34px;
      border-radius: 44px;
      font-weight: 600;
      font-size: 16px;
      border: none;
      color: white;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
      box-shadow: 0 12px 28px -8px rgba(94, 76, 225, 0.35);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .btn-primary-premium:hover {
      transform: translateY(-3px);
      box-shadow: 0 20px 32px -12px rgba(94, 76, 225, 0.5);
      background: linear-gradient(105deg, #4A3AD0, #7E5CFF);
    }
    .btn-outline-premium {
      background: transparent;
      border: 1.5px solid #D9DFF0;
      padding: 14px 34px;
      border-radius: 44px;
      font-weight: 600;
      font-size: 16px;
      color: #1A1E2B;
      cursor: pointer;
      transition: all 0.25s;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .btn-outline-premium:hover {
      border-color: #6E57E0;
      background: rgba(110, 87, 224, 0.04);
    }
    
    /* Tool Card */
    .tool-card-premium {
      background: #FFFFFF;
      border-radius: 48px;
      box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.02);
      padding: 48px 44px;
      margin: 40px 0 60px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .input-group { display: flex; flex-direction: column; gap: 10px; }
    .input-group label {
      font-weight: 600;
      font-size: 14px;
      letter-spacing: -0.2px;
      color: #2C3A58;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .input-group label i { color: #6E57E0; width: 18px; }
    select, input {
      background: #F9FAFE;
      border: 1.5px solid #E9EDF4;
      border-radius: 24px;
      padding: 14px 20px;
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      transition: 0.2s;
      outline: none;
      color: #13182A;
      width: 100%;
    }
    select:focus, input:focus {
      border-color: #6E57E0;
      box-shadow: 0 0 0 3px rgba(110, 87, 224, 0.15);
      background: white;
    }
    .btn-find {
      background: #1A1E2B;
      color: white;
      width: 100%;
      padding: 16px;
      border-radius: 56px;
      border: none;
      font-weight: 700;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.25s;
      margin-top: 16px;
    }
    .btn-find:hover {
      background: #2D2A5E;
      transform: scale(0.99);
      box-shadow: 0 12px 16px -10px rgba(0,0,0,0.2);
    }
    .results-premium {
      margin-top: 44px;
      background: #F8F9FF;
      border-radius: 32px;
      padding: 28px 32px;
      border-left: 5px solid #6E57E0;
    }
    
    /* Steps */
    .steps-grid-premium {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
      margin: 48px 0;
    }
    .step-premium {
      background: white;
      border-radius: 32px;
      padding: 32px;
      box-shadow: 0 15px 30px -12px rgba(0,0,0,0.05);
      transition: all 0.25s;
      border: 1px solid rgba(0,0,0,0.03);
    }
    .step-premium:hover {
      transform: translateY(-6px);
      border-color: #DDD9FF;
      box-shadow: 0 25px 35px -15px rgba(110, 87, 224, 0.2);
    }
    .step-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(145deg, #F1EFFE, #FFFFFF);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #6E57E0;
      margin-bottom: 28px;
      border: 1px solid #EBE9FE;
    }
    
    /* Benefits */
    .benefits-grid-premium {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 28px;
      margin: 48px 0;
    }
    .benefit-premium {
      background: #FFFFFF;
      border-radius: 28px;
      padding: 24px 28px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
      border: 1px solid #F0F2F9;
    }
    .benefit-icon-premium {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #F5F3FF, #FFFFFF);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #6E57E0;
      border: 1px solid #E8E5FF;
      flex-shrink: 0;
    }
    
    /* FAQ */
    .faq-container-premium { margin: 48px auto 20px; max-width: 880px; }
    .faq-premium {
      background: #FFFFFF;
      border-radius: 24px;
      border: 1px solid #EDF0F8;
      margin-bottom: 18px;
    }
    .faq-premium summary {
      padding: 24px 32px;
      font-weight: 700;
      font-size: 18px;
      cursor: pointer;
      list-style: none;
      color: #111827;
    }
    .faq-premium summary::-webkit-details-marker { display: none; }
    .faq-premium summary::after {
      content: "\f067";
      font-family: "Font Awesome 6 Free";
      font-weight: 900;
      font-size: 18px;
      color: #6E57E0;
      float: right;
    }
    .faq-premium[open] summary::after { content: "\f068"; }
    .faq-answer-premium {
      padding: 4px 32px 28px 32px;
      color: #4B5565;
      line-height: 1.65;
      border-top: 1px solid #F0F3FC;
      margin-top: 6px;
    }
    
    /* CTA */
    .cta-luxe {
      background: linear-gradient(125deg, #121826 0%, #1C2136 100%);
      border-radius: 56px;
      margin: 80px auto;
      padding: 64px 48px;
      text-align: center;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .cta-luxe h3 {
      font-size: 38px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 18px;
    }
    .cta-luxe p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 36px;
    }
    
    /* Footer */
    footer {
      text-align: center;
      padding: 48px 0 32px;
      color: #6c6f78;
      font-size: 14px;
      border-top: 1px solid #EDF2F7;
    }
    
    /* Mobile */
    @media (max-width: 760px) {
      .page-container { padding: 0 20px; }
      .tool-card-premium { padding: 28px 20px; }
      .cta-luxe { padding: 48px 24px; border-radius: 32px; }
      .hero-premium { padding: 80px 0 60px; }
      .form-grid { grid-template-columns: 1fr; }
      .benefits-grid-premium { grid-template-columns: 1fr; }
      .steps-grid-premium { grid-template-columns: 1fr; }
      .btn-group { flex-direction: column; width: 100%; }
      .btn-primary-premium, .btn-outline-premium { width: 100%; justify-content: center; }
    }
    
    i, .fas, .far { pointer-events: none; }
  </style>
</head>
<body>

<!-- 1. HERO SECTION -->
<section class="hero-premium">
  <div class="page-container hero-inner">
    <div class="badge-premium">
      <i class="fas fa-bolt"></i> ${blueprint.tool_type || 'Instant Results'}
    </div>
    <h1>${blueprint.title.replace(/\b(\w+)\b(?!.*\b\1\b)/, '<span class="gradient-glow">$1</span>')}</h1>
    <p class="hero-description">${blueprint.purpose}</p>
    <div class="btn-group">
      <a href="#matcher-tool" class="btn-primary-premium"><i class="fas fa-calculator"></i> ${blueprint.cta_text || 'Get Started Free'}</a>
      <a href="#how-it-works" class="btn-outline-premium"><i class="fas fa-play-circle"></i> See how it works</a>
    </div>
    <div class="trust-group">
      <div class="trust-item"><i class="fas fa-chart-line"></i> Real-time data</div>
      <div class="trust-item"><i class="fas fa-shield-alt"></i> No sign-up</div>
      <div class="trust-item"><i class="fas fa-bolt"></i> Instant results</div>
    </div>
  </div>
</section>

<!-- 2. TOOL SECTION -->
<div class="page-container" id="matcher-tool">
  <div class="tool-card-premium">
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="font-size: 32px; font-weight: 700;">${blueprint.title}</h2>
      <p style="color:#5b677b;">${blueprint.description}</p>
    </div>
    <form id="calculatorForm" onsubmit="event.preventDefault(); calculate();">
      <div class="form-grid">
        ${inputsHTML}
      </div>
      <button type="submit" class="btn-find">
        <i class="fas fa-rocket"></i> ${blueprint.cta_text || 'Calculate Now'}
      </button>
    </form>
    <div id="results" style="display: none;" class="results-premium">
      <!-- Results populated by JavaScript -->
    </div>
  </div>
</div>

<!-- 3. HOW IT WORKS -->
<section id="how-it-works">
  <div class="page-container" style="margin-top: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background: #F1EFFE; padding: 8px 22px; border-radius: 100px; font-size: 14px; font-weight: 600;">3‑step flow</span>
      <h2 style="font-size: 36px; font-weight: 700; margin-top: 24px;">How It Works</h2>
    </div>
    <div class="steps-grid-premium">
      <div class="step-premium">
        <div class="step-icon"><i class="fas fa-sliders-h"></i></div>
        <h3>1. Enter Your Data</h3>
        <p>Input your values into the form fields above</p>
      </div>
      <div class="step-premium">
        <div class="step-icon"><i class="fas fa-chart-line"></i></div>
        <h3>2. Get Instant Results</h3>
        <p>Our algorithm calculates your personalized results</p>
      </div>
      <div class="step-premium">
        <div class="step-icon"><i class="fas fa-rocket"></i></div>
        <h3>3. Take Action</h3>
        <p>Use the insights to make informed decisions</p>
      </div>
    </div>
  </div>
</section>

<!-- 4. BENEFITS -->
<section class="benefits-section">
  <div class="page-container">
    <div style="text-align: center; margin: 40px 0 20px;">
      <h2 style="font-size: 36px; font-weight: 700;">Key Benefits</h2>
      <p style="color:#4C5A73;">Everything you need in one powerful tool</p>
    </div>
    <div class="benefits-grid-premium">
      <!-- Generate from blueprint.features -->
    </div>
  </div>
</section>

<!-- 5. FAQ -->
<section class="faq-section">
  <div class="page-container">
    <div style="text-align: center; margin-bottom: 40px;">
      <h2 style="font-size: 34px;">Frequently Asked Questions</h2>
      <p>Common questions about this tool</p>
    </div>
    <div class="faq-container-premium">
      <!-- Generate 5-7 FAQ items -->
    </div>
  </div>
</section>

<!-- 6. FINAL CTA -->
<div class="page-container">
  <div class="cta-luxe">
    <h3>${blueprint.cta_text || 'Ready to Get Started?'}</h3>
    <p>Join thousands using this tool every day</p>
    <a href="#matcher-tool" class="btn-primary-premium" style="margin-top: 12px;">
      Get Started Now <i class="fas fa-arrow-right"></i>
    </a>
    <p style="font-size: 12px; margin-top: 28px; opacity: 0.6;">No sign-up required • 100% free</p>
  </div>
</div>

<!-- 7. FOOTER -->
<footer class="page-container">
  <p>© 2025 ${blueprint.title} — ${blueprint.description}</p>
</footer>

<!-- 8. JAVASCRIPT -->
<script>
  function calculate() {
    // Implement calculation logic from blueprint.calculation_logic
    const resultsDiv = document.getElementById('results');
    // Perform calculations and display results
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if(href && href !== "#" && href !== "") {
        const target = document.querySelector(href);
        if(target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
</script>
</body>
</html>

CRITICAL IMPLEMENTATION INSTRUCTIONS:
1. Use blueprint.inputs_required to generate form inputs with proper labels and icons
2. Implement blueprint.calculation_logic in the calculate() function
3. Generate 4-6 benefit cards from blueprint.features array
4. Use blueprint.target_keywords naturally in content
5. Create 5-7 FAQ items relevant to the tool
6. Make sure all Font Awesome icons use proper class names (fas fa-icon-name)
7. Output ONLY the complete HTML (no markdown fences, no explanations)

Generate the complete landing page now:

═══════════════════════════════════════════════════════════
🏗️ SECTION-BY-SECTION STRUCTURE
═══════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 🚀 HERO SECTION — CLEAN & CENTERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section class="hero-premium" style="position:relative; padding:140px 0 100px; background:radial-gradient(ellipse at 80% 30%, rgba(110,87,224,0.05), transparent 60%); overflow:hidden;">
  
  <!-- Subtle gradient orbs (minimal, not overwhelming) -->
  <div style="position:absolute; top:-20%; right:-10%; width:600px; height:600px; background:radial-gradient(circle, rgba(110,87,224,0.2) 0%, transparent 70%); border-radius:50%; pointer-events:none;"></div>
  <div style="position:absolute; bottom:-15%; left:-8%; width:500px; height:500px; background:radial-gradient(circle, rgba(0,209,255,0.08) 0%, transparent 70%); pointer-events:none;"></div>
  
  <div style="position:relative; z-index:2; max-width:900px; margin:0 auto; text-align:center; padding:0 32px;">
    
    <!-- Badge (optional) -->
    <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(110,87,224,0.12); backdrop-filter:blur(2px); padding:8px 20px; border-radius:100px; font-size:14px; font-weight:600; color:#4F46E5; margin-bottom:28px; letter-spacing:-0.2px; border:1px solid rgba(110,87,224,0.25);">
      <i class="fas fa-sparkles"></i> [Badge text — e.g., "AI-Powered Tool"]
    </div>
    
    <!-- Hero headline with gradient accent -->
    <h1 style="font-size:clamp(44px,7vw,78px); font-weight:800; line-height:1.1; letter-spacing:-0.03em; color:#1A1E2B; margin-bottom:24px;">
      [Main headline] <span style="background:linear-gradient(135deg, #6E57E0, #A78BFA); -webkit-background-clip:text; background-clip:text; color:transparent;">[gradient accent word]</span>
    </h1>
    
    <!-- Description -->
    <p style="font-size:18px; line-height:1.6; color:#4B5565; max-width:700px; margin:0 auto 36px;">
      [Compelling description of what the tool does and the value it provides]
    </p>
    
    <!-- Button group -->
    <div style="display:flex; flex-wrap:wrap; gap:18px; justify-content:center; margin:32px 0 20px;">
      <a href="#tool-section" style="background:linear-gradient(105deg, #5B48E0, #8A6EFF); padding:14px 34px; border-radius:44px; font-weight:600; font-size:16px; border:none; color:white; cursor:pointer; transition:all 0.3s cubic-bezier(0.2,0.9,0.4,1.1); box-shadow:0 12px 28px -8px rgba(94,76,225,0.35); display:inline-flex; align-items:center; gap:10px; text-decoration:none;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 20px 32px -12px rgba(94,76,225,0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 12px 28px -8px rgba(94,76,225,0.35)'">
        <i class="fas fa-rocket"></i> [Primary CTA — e.g., "Try the calculator"]
      </a>
      <a href="#how-it-works" style="background:transparent; border:1.5px solid #D9DFF0; padding:14px 34px; border-radius:44px; font-weight:600; font-size:16px; color:#1A1E2B; cursor:pointer; transition:all 0.25s; display:inline-flex; align-items:center; gap:10px; text-decoration:none;" onmouseover="this.style.borderColor='#6E57E0'; this.style.background='rgba(110,87,224,0.04)'" onmouseout="this.style.borderColor='#D9DFF0'; this.style.background='transparent'">
        <i class="fas fa-play-circle"></i> [Secondary CTA — e.g., "How it works"]
      </a>
    </div>
    
    <!-- Trust indicators -->
    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:32px; margin-top:32px;">
      <div style="display:flex; align-items:center; gap:8px; color:#4B5565; font-size:14px; font-weight:500;">
        <i class="fas fa-check-circle" style="color:#6E57E0; font-size:18px;"></i> [Trust point 1]
      </div>
      <div style="display:flex; align-items:center; gap:8px; color:#4B5565; font-size:14px; font-weight:500;">
        <i class="fas fa-bolt" style="color:#6E57E0; font-size:18px;"></i> [Trust point 2]
      </div>
      <div style="display:flex; align-items:center; gap:8px; color:#4B5565; font-size:14px; font-weight:500;">
        <i class="fas fa-shield-alt" style="color:#6E57E0; font-size:18px;"></i> [Trust point 3]
      </div>
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. 🧮 TOOL SECTION — CLEAN WHITE CARD (NOMADIC STYLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<div style="max-width:1280px; margin:0 auto; padding:0 32px;" id="tool-section">
  <div style="background:#FFFFFF; border-radius:48px; box-shadow:0 25px 45px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02); padding:48px 44px; margin:40px 0 60px;">
    
    <!-- Tool header -->
    <div style="text-align:center; margin-bottom:40px;">
      <h2 style="font-size:32px; font-weight:700; color:#1A1E2B; margin-bottom:8px;">${blueprint.title}</h2>
      <p style="color:#5b677b; font-size:16px;">${blueprint.description || blueprint.purpose}</p>
    </div>
    
    <!-- Form inputs -->
    <form id="calculatorForm" onsubmit="event.preventDefault(); calculate();">
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:24px; margin-bottom:32px;">
        ${inputsHTML}
      </div>
      
      <!-- Calculate button -->
      <button type="submit" style="background:#1A1E2B; color:white; width:100%; padding:18px; border-radius:56px; border:none; font-weight:700; font-size:18px; display:flex; align-items:center; justify-content:center; gap:12px; cursor:pointer; transition:all 0.25s; margin-top:8px; font-family:'Inter',sans-serif;" onmouseover="this.style.background='#2D2A5E'; this.style.transform='scale(0.99)'" onmouseout="this.style.background='#1A1E2B'; this.style.transform='scale(1)'">
        <i class="fas fa-rocket"></i> ${blueprint.cta_text || 'Calculate Now'}
      </button>
    </form>
    
    <!-- Results area (hidden by default) -->
    <div id="results" style="display:none; margin-top:44px; background:#F8F9FF; border-radius:32px; padding:28px 32px; border-left:5px solid #6E57E0;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:20px;">
        <h3 style="font-weight:700; font-size:22px; color:#1A1E2B; display:flex; align-items:center; gap:10px;">
          <i class="fas fa-check-circle" style="color:#6E57E0;"></i> Your Results
        </h3>
      </div>
      <div id="resultsContent" style="font-size:16px; color:#374151; line-height:1.7;">
        <!-- Results will be injected here by JavaScript -->
      </div>
    </div>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. 📊 HOW IT WORKS — STEP CARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section id="how-it-works" style="padding:80px 0 60px;">
  <div style="max-width:1280px; margin:0 auto; padding:0 32px;">
    
    <div style="text-align:center; margin-bottom:48px;">
      <span style="background:#F1EFFE; padding:8px 22px; border-radius:100px; font-size:14px; font-weight:600; color:#6E57E0;">Simple Process</span>
      <h2 style="font-size:36px; font-weight:700; margin-top:24px; color:#1A1E2B;">How It Works</h2>
      <p style="color:#4B5565; margin-top:12px; font-size:16px;">Get results in 3 easy steps</p>
    </div>
    
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:32px;">
      
      <!-- Step 1 -->
      <div style="background:white; border-radius:32px; padding:32px; box-shadow:0 15px 30px -12px rgba(0,0,0,0.05); transition:all 0.25s; border:1px solid rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.borderColor='#DDD9FF'; this.style.boxShadow='0 25px 35px -15px rgba(110,87,224,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(0,0,0,0.03)'; this.style.boxShadow='0 15px 30px -12px rgba(0,0,0,0.05)'">
        <div style="width:60px; height:60px; background:linear-gradient(145deg, #F1EFFE, #FFFFFF); border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:#6E57E0; margin-bottom:28px; border:1px solid #EBE9FE;">
          1
        </div>
        <h3 style="font-size:20px; font-weight:700; margin-bottom:12px; color:#1A1E2B;">[Step 1 Title]</h3>
        <p style="font-size:15px; color:#64748B; line-height:1.6;">[Step 1 description]</p>
      </div>
      
      <!-- Step 2 -->
      <div style="background:white; border-radius:32px; padding:32px; box-shadow:0 15px 30px -12px rgba(0,0,0,0.05); transition:all 0.25s; border:1px solid rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.borderColor='#DDD9FF'; this.style.boxShadow='0 25px 35px -15px rgba(110,87,224,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(0,0,0,0.03)'; this.style.boxShadow='0 15px 30px -12px rgba(0,0,0,0.05)'">
        <div style="width:60px; height:60px; background:linear-gradient(145deg, #F1EFFE, #FFFFFF); border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:#6E57E0; margin-bottom:28px; border:1px solid #EBE9FE;">
          2
        </div>
        <h3 style="font-size:20px; font-weight:700; margin-bottom:12px; color:#1A1E2B;">[Step 2 Title]</h3>
        <p style="font-size:15px; color:#64748B; line-height:1.6;">[Step 2 description]</p>
      </div>
      
      <!-- Step 3 -->
      <div style="background:white; border-radius:32px; padding:32px; box-shadow:0 15px 30px -12px rgba(0,0,0,0.05); transition:all 0.25s; border:1px solid rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.borderColor='#DDD9FF'; this.style.boxShadow='0 25px 35px -15px rgba(110,87,224,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(0,0,0,0.03)'; this.style.boxShadow='0 15px 30px -12px rgba(0,0,0,0.05)'">
        <div style="width:60px; height:60px; background:linear-gradient(145deg, #F1EFFE, #FFFFFF); border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:#6E57E0; margin-bottom:28px; border:1px solid #EBE9FE;">
          3
        </div>
        <h3 style="font-size:20px; font-weight:700; margin-bottom:12px; color:#1A1E2B;">[Step 3 Title]</h3>
        <p style="font-size:15px; color:#64748B; line-height:1.6;">[Step 3 description]</p>
      </div>
      
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. 💎 BENEFITS — ICON CARDS GRID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section style="padding:80px 0 60px;">
  <div style="max-width:1280px; margin:0 auto; padding:0 32px;">
    
    <div style="text-align:center; margin-bottom:48px;">
      <h2 style="font-size:36px; font-weight:700; color:#1A1E2B; margin-bottom:12px;">Key Benefits</h2>
      <p style="color:#4B5565; font-size:16px;">Why users love this tool</p>
    </div>
    
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:28px;">
      
      <!-- Benefit 1 -->
      <div style="background:#FFFFFF; border-radius:28px; padding:24px 28px; display:flex; gap:20px; align-items:flex-start; border:1px solid #F0F2F9; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
        <div style="width:52px; height:52px; background:linear-gradient(135deg, #F5F3FF, #FFFFFF); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:24px; color:#6E57E0; border:1px solid #E8E5FF; flex-shrink:0;">
          <i class="fas fa-bolt"></i>
        </div>
        <div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:8px; color:#1A1E2B;">[Benefit 1 Title]</h3>
          <p style="font-size:15px; color:#64748B; line-height:1.6;">[Benefit 1 description]</p>
        </div>
      </div>
      
      <!-- Repeat for 4-6 benefits with different Font Awesome icons -->
      
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ❓ FAQ — CLEAN ACCORDION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section style="padding:80px 0 60px;">
  <div style="max-width:1280px; margin:0 auto; padding:0 32px;">
    
    <div style="text-align:center; margin-bottom:48px;">
      <h2 style="font-size:34px; font-weight:700; color:#1A1E2B; margin-bottom:12px;">Frequently Asked Questions</h2>
      <p style="color:#4B5565; font-size:16px;">Everything you need to know</p>
    </div>
    
    <div style="max-width:880px; margin:0 auto;">
      
      <!-- FAQ Item 1 -->
      <details style="background:#FFFFFF; border-radius:24px; border:1px solid #EDF0F8; margin-bottom:18px; transition:all 0.2s;">
        <summary style="padding:24px 32px; font-weight:700; font-size:18px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; list-style:none; color:#111827;">
          [Question 1]
          <i class="fas fa-plus" style="color:#6E57E0; font-size:18px; transition:transform 0.25s;"></i>
        </summary>
        <div style="padding:4px 32px 28px 32px; color:#4B5565; line-height:1.65; border-top:1px solid #F0F3FC; margin-top:6px; font-size:15px;">
          [Answer 1 — detailed response to the question]
        </div>
      </details>
      
      <!-- Repeat for 5-7 FAQ items -->
      
    </div>
  </div>
</section>

<style>
  details[open] summary i.fa-plus::before {
    content: "\f068"; /* fa-minus */
  }
</style>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. 🎯 FINAL CTA — EMAIL CAPTURE (NOMADIC STYLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<div style="max-width:1280px; margin:0 auto; padding:0 32px;">
  <div style="background:#1E2330; border-radius:56px; margin:80px 0; padding:64px 48px; text-align:center; color:white; position:relative; overflow:hidden;">
    
    <h3 style="font-size:clamp(28px, 5vw, 42px); font-weight:700; letter-spacing:-0.02em; margin-bottom:18px; line-height:1.2;">${blueprint.cta_text || "Don't settle for random cities"}</h3>
    <p style="font-size:18px; color:rgba(255,255,255,0.85); margin-bottom:36px;">Get exclusive destination reports and remote work tips directly.</p>
    
    <form id="emailCaptureForm" onsubmit="event.preventDefault(); handleEmailSubmit();" style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap; align-items:center; max-width:560px; margin:0 auto;">
      <input 
        type="email" 
        placeholder="Work email address" 
        required
        style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.2); padding:16px 28px; border-radius:56px; flex:1; min-width:260px; color:white; font-family:'Inter',sans-serif; font-size:15px; outline:none; transition:0.2s;"
        onfocus="this.style.borderColor='rgba(255,255,255,0.4)'; this.style.background='rgba(255,255,255,0.12)'"
        onblur="this.style.borderColor='rgba(255,255,255,0.2)'; this.style.background='rgba(255,255,255,0.08)'"
      >
      <button type="submit" style="background:white; border:none; padding:16px 34px; border-radius:56px; font-weight:700; color:#1E2330; cursor:pointer; transition:0.2s; font-family:'Inter',sans-serif; font-size:16px; white-space:nowrap;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(255,255,255,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
        Notify me →
      </button>
    </form>
    
    <p style="font-size:13px; margin-top:24px; color:rgba(255,255,255,0.5);">No spam, only premium insights.</p>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. 📄 FOOTER — SIMPLE & CLEAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<footer style="text-align:center; padding:48px 32px 32px; color:#6c6f78; font-size:14px; border-top:1px solid #EDF2F7; max-width:1280px; margin:0 auto;">
  <p>© 2025 [Tool Name] — Professional calculations made simple</p>
</footer>

COMPLETE EXAMPLE TEMPLATE:
Copy this structure exactly, filling in blueprint-specific content.

<!-- Floating gradient orbs (background depth) -->
  <div style="position:absolute; top:0%; right:15%; width:600px; height:600px; background:radial-gradient(circle, rgba(124,58,237,0.25), transparent); filter:blur(80px); pointer-events:none;"></div>
  <div style="position:absolute; bottom:20%; left:10%; width:500px; height:500px; background:radial-gradient(circle, rgba(236,72,153,0.2), transparent); filter:blur(70px); pointer-events:none;"></div>
  <div style="position:absolute; top:40%; left:40%; width:400px; height:400px; background:radial-gradient(circle, rgba(99,102,241,0.15), transparent); filter:blur(60px); pointer-events:none;"></div>
  
  <!-- Content grid (LEFT content + RIGHT visual) -->
  <div style="max-width:1280px; margin:0 auto; width:100%; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; position:relative; z-index:1;">
    
    <!-- LEFT SIDE: Hero content -->
    <div>
      <!-- Small badge/label (optional) -->
      <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.08); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.12); padding:8px 16px; border-radius:100px; font-size:14px; color:rgba(255,255,255,0.9); margin-bottom:24px;">
        <span style="width:8px; height:8px; background:linear-gradient(135deg, #7C3AED, #EC4899); border-radius:50%; box-shadow:0 0 12px rgba(124,58,237,0.6);"></span>
        AI-Powered • Instant Results
      </div>
      
      <!-- Giant gradient headline -->
      <h1 style="font-size:clamp(72px,9vw,110px); font-weight:900; line-height:0.95; letter-spacing:-0.06em; margin-bottom:28px; background:linear-gradient(135deg, #FFFFFF, #E0E7FF, #C4B5FD); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
        [Powerful Headline]
      </h1>
      
      <!-- Supporting description -->
      <p style="font-size:20px; line-height:1.7; color:rgba(255,255,255,0.7); margin-bottom:48px; max-width:540px;">
        [Compelling description highlighting value proposition]
      </p>
      
      <!-- CTA button group -->
      <div style="display:flex; gap:16px; margin-bottom:48px; flex-wrap:wrap;">
        <button onclick="document.getElementById('tool-section').scrollIntoView({behavior:'smooth'})" style="background:linear-gradient(135deg, #7C3AED, #9333EA); color:white; padding:18px 40px; border:none; border-radius:16px; font-size:18px; font-weight:700; cursor:pointer; box-shadow:0 20px 60px rgba(124,58,237,0.4), 0 8px 24px rgba(124,58,237,0.25); transition:all 0.3s cubic-bezier(0.4,0,0.2,1);" onmouseover="this.style.transform='translateY(-3px) scale(1.02)'; this.style.boxShadow='0 30px 80px rgba(124,58,237,0.5), 0 12px 32px rgba(124,58,237,0.35)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 20px 60px rgba(124,58,237,0.4), 0 8px 24px rgba(124,58,237,0.25)';">
          Get Started Free →
        </button>
        <button style="background:rgba(255,255,255,0.08); backdrop-filter:blur(12px); border:2px solid rgba(255,255,255,0.15); color:white; padding:16px 38px; border-radius:16px; font-size:18px; font-weight:600; cursor:pointer; transition:all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.12)'; this.style.borderColor='rgba(255,255,255,0.25)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='rgba(255,255,255,0.15)'; this.style.transform='translateY(0)';">
          See How It Works
        </button>
      </div>
      
      <!-- Trust indicators -->
      <div style="display:flex; align-items:center; gap:32px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="color:#F97316; font-size:16px;">★★★★★</div>
          <span style="font-size:14px; color:rgba(255,255,255,0.6);">5.0 from 10,000+ users</span>
        </div>
        <div style="font-size:14px; color:rgba(255,255,255,0.6);">
          ⚡ Instant results • 🔒 100% secure
        </div>
      </div>
    </div>
    
    <!-- RIGHT SIDE: Floating glassmorphism preview card -->
    <div style="position:relative;">
      <!-- Glow effect behind card -->
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:120%; height:120%; background:radial-gradient(circle, rgba(124,58,237,0.3), transparent); filter:blur(60px); pointer-events:none;"></div>
      
      <!-- Main floating preview card -->
      <div style="position:relative; background:rgba(255,255,255,0.08); backdrop-filter:blur(24px) saturate(180%); border:1px solid rgba(255,255,255,0.12); border-radius:32px; padding:48px; box-shadow:0 30px 90px rgba(0,0,0,0.2), 0 10px 40px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1);">
        <!-- Mini calculator preview (simplified 2-3 inputs) -->
        <div style="margin-bottom:20px;">
          <div style="font-size:14px; font-weight:600; color:rgba(255,255,255,0.9); margin-bottom:8px;">Input 1</div>
          <input type="text" placeholder="Enter value..." style="width:100%; padding:12px 16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:15px; outline:none;">
        </div>
        <div style="margin-bottom:24px;">
          <div style="font-size:14px; font-weight:600; color:rgba(255,255,255,0.9); margin-bottom:8px;">Input 2</div>
          <input type="text" placeholder="Enter value..." style="width:100%; padding:12px 16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:15px; outline:none;">
        </div>
        <button style="width:100%; background:linear-gradient(135deg, #F97316, #FB923C); color:white; padding:14px; border:none; border-radius:12px; font-size:16px; font-weight:600; cursor:pointer; box-shadow:0 10px 30px rgba(249,115,22,0.3);">
          Calculate →
        </button>
        
        <!-- Decorative stats/metrics floating cards (optional) -->
        <div style="position:absolute; top:-20px; right:-20px; background:rgba(255,255,255,0.1); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.15); padding:16px 20px; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.15);">
          <div style="font-size:24px; font-weight:800; color:white; margin-bottom:4px;">98%</div>
          <div style="font-size:12px; color:rgba(255,255,255,0.7);">Accuracy</div>
        </div>
      </div>
    </div>
  </div>
</section>

MOBILE (@media max-width: 768px):
- Stack content vertically
- Hero headline: clamp(48px, 12vw, 72px)
- Preview card: margin-top: 64px
- Maintain floating orb effects (reduce size)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. 🧮 TOOL SECTION — PREMIUM FINTECH-GRADE CALCULATOR UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN MANDATE: The calculator MUST feel like a $50k SaaS application widget.
Think: Stripe Dashboard + Linear + Modern Fintech App + Premium AI Tool

VISUAL TARGETS:
✨ Glassmorphic floating panel with depth
✨ Premium fintech-style input fields
✨ Gradient buttons with glow and lift animations
✨ Rewarding animated results panel
✨ Luxury spacing and typography
✨ Interactive micro-animations
✨ App-quality polish (NOT basic HTML forms)

<section id="tool-section" style="padding:140px 20px; background:linear-gradient(to bottom, #0a0a0a, #1a1a1a); position:relative; overflow:hidden;">
  
  <!-- Premium background system -->
  <div style="position:absolute; inset:0; background:repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, transparent 1px), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, transparent 1px); background-size:50px 50px; opacity:0.6; pointer-events:none;"></div>
  
  <!-- Multiple floating gradient orbs for depth -->
  <div style="position:absolute; top:10%; left:50%; transform:translateX(-50%); width:600px; height:600px; background:radial-gradient(circle, rgba(124,58,237,0.2), transparent); filter:blur(100px); pointer-events:none; animation:pulse 8s ease-in-out infinite;"></div>
  <div style="position:absolute; bottom:15%; right:10%; width:450px; height:450px; background:radial-gradient(circle, rgba(236,72,153,0.15), transparent); filter:blur(90px); pointer-events:none; animation:pulse 10s ease-in-out infinite;"></div>
  
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.15); }
      50% { box-shadow: 0 0 30px rgba(124,58,237,0.5), 0 0 60px rgba(124,58,237,0.25); }
    }
  </style>
  
  <div style="max-width:900px; margin:0 auto; position:relative; z-index:1;">
    
    <!-- Section header with premium typography -->
    <div style="text-align:center; margin-bottom:80px;">
      <div style="display:inline-flex; align-items:center; gap:10px; background:rgba(255,255,255,0.06); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.1); padding:10px 24px; border-radius:100px; font-size:14px; color:rgba(255,255,255,0.85); margin-bottom:28px; box-shadow:0 4px 16px rgba(0,0,0,0.2);">
        <span style="width:8px; height:8px; background:linear-gradient(135deg, #10B981, #34D399); border-radius:50%; box-shadow:0 0 12px rgba(16,185,129,0.7);"></span>
        Powered by Advanced AI
      </div>
      
      <h2 style="font-size:clamp(48px,6vw,72px); font-weight:800; line-height:1; letter-spacing:-0.04em; margin-bottom:24px; background:linear-gradient(135deg, #FFFFFF, #E0E7FF, #C4B5FD); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
        Calculate Your [Result]
      </h2>
      <p style="font-size:20px; color:rgba(255,255,255,0.65); line-height:1.7; max-width:600px; margin:0 auto;">
        Get instant, accurate results powered by advanced calculations
      </p>
    </div>
    
    <!-- PREMIUM LUXURY CALCULATOR CARD (Stripe/Linear quality) -->
    <div style="position:relative;">
      
      <!-- Outer glow effect -->
      <div style="position:absolute; inset:-2px; background:linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2), rgba(99,102,241,0.25)); border-radius:34px; filter:blur(20px); opacity:0.6; pointer-events:none;"></div>
      
      <!-- Main calculator card with glassmorphism -->
      <div style="position:relative; background:rgba(15,15,15,0.6); backdrop-filter:blur(40px) saturate(180%); border:1px solid rgba(255,255,255,0.12); border-radius:32px; padding:64px; box-shadow:0 40px 120px rgba(0,0,0,0.5), 0 20px 60px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5); overflow:hidden;">
        
        <!-- Subtle gradient overlay -->
        <div style="position:absolute; top:0; left:0; right:0; height:200px; background:linear-gradient(to bottom, rgba(124,58,237,0.05), transparent); pointer-events:none;"></div>
        
        <!-- Form inputs (render ALL blueprint inputs) -->
        <form onsubmit="event.preventDefault(); calculate();" style="position:relative; z-index:1;">
          
          <!-- PREMIUM INPUT FIELD EXAMPLE (repeat for each blueprint input) -->
          <div style="margin-bottom:32px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:15px; font-weight:700; color:rgba(255,255,255,0.95); margin-bottom:12px; letter-spacing:0.3px; text-transform:uppercase; font-size:13px;">
              <span style="width:6px; height:6px; background:linear-gradient(135deg, #7C3AED, #EC4899); border-radius:50%;"></span>
              [Input Label]
            </label>
            <div style="position:relative;">
              <input 
                type="number" 
                id="input1" 
                placeholder="Enter value..."
                style="width:100%; padding:18px 24px; background:rgba(255,255,255,0.04); border:2px solid rgba(255,255,255,0.08); border-radius:16px; color:white; font-size:17px; font-weight:500; font-family:inherit; outline:none; transition:all 0.35s cubic-bezier(0.4,0,0.2,1); box-shadow:inset 0 2px 8px rgba(0,0,0,0.2);"
                onfocus="this.style.borderColor='rgba(124,58,237,0.6)'; this.style.background='rgba(255,255,255,0.08)'; this.style.boxShadow='0 0 0 4px rgba(124,58,237,0.15), inset 0 2px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(124,58,237,0.2)'; this.style.transform='translateY(-2px)';"
                onblur="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.background='rgba(255,255,255,0.04)'; this.style.boxShadow='inset 0 2px 8px rgba(0,0,0,0.2)'; this.style.transform='translateY(0)';"
              >
              <!-- Premium input decoration (floating icon or unit label - optional) -->
              <div style="position:absolute; right:20px; top:50%; transform:translateY(-50%); font-size:14px; color:rgba(255,255,255,0.4); font-weight:600; pointer-events:none;">
                <!-- Optional: unit like "$", "%", "kg", etc. -->
              </div>
            </div>
          </div>
          
          <!-- Repeat premium input for ALL blueprint inputs with same styling -->
          
          <!-- Divider with gradient (optional visual break) -->
          <div style="height:1px; background:linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin:40px 0;"></div>
          
          <!-- PREMIUM FINTECH CTA BUTTON (Stripe-quality) -->
          <button type="submit" style="position:relative; width:100%; background:linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%); color:white; padding:22px 32px; border:none; border-radius:16px; font-size:19px; font-weight:800; cursor:pointer; margin-top:8px; box-shadow:0 20px 60px rgba(249,115,22,0.45), 0 10px 30px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2); transition:all 0.35s cubic-bezier(0.4,0,0.2,1); font-family:inherit; letter-spacing:0.5px; text-transform:uppercase; font-size:16px; overflow:hidden;" onmouseover="this.style.transform='translateY(-3px) scale(1.01)'; this.style.boxShadow='0 30px 80px rgba(249,115,22,0.55), 0 15px 40px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'; this.querySelector('.btn-shine').style.left='100%';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 20px 60px rgba(249,115,22,0.45), 0 10px 30px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'; this.querySelector('.btn-shine').style.left='-100%';">
            <!-- Animated shine effect -->
            <span class="btn-shine" style="position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent); transform:skewX(-20deg); transition:left 0.6s ease;"></span>
            <span style="position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:10px;">
              Calculate Now
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
            </span>
          </button>
          
          <!-- Trust indicator below button -->
          <p style="text-align:center; font-size:13px; color:rgba(255,255,255,0.5); margin-top:16px; display:flex; align-items:center; justify-content:center; gap:16px;">
            <span>⚡ Instant Results</span>
            <span>•</span>
            <span>🔒 100% Secure</span>
            <span>•</span>
            <span>✓ Free Forever</span>
          </p>
        </form>
        
        <!-- PREMIUM ANIMATED RESULTS PANEL (Hidden initially, shows after calculation) -->
        <div id="results" style="display:none; margin-top:56px; padding:48px; background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.08)); border:2px solid rgba(16,185,129,0.3); border-radius:24px; backdrop-filter:blur(16px); box-shadow:0 20px 60px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.1); position:relative; overflow:hidden; animation:slideUp 0.5s ease-out;">
          
          <!-- Success glow effect -->
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:150%; height:150%; background:radial-gradient(circle, rgba(16,185,129,0.15), transparent); filter:blur(40px); pointer-events:none;"></div>
          
          <!-- Results content injected by JavaScript -->
          <div style="position:relative; z-index:1;">
            <!-- Will be populated by calculate() function -->
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. 💎 BENEFITS SECTION — ASYMMETRIC VISUAL STORYTELLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYOUT: Mix large featured card + smaller benefit cards (NOT uniform grid)

<section style="padding:140px 20px; background:linear-gradient(to bottom, #FFFFFF, #F8FAFC); position:relative;">
  
  <div style="max-width:1280px; margin:0 auto;">
    
    <!-- Section header -->
    <h2 style="text-align:center; font-size:clamp(48px,6vw,72px); font-weight:800; line-height:1; letter-spacing:-0.04em; margin-bottom:80px; color:#0F0F0F;">
      Why Use [Tool Name]?
    </h2>
    
    <!-- Asymmetric benefit grid -->
    <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:32px;">
      
      <!-- FEATURED BENEFIT (large, spans 2 rows) -->
      <div style="grid-row:span 2; background:linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #6366F1 100%); color:white; padding:56px; border-radius:32px; box-shadow:0 30px 80px rgba(124,58,237,0.25); position:relative; overflow:hidden;">
        <!-- Decorative glow -->
        <div style="position:absolute; bottom:-20%; right:-10%; width:300px; height:300px; background:radial-gradient(circle, rgba(255,255,255,0.15), transparent); filter:blur(60px);"></div>
        
        <div style="position:relative; z-index:1;">
          <div style="font-size:64px; margin-bottom:28px;">🎯</div>
          <h3 style="font-size:36px; font-weight:700; line-height:1.2; margin-bottom:20px;">
            [Primary Benefit Title]
          </h3>
          <p style="font-size:18px; line-height:1.7; opacity:0.95;">
            [Detailed description of the main benefit - 2-3 sentences highlighting the core value]
          </p>
        </div>
      </div>
      
      <!-- SMALLER BENEFIT CARDS (4-5 cards) -->
      <div style="background:white; border:2px solid #F1F5F9; padding:40px; border-radius:28px; transition:all 0.3s ease; box-shadow:0 10px 40px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 60px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 40px rgba(0,0,0,0.04)';">
        <div style="width:56px; height:56px; background:linear-gradient(135deg, #F97316, #FB923C); border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:20px; box-shadow:0 10px 30px rgba(249,115,22,0.25);">
          ⚡
        </div>
        <h3 style="font-size:22px; font-weight:700; margin-bottom:12px; color:#0F0F0F;">
          [Benefit 2]
        </h3>
        <p style="font-size:16px; color:#64748B; line-height:1.6;">
          [Description]
        </p>
      </div>
      
      <!-- Repeat 4-6 smaller benefit cards with different icons and gradient colors -->
      
    </div>
  </div>
</section>

ICONS: Use emojis or create simple gradient icon backgrounds with symbols

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. 📊 HOW IT WORKS — FLOATING TIMELINE CARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VISUAL: Connected flow with premium numbered badges (NOT plain stacked cards)

<section style="padding:140px 20px; background:linear-gradient(135deg, #0F0F0F, #1A1A1A); position:relative; overflow:hidden;">
  
  <!-- Background orb -->
  <div style="position:absolute; top:50%; left:20%; width:400px; height:400px; background:radial-gradient(circle, rgba(99,102,241,0.2), transparent); filter:blur(70px); pointer-events:none;"></div>
  
  <div style="max-width:1100px; margin:0 auto; position:relative; z-index:1;">
    
    <h2 style="text-align:center; font-size:clamp(48px,6vw,72px); font-weight:800; line-height:1; letter-spacing:-0.04em; margin-bottom:100px; background:linear-gradient(135deg, #FFFFFF, #C4B5FD); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
      How It Works
    </h2>
    
    <!-- Steps (3 steps) -->
    <div style="display:grid; gap:64px;">
      
      <!-- STEP 1 -->
      <div style="display:grid; grid-template-columns:120px 1fr; gap:40px; align-items:start;">
        <!-- Gradient number badge -->
        <div style="position:relative;">
          <div style="width:120px; height:120px; background:linear-gradient(135deg, #7C3AED, #9333EA); border-radius:28px; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:800; color:white; box-shadow:0 20px 60px rgba(124,58,237,0.35), 0 8px 24px rgba(124,58,237,0.2);">
            1
          </div>
          <!-- Connecting line (except for last step) -->
          <div style="position:absolute; top:120px; left:50%; transform:translateX(-50%); width:3px; height:64px; background:linear-gradient(to bottom, rgba(124,58,237,0.5), transparent);"></div>
        </div>
        
        <!-- Step content -->
        <div style="padding-top:20px;">
          <h3 style="font-size:32px; font-weight:700; color:white; margin-bottom:16px; line-height:1.2;">
            [Step 1 Title]
          </h3>
          <p style="font-size:18px; color:rgba(255,255,255,0.6); line-height:1.8;">
            [Detailed description of step 1]
          </p>
        </div>
      </div>
      
      <!-- STEP 2 (similar structure, different gradient color) -->
      <div style="display:grid; grid-template-columns:120px 1fr; gap:40px; align-items:start;">
        <div style="position:relative;">
          <div style="width:120px; height:120px; background:linear-gradient(135deg, #6366F1, #3B82F6); border-radius:28px; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:800; color:white; box-shadow:0 20px 60px rgba(99,102,241,0.35);">
            2
          </div>
          <div style="position:absolute; top:120px; left:50%; transform:translateX(-50%); width:3px; height:64px; background:linear-gradient(to bottom, rgba(99,102,241,0.5), transparent);"></div>
        </div>
        <div style="padding-top:20px;">
          <h3 style="font-size:32px; font-weight:700; color:white; margin-bottom:16px;">
            [Step 2 Title]
          </h3>
          <p style="font-size:18px; color:rgba(255,255,255,0.6); line-height:1.8;">
            [Description]
          </p>
        </div>
      </div>
      
      <!-- STEP 3 (no connecting line) -->
      <div style="display:grid; grid-template-columns:120px 1fr; gap:40px; align-items:start;">
        <div>
          <div style="width:120px; height:120px; background:linear-gradient(135deg, #F97316, #FB923C); border-radius:28px; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:800; color:white; box-shadow:0 20px 60px rgba(249,115,22,0.35);">
            3
          </div>
        </div>
        <div style="padding-top:20px;">
          <h3 style="font-size:32px; font-weight:700; color:white; margin-bottom:16px;">
            [Step 3 Title]
          </h3>
          <p style="font-size:18px; color:rgba(255,255,255,0.6); line-height:1.8;">
            [Description]
          </p>
        </div>
      </div>
      
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. 🎯 RESULTS/VALUE SECTION — DARK WITH GRADIENT METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section style="padding:140px 20px; background:#0A0A0A; position:relative; overflow:hidden;">
  
  <!-- Gradient orbs -->
  <div style="position:absolute; top:0; right:10%; width:500px; height:500px; background:radial-gradient(circle, rgba(236,72,153,0.2), transparent); filter:blur(80px);"></div>
  <div style="position:absolute; bottom:0; left:15%; width:450px; height:450px; background:radial-gradient(circle, rgba(124,58,237,0.15), transparent); filter:blur(70px);"></div>
  
  <div style="max-width:1100px; margin:0 auto; text-align:center; position:relative; z-index:1;">
    
    <h2 style="font-size:clamp(48px,6vw,72px); font-weight:800; line-height:1; letter-spacing:-0.04em; margin-bottom:28px; background:linear-gradient(135deg, #FFFFFF, #C4B5FD); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
      What You'll Get
    </h2>
    <p style="font-size:20px; color:rgba(255,255,255,0.6); line-height:1.7; margin-bottom:80px; max-width:700px; margin-left:auto; margin-right:auto;">
      Powerful insights and results that drive real outcomes
    </p>
    
    <!-- Metrics grid (3 columns) -->
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:48px;">
      
      <div style="padding:48px 32px; background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); border-radius:24px;">
        <div style="font-size:64px; font-weight:900; line-height:1; margin-bottom:16px; background:linear-gradient(135deg, #7C3AED, #EC4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
          [Metric 1]
        </div>
        <p style="font-size:18px; color:rgba(255,255,255,0.7); line-height:1.6;">
          [Metric description]
        </p>
      </div>
      
      <div style="padding:48px 32px; background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); border-radius:24px;">
        <div style="font-size:64px; font-weight:900; line-height:1; margin-bottom:16px; background:linear-gradient(135deg, #6366F1, #3B82F6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
          [Metric 2]
        </div>
        <p style="font-size:18px; color:rgba(255,255,255,0.7);">
          [Description]
        </p>
      </div>
      
      <div style="padding:48px 32px; background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); border-radius:24px;">
        <div style="font-size:64px; font-weight:900; line-height:1; margin-bottom:16px; background:linear-gradient(135deg, #F97316, #FB923C); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
          [Metric 3]
        </div>
        <p style="font-size:18px; color:rgba(255,255,255,0.7);">
          [Description]
        </p>
      </div>
      
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. 💬 TESTIMONIALS — PREMIUM GLASSMORPHISM CARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section style="padding:140px 20px; background:linear-gradient(to bottom, #F8FAFC, #FFFFFF);">
  
  <div style="max-width:1280px; margin:0 auto;">
    
    <h2 style="text-align:center; font-size:clamp(48px,6vw,72px); font-weight:800; line-height:1; margin-bottom:80px; color:#0F0F0F;">
      What People Are Saying
    </h2>
    
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:32px;">
      
      <!-- TESTIMONIAL 1 -->
      <div style="background:white; border:2px solid #F1F5F9; padding:40px; border-radius:28px; box-shadow:0 10px 40px rgba(0,0,0,0.04); transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 60px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 40px rgba(0,0,0,0.04)';">
        <div style="color:#F97316; font-size:20px; margin-bottom:20px; letter-spacing:2px;">★★★★★</div>
        <p style="font-size:17px; color:#475569; line-height:1.7; margin-bottom:28px; font-style:italic;">
          "[Compelling testimonial quote highlighting specific value or outcome]"
        </p>
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:48px; height:48px; background:linear-gradient(135deg, #7C3AED, #9333EA); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; font-weight:700;">
            [Initial]
          </div>
          <div>
            <div style="font-weight:700; font-size:16px; color:#0F0F0F; margin-bottom:4px;">[Name]</div>
            <div style="font-size:14px; color:#94A3B8;">[Role] at [Company]</div>
          </div>
        </div>
      </div>
      
      <!-- TESTIMONIAL 2 & 3 (similar structure) -->
      
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. ❓ FAQ — INTERACTIVE ACCORDION WITH GLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section style="padding:140px 20px; background:#FFFFFF;">
  
  <div style="max-width:900px; margin:0 auto;">
    
    <h2 style="text-align:center; font-size:clamp(48px,6vw,72px); font-weight:800; line-height:1; margin-bottom:80px; color:#0F0F0F;">
      Frequently Asked Questions
    </h2>
    
    <div style="display:grid; gap:20px;">
      
      <!-- FAQ ITEM 1 -->
      <div style="background:white; border:2px solid #F1F5F9; border-radius:24px; overflow:hidden; transition:all 0.3s ease;" onmouseover="this.style.borderColor='rgba(124,58,237,0.2)'; this.style.boxShadow='0 10px 40px rgba(124,58,237,0.08)';" onmouseout="this.style.borderColor='#F1F5F9'; this.style.boxShadow='none';">
        <div style="padding:28px 32px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:24px;" onclick="var answer = this.nextElementSibling; var icon = this.querySelector('span'); if(answer.style.maxHeight){ answer.style.maxHeight = null; answer.style.padding = '0 32px'; icon.textContent = '+'; icon.style.transform = 'rotate(0deg)'; } else { answer.style.maxHeight = answer.scrollHeight + 'px'; answer.style.padding = '0 32px 28px 32px'; icon.textContent = '−'; icon.style.transform = 'rotate(90deg)'; }">
          <h3 style="font-size:20px; font-weight:700; color:#0F0F0F; line-height:1.4;">[Question]</h3>
          <span style="font-size:32px; color:#7C3AED; font-weight:300; transition:transform 0.3s ease; flex-shrink:0;">+</span>
        </div>
        <div style="max-height:0; overflow:hidden; transition:all 0.3s ease; padding:0 32px;">
          <p style="font-size:17px; color:#64748B; line-height:1.8; padding-bottom:0;">
            [Detailed answer to FAQ]
          </p>
        </div>
      </div>
      
      <!-- FAQ ITEMS 2-7 (5-7 total) -->
      
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. 🎯 FINAL CTA — CINEMATIC CONVERSION BLOCK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section style="position:relative; overflow:hidden; padding:180px 20px; background:linear-gradient(135deg, #1a0b2e, #0a0a0a); text-align:center;">
  
  <!-- Massive floating gradient orbs -->
  <div style="position:absolute; top:-30%; left:10%; width:800px; height:800px; background:radial-gradient(circle, rgba(124,58,237,0.3), transparent); filter:blur(100px); pointer-events:none;"></div>
  <div style="position:absolute; bottom:-30%; right:10%; width:700px; height:700px; background:radial-gradient(circle, rgba(236,72,153,0.25), transparent); filter:blur(90px); pointer-events:none;"></div>
  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:600px; height:600px; background:radial-gradient(circle, rgba(99,102,241,0.2), transparent); filter:blur(80px); pointer-events:none;"></div>
  
  <div style="max-width:900px; margin:0 auto; position:relative; z-index:1;">
    
    <!-- Small badge -->
    <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.1); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.15); padding:10px 20px; border-radius:100px; font-size:14px; color:rgba(255,255,255,0.9); margin-bottom:32px;">
      <span style="width:8px; height:8px; background:#F97316; border-radius:50%; box-shadow:0 0 16px rgba(249,115,22,0.8);"></span>
      Get Started in 30 Seconds
    </div>
    
    <!-- Giant headline -->
    <h2 style="font-size:clamp(56px,8vw,96px); font-weight:900; line-height:0.95; letter-spacing:-0.05em; margin-bottom:32px; background:linear-gradient(135deg, #FFFFFF, #C4B5FD, #FBBF24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
      Ready to Get Started?
    </h2>
    
    <p style="font-size:22px; color:rgba(255,255,255,0.7); line-height:1.7; margin-bottom:56px; max-width:700px; margin-left:auto; margin-right:auto;">
      Join thousands of users getting instant, accurate results
    </p>
    
    <!-- Massive CTA button -->
    <button onclick="document.getElementById('tool-section').scrollIntoView({behavior:'smooth'})" style="background:linear-gradient(135deg, #F97316, #FB923C); color:white; padding:24px 64px; border:none; border-radius:20px; font-size:22px; font-weight:800; cursor:pointer; box-shadow:0 30px 80px rgba(249,115,22,0.45), 0 12px 32px rgba(249,115,22,0.3); transition:all 0.4s cubic-bezier(0.4,0,0.2,1); letter-spacing:0.5px;" onmouseover="this.style.transform='translateY(-5px) scale(1.03)'; this.style.boxShadow='0 40px 100px rgba(249,115,22,0.55), 0 16px 40px rgba(249,115,22,0.4)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 30px 80px rgba(249,115,22,0.45), 0 12px 32px rgba(249,115,22,0.3)';">
      Start Now — It's Free →
    </button>
    
    <p style="font-size:15px; color:rgba(255,255,255,0.5); margin-top:28px;">
      ✓ No credit card required  •  ✓ Instant access  •  ✓ Free forever
    </p>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. 🎨 FOOTER — PREMIUM SAAS MULTI-COLUMN LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL: The footer MUST feel like a premium SaaS company footer (Stripe, Vercel, Linear quality).
This is NOT optional - every landing page MUST include this professional footer.

<footer style="background:linear-gradient(to bottom, #0A0A0A, #000000); padding:80px 20px 40px; position:relative; overflow:hidden;">
  
  <!-- Subtle gradient orb -->
  <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:600px; height:300px; background:radial-gradient(circle, rgba(124,58,237,0.08), transparent); filter:blur(80px); pointer-events:none;"></div>
  
  <div style="max-width:1280px; margin:0 auto; position:relative; z-index:1;">
    
    <!-- Main footer grid (4 columns on desktop) -->
    <div style="display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:64px; margin-bottom:64px;">
      
      <!-- COLUMN 1: Brand + Description -->
      <div>
        <!-- Logo/Brand name -->
        <div style="font-size:24px; font-weight:800; color:white; margin-bottom:16px; background:linear-gradient(135deg, #FFFFFF, #C4B5FD); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
          [Tool Name]
        </div>
        
        <!-- Description -->
        <p style="font-size:15px; color:rgba(255,255,255,0.6); line-height:1.7; margin-bottom:28px; max-width:280px;">
          Professional-grade calculations powered by advanced algorithms. Trusted by thousands worldwide.
        </p>
        
        <!-- Trust badge -->
        <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); padding:8px 16px; border-radius:100px; font-size:13px; color:rgba(255,255,255,0.7);">
          <span style="color:#10B981;">✓</span>
          100% Secure & Private
        </div>
      </div>
      
      <!-- COLUMN 2: Product -->
      <div>
        <h4 style="font-size:14px; font-weight:700; color:white; margin-bottom:20px; text-transform:uppercase; letter-spacing:0.5px;">
          Product
        </h4>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin-bottom:14px;">
            <a href="#tool-section" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Calculator
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Features
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              How It Works
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Pricing
            </a>
          </li>
        </ul>
      </div>
      
      <!-- COLUMN 3: Resources -->
      <div>
        <h4 style="font-size:14px; font-weight:700; color:white; margin-bottom:20px; text-transform:uppercase; letter-spacing:0.5px;">
          Resources
        </h4>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Documentation
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Help Center
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Blog
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              API
            </a>
          </li>
        </ul>
      </div>
      
      <!-- COLUMN 4: Company -->
      <div>
        <h4 style="font-size:14px; font-weight:700; color:white; margin-bottom:20px; text-transform:uppercase; letter-spacing:0.5px;">
          Company
        </h4>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              About
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Contact
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Privacy
            </a>
          </li>
          <li style="margin-bottom:14px;">
            <a href="#" style="font-size:15px; color:rgba(255,255,255,0.6); text-decoration:none; transition:color 0.3s ease;" onmouseover="this.style.color='rgba(255,255,255,0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
              Terms
            </a>
          </li>
        </ul>
      </div>
      
    </div>
    
    <!-- Divider -->
    <div style="height:1px; background:linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin-bottom:32px;"></div>
    
    <!-- Bottom bar (Copyright + Social) -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:24px;">
      
      <!-- Copyright -->
      <p style="font-size:14px; color:rgba(255,255,255,0.5); margin:0;">
        © 2024 [Tool Name]. All rights reserved.
      </p>
      
      <!-- Social icons -->
      <div style="display:flex; gap:20px;">
        <a href="#" style="width:36px; height:36px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.6); text-decoration:none; transition:all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'; this.style.color='white';" onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='rgba(255,255,255,0.6)';">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="#" style="width:36px; height:36px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.6); text-decoration:none; transition:all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'; this.style.color='white';" onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='rgba(255,255,255,0.6)';">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
        </a>
        <a href="#" style="width:36px; height:36px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.6); text-decoration:none; transition:all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'; this.style.color='white';" onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='rgba(255,255,255,0.6)';">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
      </div>
      
    </div>
    
  </div>
  
  <!-- Mobile responsive override -->
  <style>
    @media (max-width: 768px) {
      footer > div > div:first-child {
        grid-template-columns: 1fr !important;
        gap: 48px !important;
      }
    }
  </style>
  
</footer>

═══════════════════════════════════════════════════════════
⚡ CALCULATOR FUNCTIONALITY (CRITICAL)
═══════════════════════════════════════════════════════════

The embedded tool MUST:
✅ Include ALL inputs from blueprint.inputs_required
✅ Implement blueprint.calculation_logic accurately
✅ Show results dynamically without page reload
✅ Use event listeners (button onclick or form onsubmit with preventDefault)
✅ Handle validation and edge cases
✅ Display formatted results with <strong> around key numbers
✅ Smooth scroll to results: document.getElementById('results').scrollIntoView({behavior:'smooth'})

Example:
function calculate() {
  const input1 = parseFloat(document.getElementById('input1').value) || 0;
  const input2 = parseFloat(document.getElementById('input2').value) || 0;
  const result = input1 * input2;
  
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = \`
    <div style="text-align:center;">
      <!-- Success icon with animation -->
      <div style="width:80px; height:80px; background:linear-gradient(135deg, #10B981, #34D399); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 28px; box-shadow:0 20px 60px rgba(16,185,129,0.4), 0 0 0 8px rgba(16,185,129,0.1); animation:scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <!-- Result headline -->
      <h3 style="font-size:20px; font-weight:600; color:rgba(255,255,255,0.7); margin-bottom:12px; text-transform:uppercase; letter-spacing:1px; font-size:14px;">
        Your Result
      </h3>
      
      <!-- Giant result number with gradient -->
      <div style="font-size:64px; font-weight:900; line-height:1; margin-bottom:24px; background:linear-gradient(135deg, #FFFFFF, #10B981, #34D399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-0.02em;">
        \${Math.round(result).toLocaleString()}
      </div>
      
      <!-- Result explanation -->
      <p style="font-size:17px; color:rgba(255,255,255,0.7); line-height:1.8; max-width:500px; margin:0 auto 32px;">
        [Contextual explanation of what this result means and why it matters]
      </p>
      
      <!-- Additional insights (optional metrics cards) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:16px; margin-top:32px;">
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:16px; backdrop-filter:blur(8px);">
          <div style="font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Insight 1</div>
          <div style="font-size:24px; font-weight:700; color:white;">[Value]</div>
        </div>
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:16px; backdrop-filter:blur(8px);">
          <div style="font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Insight 2</div>
          <div style="font-size:24px; font-weight:700; color:white;">[Value]</div>
        </div>
      </div>
      
      <!-- Action buttons (optional) -->
      <div style="margin-top:32px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button onclick="window.print()" style="background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.15); color:white; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.3s ease; backdrop-filter:blur(8px);" onmouseover="this.style.background='rgba(255,255,255,0.12)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='translateY(0)';">
          Save Results
        </button>
        <button onclick="document.querySelector('form').reset(); resultsDiv.style.display='none';" style="background:transparent; border:2px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.7); padding:14px 28px; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.3s ease;" onmouseover="this.style.borderColor='rgba(255,255,255,0.3)'; this.style.color='white';" onmouseout="this.style.borderColor='rgba(255,255,255,0.2)'; this.style.color='rgba(255,255,255,0.7)';">
          Calculate Again
        </button>
      </div>
    </div>
    
    <style>
      @keyframes scaleIn {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    </style>
  \`;
  resultsDiv.style.display = 'block';
  resultsDiv.scrollIntoView({behavior:'smooth', block:'center'});
}

═══════════════════════════════════════════════════════════
📋 BLUEPRINT DATA
═══════════════════════════════════════════════════════════

${JSON.stringify(blueprint, null, 2)}

═══════════════════════════════════════════════════════════
✅ FINAL QUALITY CHECKLIST
═══════════════════════════════════════════════════════════

DOCUMENT STRUCTURE:
□ Complete <!DOCTYPE html> document
□ Proper <head> with meta tags, title, viewport
□ Google Fonts: Inter loaded
□ Body: margin:0; padding:0; font-family: Inter, sans-serif

ALL 9 PREMIUM SECTIONS:
□ 1. Hero Section — Cinematic split layout with floating preview
□ 2. Tool Section — Premium glassmorphism calculator UI
□ 3. Benefits Section — Asymmetric visual storytelling layout
□ 4. How It Works — Floating timeline with gradient badges
□ 5. Results/Value — Dark section with gradient metrics
□ 6. Testimonials — Premium glassmorphism cards
□ 7. FAQ — Interactive luxury accordion
□ 8. Final CTA — Cinematic conversion block
□ 9. Footer — Professional multi-column SaaS footer

DESIGN QUALITY:
□ Alternating dark/light sections (NOT all white)
□ Layered gradient backgrounds with floating blur orbs
□ Glassmorphism effects with backdrop-filter
□ Premium typography scale (clamp(), tight letter-spacing)
□ Deep layered shadows on all cards/elements
□ Large border radius (24px-40px)
□ Generous spacing (140px section padding)
□ Visual depth and layering throughout

INTERACTIVITY:
□ Hover states with elevation and glow effects
□ Smooth transitions (0.3s-0.4s cubic-bezier)
□ Interactive FAQ accordion
□ Button hover animations (lift + scale)
□ Focus states on inputs with glow rings
□ Smooth scroll behavior on CTAs

CALCULATOR FUNCTIONALITY:
□ All blueprint inputs rendered
□ Calculation logic implemented correctly
□ Results display with animation
□ Form validation and error handling
□ No page reload on submit
□ Results scroll into view smoothly
□ Premium results panel design

FOOTER REQUIREMENTS:
□ 4-column layout (Brand + Product + Resources + Company)
□ Brand description and trust badge
□ Navigation links in each column
□ Bottom bar with copyright and social icons
□ Gradient divider line
□ Dark premium background
□ Hover states on all links
□ Mobile responsive (stacks on mobile)

RESPONSIVE DESIGN:
□ Mobile: stack hero columns vertically
□ Mobile: reduce hero headline size
□ Mobile: single column for benefits/testimonials
□ Mobile: stack footer columns
□ Tablet: maintain premium spacing
□ All sections readable on small screens

TECHNICAL:
□ No markdown fences in output
□ Proper HTML structure
□ All inline styles (no external CSS files)
□ Functional JavaScript for calculator
□ SEO meta tags (title, description, OG tags)
□ Viewport meta tag for mobile

BRAND QUALITY:
□ Feels like $50k custom build
□ Matches Linear/Stripe/Framer aesthetic
□ Cinematic and immersive experience
□ Premium startup-grade polish
□ Investor-demo quality
□ NOT template-like or generic

Generate the complete PREMIUM landing page HTML now:`;
}

type HtmlQualityMode = "landing" | "standalone" | "embed";

function normalizeGeneratedHtml(html: string): string {
  let normalized = html
    .replace(/^```(?:html)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .replace(/--primary-color/gi, "--brand-primary")
    .replace(/--secondary-color/gi, "--brand-secondary")
    .trim();

  if (!normalized.toLowerCase().includes("@media") && /<\/style>/i.test(normalized)) {
    const responsiveFallback = `

@media (max-width: 900px) {
  :where(.hero-grid, .tool-panel, .footer-grid, .testimonial-grid, .benefits-grid, .roadmap-section, .timeline-rail, .tool-form-grid) {
    grid-template-columns: 1fr !important;
  }

  :where(.experience-shell, .taf-widget) {
    overflow-x: hidden;
  }

  :where(.hero-composition, .ai-product-preview, .configurator-card, .analysis-workspace, .tool-card, .taf-tool-panel, .taf-insight-dashboard) {
    border-radius: 22px;
  }
}

@media (max-width: 640px) {
  :where(body, .experience-shell) {
    padding-inline: 0;
  }

  :where(.site-nav, .hero-grid, .tool-panel, .site-footer, .taf-widget) {
    padding-inline: 18px !important;
  }

  :where(h1) {
    font-size: clamp(2.35rem, 12vw, 3.6rem) !important;
    line-height: 0.96 !important;
  }

  :where(.field-card, .signal-card, .strategy-card, .monetization-card, .taf-field-card, .taf-strategy-card) {
    padding: 18px !important;
  }
}`;

    normalized = normalized.replace(/<\/style>/i, `${responsiveFallback}\n</style>`);
  }

  return normalized;
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
    { pattern: "border-radius: 8px", label: "old small-radius card styling" },
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

  const inlineStyleCount = (html.match(/\sstyle=/gi) ?? []).length;
  if (inlineStyleCount > 12) {
    violations.push("too many inline style attributes");
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

  if (mode === "standalone") {
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
      violations.push(`missing core standalone SaaS components: ${missingCoreComponents.join(", ")}`);
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
    if (presentPremiumSignals.length < 7) {
      violations.push(`standalone page needs more premium AI SaaS sections (${presentPremiumSignals.length}/7 found)`);
    }

    if (!lower.includes("score-ring") && !lower.includes("score-meter")) {
      violations.push("missing visual score component");
    }

    const fakeMetricPatterns = [
      "traffic 120k",
      "revenue 500k",
      "$500k",
      "120k visitors",
      "500k revenue",
    ];
    const fakeMetricMatches = fakeMetricPatterns.filter((pattern) => lower.includes(pattern));
    if (fakeMetricMatches.length > 0) {
      violations.push(`contains fake vanity metrics: ${fakeMetricMatches.join(", ")}`);
    }

    const genericTemplatePhrases = [
      "powerful features",
      "why choose us",
      "get started today",
      "feature 1",
      "feature 2",
      "calculate now",
    ];
    const genericPhraseMatches = genericTemplatePhrases.filter((phrase) => lower.includes(phrase));
    if (genericPhraseMatches.length > 0) {
      violations.push(`contains generic template phrasing: ${genericPhraseMatches.join(", ")}`);
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

  if (mode === "landing") {
    const hasSaaSStructure =
      lower.includes("hero") &&
      (lower.includes("metric") || lower.includes("kpi")) &&
      (lower.includes("faq") || lower.includes("<details")) &&
      (lower.includes("dashboard") || lower.includes("mockup") || lower.includes("preview"));

    if (!hasSaaSStructure) {
      violations.push("missing premium SaaS landing-page structure");
    }

    const requiredLandingToolComponents = [
      "tool-card",
      "tool-header",
      "tool-ai-badge",
      "tool-progress",
      "tool-form-grid",
      "tool-field-card",
      "tool-icon-chip",
      "tool-select-wrap",
      "tool-primary-button",
      "tool-result-dashboard",
      "tool-insight-card",
      "tool-recommendation-card",
      "tool-monetization-card",
    ];

    const missingToolComponents = requiredLandingToolComponents.filter((component) => !lower.includes(component));
    if (missingToolComponents.length > 0) {
      violations.push(`missing premium embedded tool-card components: ${missingToolComponents.join(", ")}`);
    }

    if (!lower.includes("tool-score-card") && !lower.includes("tool-score-ring")) {
      violations.push("missing premium tool score component");
    }

    if (lower.includes("<input") && !lower.includes("tool-field-card")) {
      violations.push("tool inputs are not wrapped in premium field cards");
    }

    if (lower.includes("<select") && !lower.includes("tool-select-wrap")) {
      violations.push("tool selects are not wrapped in custom premium select UI");
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
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Landing Page/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json() as any;

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
    assertPremiumHtmlQuality(html, "landing");

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
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a principal SaaS product designer and frontend engineer. Output only raw HTML. Create premium, modern, responsive startup-grade landing pages with reusable CSS, Inter/Manrope typography, polished sections, and no generic templates."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 16000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Landing Page/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json() as any;
    let html = data.choices?.[0]?.message?.content || "";

    if (!html) {
      throw new Error("Empty response from OpenAI");
    }

    html = normalizeGeneratedHtml(html);
    assertPremiumHtmlQuality(html, "landing");

    console.log("[Landing Page/OpenAI] Generated successfully, length:", html.length);
    return html;
  } catch (error) {
    console.error("[Landing Page/OpenAI] Generation error:", error);
    throw error;
  }
}

function generateHTMLPrompt(
  blueprint: any,
  action: "standalone" | "embed"
): string {
  const standaloneRequirements = `
STANDALONE EXPERIENCE CONTRACT
You are not generating a landing page template. You are designing a complete premium AI SaaS product experience around the interactive business asset.
The final page must feel custom, funded, modern, emotionally valuable, and production-ready.

Required component architecture and class names:
- experience-shell: body-level layout wrapper with layered gradient atmosphere and refined spacing rhythm.
- site-nav: minimal premium navigation with brand, product links, and one high-intent CTA.
- hero-grid: cinematic split hero with hero-copy on the left and hero-composition on the right.
- hero-composition: layered visual system containing ai-product-preview, floating insight chips, and subtle background orbs.
- ai-product-preview: not a fake dashboard. Show qualitative AI analysis states, recommendation panels, opportunity breakdowns, and product UI fragments without fake vanity numbers.
- trust-bar: concise credibility row with business outcome proof points and no fabricated metrics.
- tool-panel: premium interactive product area, visually stronger than the surrounding sections.
- configurator-card: app-like AI configurator container inside tool-panel.
- field-card: each input/select lives inside a modern card with label, microcopy, icon-chip, and custom focus state.
- analysis-workspace: hidden results dashboard that appears after submit and feels like a paid AI report.
- score-ring or score-meter: visual opportunity score/progress indicator.
- signal-card: insight cards for traffic signals, conversion friction, authority gaps, and monetization readiness. Do not use fake numbers like "Traffic 120k" or "Revenue 500k".
- strategy-card: actionable recommendations for monetization, traffic, conversion, and SEO.
- monetization-card: revenue path cards with realistic strategy language, not made-up revenue claims.
- benefits-grid: outcome-led benefit cards. Do not title this "Powerful Features".
- timeline-rail with roadmap-step items for monetization or growth.
- testimonial-grid with testimonial-card outcome proof.
- faq-section using details/summary or accessible accordion cards.
- final-cta: premium closing CTA.
- site-footer with footer-grid: modern minimal footer with newsletter form and elegant link groups.

Standalone visual requirements:
- Hero must be split layout, not centered-only. Include left content, CTA group, trust indicators, and right product composition.
- Use cinematic but restrained visual hierarchy: large expressive headline, crisp subcopy, layered gradients, floating UI blocks, and generous whitespace.
- The right-side visual must look like a modern AI product interface, not a fake dashboard screenshot. Use recommendation queues, insight cards, score states, decision paths, and qualitative product UI.
- Tool panel must contain a real interactive experience: use a literal <form id="business-asset-form"> with field-card inputs/selects, a submit button, and an analysis-workspace results area.
- Tool panel should feel like a premium SaaS configurator with custom selects, input groups, progress state, subtle hover/focus transitions, and a premium gradient CTA.
- Results must look like an AI insight dashboard, not text paragraphs. Use score ring/meter, signal cards, recommendation cards, monetization cards, progress bars, and strategy timelines.
- Footer must be modern and minimal: footer-grid columns, brand statement, Product, Resources, Company, social text links, newsletter CTA, and subtle divider.
- Copy should use outcomes such as revenue growth, traffic intelligence, lead capture, monetization, authority, and conversion momentum.
- Avoid weak section titles like "Powerful Features" and "Why This Works"; use specific, premium headings such as "Revenue Signals Worth Acting On" or "From Traffic Insight To Monetization Plan".

Hard design bans:
- Do not create generic bright gradient hero banners, plain centered hero text, flat white card grids, Bootstrap-style rows, fake SaaS dashboards, or template-like sections.
- Do not invent fake vanity metrics such as "Traffic 120k", "Revenue 500k", "$500k", or similar fabricated proof.
- Do not use generic labels like "Feature 1", "Powerful Features", "Why Choose Us", "Get Started Today", or "Calculate Now".
`;

  const embedRequirements = `
EMBED EXPERIENCE CONTRACT
Create one compact premium mini SaaS application, not a form snippet, copy-paste calculator, or generic embed.

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

Step-based UX requirements:
- Do not show all fields as one long form.
- Organize inputs into progressive steps such as Audience, Business Goal, Offer Details, and Generate Insights.
- Include Back/Next buttons, current step state, and a final "Generate Insights" action.
- If the blueprint has fewer than 4 fields, still create a 3-step experience by grouping related prompts intelligently.
- Keep the widget compact enough for real websites while still feeling premium.

Embed visual requirements:
- Header must instantly communicate AI-powered, premium, and business-focused.
- Inputs must use floating labels or label-over-field cards, icon chips, smooth focus states, and grouped spacing.
- Results must be a monetization intelligence dashboard, not plain text cards.
- Include opportunity score, progress/score visual, growth metrics, traffic insight, conversion recommendation, monetization recommendation, and strategy blocks.
- Include a CTA area for export/share, upgrade prompt, or lead capture.
- Use only scoped "taf-" classes and IDs. Do not include global nav, footer, page-level tags, unscoped generic classes, or global CSS resets outside the taf-widget scope.
`;

  return `You are a principal SaaS frontend engineer creating a production-ready premium business asset for an AI Online Business Opportunity Engine.

Output ONLY raw HTML. No markdown, no code fences, no explanations, no preamble.

Mode: ${action.toUpperCase()}

${action === "standalone" ? `
Standalone rules:
- Output a complete <!DOCTYPE html> document with html, head, and body.
- Must work as one uploadable .html file.
- Include responsive CSS in one reusable <style> block with CSS variables and component classes.
- Include Inter or Manrope from Google Fonts.
- Include a premium multi-column footer inside the generated page.
- Wrap the visible page in <main class="experience-shell"> and build it like a complete premium AI SaaS product experience around the interactive business asset.
${standaloneRequirements}
` : `
Embed rules:
- Do not include <!DOCTYPE>, html, head, or body tags.
- Output one embeddable wrapper div plus scoped CSS and JavaScript.
- Prefix wrapper, form, input, and result IDs with "taf-" to avoid page conflicts.
- Keep the embed self-contained and responsive.
- Do not include a full site footer in embed mode.
- Use scoped class names prefixed with "taf-" and avoid global selectors except inside the wrapper.
${embedRequirements}
`}

Design mandate:
- The output must feel like a modern premium AI SaaS startup interface, not an export page, old startup template, generic form builder, or random section stack.
- Visual quality should feel inspired by Linear, Stripe, Framer, Raycast, Arc Browser, Notion AI, and Vercel: cinematic hero composition, soft layered gradients, app-like product UI, trust indicators, refined spacing, clean hierarchy, elegant forms, subtle animations.
- Use reusable CSS classes, CSS variables, and polished responsive layouts. Minimize inline CSS.
- Use premium token names like --brand-primary, --brand-secondary, --surface, --ink, --muted, and --line. Do not use generic legacy token names such as --primary-color or --secondary-color.
- Use a light premium design: near-white surfaces, soft borders, rounded 24px-32px cards, calm gradients, layered shadows, glass-light panels, high readability.
- Use Inter or Manrope. Never use Arial.
- Avoid Bootstrap-style rows, generic gradient headers, tiny 8px radii, flat white boxes, emojis, vendor branding, copied layouts, fake dashboards, Font Awesome, icon CDNs, Tailwind CDN, external images, and invalid CSS functions like darken().

Business mandate:
- This is a business opportunity asset, growth engine, lead magnet, conversion tool, traffic system, SEO system, or revenue optimization dashboard.
- Avoid generic calculator framing. Button labels should say things like "Reveal My Opportunity", "Generate My Strategy", "Analyze Growth Potential", or "Build My Revenue Plan".
- The results section must provide strategic recommendations, opportunity scores, prioritized next steps, and monetization guidance.
- Standalone mode must include trust-building sections: split hero, AI product preview, who it is for, outcome proof without fake numbers, process timeline, EEAT signals, FAQs, monetization section, final CTA, and footer.

Functionality requirements:
- Render every field listed in blueprint.inputs_required.
- Validate required inputs.
- Show a hidden results panel after submission without page reload.
- Use JavaScript that is complete, safe, and has no undefined variables.
- The output can use a strategic scoring model based on inputs; it does not need to be a numeric-only calculator.
- Results should include formatted HTML, clear headings, premium cards, and action steps.
- Use focus-visible styles, reduced-motion media query, semantic labels, and responsive grouped fields.
- Embed mode must implement progressive step navigation with Back, Next, and Generate states.
- Embed mode must keep all JavaScript selectors scoped to the taf-widget instance and avoid leaking globals beyond one small IIFE.

Blueprint to implement:
${JSON.stringify(blueprint, null, 2)}

Pre-flight checklist:
- Raw HTML only.
- Responsive on desktop, tablet, and mobile.
- Uses premium reusable CSS, not mostly inline styles.
- Uses Inter or Manrope, never Arial.
- No invalid CSS functions.
- No generic AI-template layout.
- No generic calculator wording unless the blueprint specifically requires it.
- Standalone mode includes a polished footer; embed mode does not.
- Embed mode is a step-based mini SaaS widget with taf-prefixed components and an AI insights dashboard.
- JavaScript runs without errors.

Generate the complete HTML now:`;
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
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: mode === "standalone" ? 16000 : 10000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[HTML/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json() as any;

    // Extract text from response
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
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a principal SaaS product designer and frontend engineer. Output only raw HTML. Create premium, modern, responsive AI business asset experiences with reusable component classes, Inter/Manrope typography, cinematic product composition, app-like configurators, polished forms, strategic insight dashboards, no fake metrics, and no generic templates."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: mode === "standalone" ? 16000 : 10000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[HTML/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json() as any;
    let html = data.choices?.[0]?.message?.content || "";

    if (!html) {
      throw new Error("Empty response from OpenAI");
    }

    html = normalizeGeneratedHtml(html);
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
  console.log("[Blueprint Regenerate] Has Anthropic key:", !!anthropicKey);
  console.log("[Blueprint Regenerate] Has OpenAI key:", !!openaiKey);

  const prompt = generateRegenerateBlueprintPrompt(currentBlueprint, niche, goal);

  // Try Anthropic first if available
  if (anthropicKey) {
    try {
      return await regenerateBlueprintWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Blueprint Regenerate] Anthropic failed:", error);
      // If OpenAI key is available, try it as fallback
      if (!openaiKey) {
        throw error;
      }
      console.log("[Blueprint Regenerate] Falling back to OpenAI...");
    }
  }

  // Try OpenAI
  if (openaiKey) {
    return await regenerateBlueprintWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for blueprint regeneration");
}

function generateRegenerateBlueprintPrompt(
  currentBlueprint: string,
  niche: string,
  goal: string
): string {
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
  "seo_title": "",
  "seo_description": ""
}

Avoid generic calculator framing unless explicitly required. Return ONLY the improved JSON object.`;

  return `You are regenerating clean, professional blueprint content for a premium SaaS dashboard application.

═══════════════════════════════════════════════════════════
CURRENT BLUEPRINT (for reference)
═══════════════════════════════════════════════════════════

${currentBlueprint}

═══════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════

- Niche: ${niche}
- Goal: ${goal}

YOUR TASK: Generate a SIGNIFICANTLY IMPROVED version with better content quality while maintaining clean, dashboard-optimized formatting.

═══════════════════════════════════════════════════════════
CRITICAL UI/UX REQUIREMENTS
═══════════════════════════════════════════════════════════

This blueprint must be:
✓ CLEAN and visually readable inside dashboard cards
✓ CONCISE but valuable (not bloated)
✓ PROFESSIONAL marketing language
✓ SEO-FOCUSED with strategic keywords
✓ FORMATTED for modern SaaS UI sections

DO NOT generate:
✗ Overly long paragraphs
✗ Technical dumps or raw JSON
✗ Broken formatting or serialized objects
✗ Weak one-line filler content
✗ Excessive or repetitive text

═══════════════════════════════════════════════════════════
JSON STRUCTURE RULES
═══════════════════════════════════════════════════════════

* Return ONLY pure valid JSON
* Do NOT return markdown or code fences
* Do NOT use \`\`\`json
* Do NOT stringify JSON
* Do NOT escape the entire object
* Do NOT return nested JSON as strings
* Every field must contain ONLY its own content
* Never merge multiple sections together
* The response must work directly with JSON.parse()

═══════════════════════════════════════════════════════════
RETURN THIS EXACT STRUCTURE
═══════════════════════════════════════════════════════════

{
"title": "",
"category": "",
"tool_type": "",
"description": "",
"purpose": "",
"target_keywords": [],
"inputs_required": [],
"output_type": "",
"calculation_logic": "",
"features": [],
"monetization_strategy": "",
"internal_links": [],
"cta_text": "",
"theme_suggestions": [],
"seo_title": "",
"seo_description": ""
}

═══════════════════════════════════════════════════════════
FIELD REQUIREMENTS (DASHBOARD-OPTIMIZED)
═══════════════════════════════════════════════════════════

━━━ purpose ━━━
**60-100 WORDS (Dashboard Card Length)**

Write a clean, professional paragraph that explains:
• What the tool does
• Who it helps
• Why it is useful

━━━ target_keywords ━━━
**5-8 KEYWORDS ONLY (Dashboard Badge-Friendly)**

Short, focused SEO keyword phrases.

━━━ calculation_logic ━━━
**60-80 WORDS (Dashboard Card Length)**

Clear, professional explanation in plain business language.

━━━ features ━━━
**5-8 FEATURES (Dashboard-Friendly)**

Short, specific, and valuable features.

━━━ monetization_strategy ━━━
**40-80 WORDS (Dashboard Card Length)**

Concise, business-focused monetization explanation.

━━━ internal_links ━━━
**5-8 RELATED TOOLS**

Relevant complementary tools.

━━━ cta_text ━━━
**1 SENTENCE - Strong Conversion-Focused CTA**

Natural marketing language with urgency or value.

═══════════════════════════════════════════════════════════
FINAL VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════

Before submitting your response, verify:

□ purpose is 60-100 words (dashboard card length)
□ target_keywords contains 5-8 focused keywords
□ calculation_logic is 60-80 words (dashboard card length)
□ features contains 5-8 concise items
□ monetization_strategy is 40-80 words (dashboard card length)
□ internal_links contains 5-8 related tools
□ cta_text is 1 sentence with strong conversion focus
□ All content is clean and readable in dashboard UI
□ No overly long paragraphs or bloated text
□ JSON is valid and properly formatted

═══════════════════════════════════════════════════════════

Return ONLY the improved JSON structure with clean, dashboard-optimized content. NO additional text, NO markdown fences:`;
}

async function regenerateBlueprintWithAnthropic(prompt: string, apiKey: string): Promise<string> {
  console.log("[Blueprint Regenerate/Anthropic] Generating");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blueprint Regenerate/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json() as any;

    // Extract text from response
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
    
    // Strip markdown fences if AI ignores instructions
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
    
    // Find JSON boundaries
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }
    
    // Parse to validate
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
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert AI business opportunity strategist creating premium monetization, SEO, authority, and conversion blueprints. Output only valid JSON, no markdown or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blueprint Regenerate/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json() as any;
    let raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    // Strip markdown fences
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
    
    // Find JSON boundaries
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }
    
    // Parse and validate
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
        {
          role: "user",
          content: prompt,
        },
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
            required: [
              "intro_text",
              "h2_sections",
              "faqs",
              "meta_title",
              "meta_description",
              "cta_text",
            ],
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
6. Avoid generic calculator framing unless explicitly required by the category

═══════════════════════════════════════════════════════════
RETURN THIS EXACT STRUCTURE
═══════════════════════════════════════════════════════════

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
  console.log("[Variation] Has Anthropic key:", !!anthropicKey);
  console.log("[Variation] Has OpenAI key:", !!openaiKey);

  // Try Anthropic first if available
  if (anthropicKey) {
    try {
      return await generateVariationWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error("[Variation] Anthropic failed:", error);
      if (!openaiKey) {
        throw error;
      }
      console.log("[Variation] Falling back to OpenAI...");
    }
  }

  // Try OpenAI
  if (openaiKey) {
    return await generateVariationWithOpenAI(prompt, openaiKey);
  }

  throw new Error("No API key available for variation generation");
}

async function generateVariationWithAnthropic(
  prompt: string,
  apiKey: string
): Promise<string> {
  console.log("[Variation/Anthropic] Generating variation");
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Variation/Anthropic] API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json() as any;
    let raw = data.content?.[0]?.text || "";

    if (!raw) {
      throw new Error("Empty response from Anthropic");
    }

    console.log("[Variation/Anthropic] Raw response length:", raw.length);

    // Clean markdown wrappers
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    // Find JSON boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object in response");
    }
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    // Parse and validate
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

async function generateVariationWithOpenAI(
  prompt: string,
  apiKey: string
): Promise<string> {
  console.log("[Variation/OpenAI] Generating variation");
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert AI business opportunity strategist. Create premium monetization asset variations with strong SEO, conversion, authority, and revenue strategy. Output only valid JSON, no markdown or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Variation/OpenAI] API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json() as any;
    let raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    console.log("[Variation/OpenAI] Raw response length:", raw.length);

    // Clean markdown wrappers
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    // Find JSON boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object in response");
    }
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    // Parse and validate
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
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert semantic SEO strategist, EEAT editor, and conversion copywriter for premium online business assets. Generate publish-ready authority content that ranks and converts. Return ONLY valid JSON with no markdown formatting."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Content Wrapper] API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    console.log("[Content Wrapper] API response received");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content wrapper generated");
    }

    // Clean markdown formatting if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanedContent);
    console.log("[Content Wrapper] Successfully parsed content package");
    
    return parsed;
  } catch (error) {
    console.error("[Content Wrapper] Generation error:", error);
    throw error;
  }
}
