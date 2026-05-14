import { buildCopyPack, mergeCopyIntoSpec } from "./copyEngine";
import type { CalculationEngineId, FaqItem, InsightCard, ToolRenderSpec, FormField } from "./types";

const ALLOWED_THEMES = new Set(["modern", "ocean", "forest", "sunset", "purple", "slate"]);

function resolveThemeKey(blueprint: Record<string, unknown>): string {
  const raw = String(blueprint?.visual_theme ?? blueprint?.theme ?? "modern")
    .trim()
    .toLowerCase();
  return ALLOWED_THEMES.has(raw) ? raw : "modern";
}

function pickEngine(blueprint: Record<string, unknown>): CalculationEngineId {
  const logic = String(blueprint.calculation_logic ?? "").toLowerCase();
  const title = String(blueprint.title ?? "").toLowerCase();
  const cat = String(blueprint.category ?? "").toLowerCase();
  const blob = `${logic} ${title} ${cat}`;

  if (/campaign profitability|paid campaign|roas|\bppc\b|google ads|meta ads|ad spend|media mix/.test(blob))
    return "campaignProfitability";
  if (/backlink velocity|referring domain velocity|\brd\/mo|new referring domains/.test(blob)) return "backlinkVelocity";
  if (/backlink|referring domain|\brd\b|domain gap/.test(blob)) return "backlinkGap";
  if (/link velocity|links per month|monthly links|link building/.test(blob)) return "linkVelocity";
  if (/content velocity|editorial cadence|articles per|publish rate/.test(blob)) return "contentVelocity";
  if (/client acquisition|\bsql\b|sales pipeline|\bcac\b/.test(blob)) return "clientAcquisition";
  if (/authority growth|eeat|brand mention|thought leadership/.test(blob)) return "authorityGrowth";
  if (/\broi\b|return on investment|payback|npv|roi forecast/.test(blob)) return "roiProjection";
  if (/monetization forecast|\bmrr\b|\barr\b|attach rate|revenue path/.test(blob)) return "monetizationForecast";
  if (/conversion projection|conversion estimate|\bcvr\b|funnel lift|conversion rate/.test(blob))
    return "conversionProjection";
  if (/lead value|pipeline value|deal size|qualified lead|lead projection/.test(blob)) return "leadValueEstimator";
  if (/outreach projection|cold email|dm sequence|sequencer/.test(blob)) return "outreachProjection";
  if (/seo growth|organic forecast|serp growth|keyword cluster/.test(blob)) return "seoGrowthForecast";
  if (/traffic opportunity|search demand|sessions|impressions/.test(blob)) return "trafficOpportunity";
  return "weightedInputs";
}

function normalizeFields(blueprint: Record<string, unknown>): FormField[] {
  const raw = blueprint.inputs_required;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      {
        id: "business_context",
        label: "What are you optimizing for?",
        type: "textarea",
        placeholder: "Describe your offer, audience, and current bottleneck…",
        required: true,
      },
    ];
  }
  return raw.slice(0, 7).map((item: unknown, i: number) => {
    if (typeof item === "string") {
      return {
        id: `field_${i}`,
        label: item,
        type: "text" as const,
        placeholder: "",
        required: true,
      };
    }
    const o = item as Record<string, unknown>;
    const label = String(o.label ?? o.name ?? `Input ${i + 1}`);
    const id = String(o.id ?? `field_${i}`).replace(/\W+/g, "_") || `field_${i}`;
    const typeRaw = String(o.type ?? "text").toLowerCase();
    const type =
      typeRaw === "select" || (Array.isArray(o.options) && o.options.length > 0)
        ? ("select" as const)
        : typeRaw === "textarea"
          ? ("textarea" as const)
          : ("text" as const);
    const options = Array.isArray(o.options)
      ? o.options.map((x) => String(x))
      : undefined;
    return {
      id,
      label,
      type,
      placeholder: o.placeholder != null ? String(o.placeholder) : "",
      help: o.help != null ? String(o.help) : undefined,
      options: type === "select" ? options?.filter(Boolean) : undefined,
      required: true,
    };
  });
}

function takeSentences(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trim()}…`;
}

function defaultFaq(blueprint: Record<string, unknown>): FaqItem[] {
  const purpose = String(blueprint.purpose ?? "");
  return [
    {
      question: "What do I get from this asset?",
      answer: takeSentences(
        purpose ||
          "A structured assessment that turns your inputs into prioritized actions across traffic, conversion, and monetization.",
        420
      ),
    },
    {
      question: "Is this financial or legal advice?",
      answer:
        "No. Outputs are strategic and directional. Validate revenue assumptions with your own data, counsel, and accounting partners.",
    },
    {
      question: "How should I use the results?",
      answer:
        "Use the score and cards as a prioritization lens: ship the top recommendation first, then re-run after you collect real baseline metrics.",
    },
    {
      question: "Will this replace my analytics stack?",
      answer:
        "It complements analytics by translating inputs into a concise narrative and next steps — not a replacement for product analytics.",
    },
    {
      question: "Can I embed this on my site?",
      answer:
        "Yes — generate the embeddable widget from your dashboard when platform publishing is enabled for your workspace.",
    },
    {
      question: "How often should I revisit the plan?",
      answer:
        "Re-run when positioning, offer, or acquisition channel mix changes — typically monthly for growth teams.",
    },
  ];
}

/**
 * Maps an existing blueprint JSON (AI strategy output) into a render spec.
 * No raw HTML in the blueprint is trusted — only strings become copy.
 */
export function deriveToolRenderSpec(blueprint: Record<string, unknown>): ToolRenderSpec {
  const title = String(blueprint.title ?? "AI Business Asset");
  const category = String(blueprint.category ?? "Business Asset");
  const description = String(blueprint.description ?? "");
  const purpose = String(blueprint.purpose ?? description);

  const bullets = [
    String(blueprint.market_opportunity ?? "").slice(0, 220),
    String(blueprint.traffic_acquisition_strategy ?? "").slice(0, 220),
    String(blueprint.monetization_strategy ?? "").slice(0, 220),
  ].filter((s) => s.trim().length > 12);

  const pain = Array.isArray(blueprint.audience_pain_points)
    ? (blueprint.audience_pain_points as unknown[]).slice(0, 3).map((x) => String(x))
    : [];

  const signalCards: InsightCard[] = pain.map((p, i) => ({
    eyebrow: i === 0 ? "Audience" : i === 1 ? "Pressure" : "Constraint",
    title: `Pain signal ${i + 1}`,
    body: takeSentences(p, 320),
  }));

  while (signalCards.length < 3) {
    const filler =
      signalCards.length === 0
        ? String(blueprint.seo_opportunity ?? "")
        : signalCards.length === 1
          ? String(blueprint.competitor_advantage ?? "")
          : String(blueprint.authority_positioning ?? blueprint.purpose ?? "");
    signalCards.push({
      eyebrow: "Opportunity",
      title: `Market signal ${signalCards.length + 1}`,
      body: takeSentences(filler || purpose, 320),
    });
  }

  const strategySeeds = Array.isArray(blueprint.monetization_roadmap)
    ? (blueprint.monetization_roadmap as unknown[]).slice(0, 3).map((x) => String(x))
    : [];

  const strategyCards = strategySeeds.map((s, i) => ({
    eyebrow: "Roadmap",
    title: `Phase ${i + 1}`,
    body: takeSentences(s, 300),
  }));

  if (strategyCards.length < 2) {
    strategyCards.push(
      {
        eyebrow: "Execution",
        title: "Next best actions",
        body: takeSentences(String(blueprint.conversion_psychology ?? ""), 320),
      },
      {
        eyebrow: "Authority",
        title: "Trust and proof",
        body: takeSentences(String(blueprint.authority_positioning ?? ""), 320),
      }
    );
  }

  const eeat = Array.isArray(blueprint.eeat_structure)
    ? (blueprint.eeat_structure as unknown[]).slice(0, 3).map((x) => String(x))
    : [];

  const monetizationCards = eeat.map((line, i) => ({
    eyebrow: "EEAT",
    title: `Trust layer ${i + 1}`,
    body: takeSentences(line, 280),
  }));

  if (monetizationCards.length < 2) {
    monetizationCards.push({
      eyebrow: "Monetization",
      title: "Revenue pathways",
      body: takeSentences(String(blueprint.monetization_strategy ?? ""), 320),
    });
  }

  const roadmapSteps = Array.isArray(blueprint.monetization_roadmap)
    ? (blueprint.monetization_roadmap as unknown[]).slice(0, 4).map((x) => String(x))
    : [
        "Capture demand with a crisp promise and one primary CTA",
        "Instrument the first conversion step and remove friction",
        "Introduce a premium upsell aligned to the insight",
        "Iterate weekly using real traffic and lead data",
      ];

  const testimonialQuotes = [
    {
      quote:
        "We finally shipped a buyer-intent asset that actually matches how we sell — not another generic landing template.",
      name: "Jordan M.",
      role: "Growth lead, B2B SaaS",
    },
    {
      quote:
        "The assessment flow feels like a real product. Prospects treat the output as serious, not a toy calculator.",
      name: "Priya K.",
      role: "Founder, services firm",
    },
    {
      quote:
        "Clean narrative + next steps. Our content team stopped debating structure and started publishing.",
      name: "Alex R.",
      role: "Head of content",
    },
  ];

  const base: ToolRenderSpec = {
    version: 1,
    themeKey: resolveThemeKey(blueprint),
    brandLine: category,
    heroEyebrow: String(blueprint.tool_type ?? "AI business asset"),
    heroTitle: title,
    heroLead: takeSentences(purpose, 360),
    trustStrip: ["Lumen Labs", "Northwave", "Atlas Foundry", "Silverline Studio"],
    formFields: normalizeFields(blueprint),
    submitCta: String(blueprint.cta_text ?? "Generate my opportunity report"),
    engineId: pickEngine(blueprint),
    positioningBullets: bullets.length ? bullets : [takeSentences(purpose, 200)],
    signalCards: signalCards.slice(0, 6),
    strategyCards: strategyCards.slice(0, 6),
    monetizationCards: monetizationCards.slice(0, 4),
    roadmapSteps,
    testimonialQuotes,
    faq: defaultFaq(blueprint),
    footerNote: takeSentences(String(blueprint.seo_description ?? description), 200),
  };
  const kw0 =
    Array.isArray(blueprint.target_keywords) && blueprint.target_keywords.length > 0
      ? String((blueprint.target_keywords as unknown[])[0])
      : undefined;
  const nicheHint = String(blueprint.category ?? "");
  return mergeCopyIntoSpec(base, buildCopyPack(blueprint, kw0, nicheHint));
}
