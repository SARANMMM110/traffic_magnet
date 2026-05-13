/**
 * Structured output for the platform render engine.
 * AI / blueprint supplies copy + field config; layout + JS are platform-owned.
 */
export type FormFieldType = "text" | "select" | "textarea";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  help?: string;
  options?: string[];
  required?: boolean;
}

export type CalculationEngineId =
  | "linkVelocity"
  | "backlinkVelocity"
  | "outreachProjection"
  | "seoGrowthForecast"
  | "trafficOpportunity"
  | "leadValueEstimator"
  | "leadValueProjection"
  | "conversionProjection"
  | "conversionEstimator"
  | "monetizationForecast"
  | "authorityGrowth"
  | "roiProjection"
  | "roiForecast"
  | "clientAcquisition"
  | "contentVelocity"
  | "backlinkGap"
  | "campaignProfitability"
  | "weightedInputs"
  | "growthForecast"
  | "conversionLift"
  | "leadValue"
  | "outreachEstimator";

export interface MetricTile {
  label: string;
  value: string;
  hint?: string;
}

export interface InsightCard {
  eyebrow: string;
  title: string;
  body: string;
}

export interface EngineResult {
  score: number;
  metrics: MetricTile[];
  insights: InsightCard[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** JSON shape returned by `/api/content-wrapper/generate` (matches react-app ContentPackage). */
export interface ContentWrapperPackage {
  page_h1: string;
  introduction: string;
  how_it_works: { step_number: number; title: string; description: string }[];
  key_benefits: string[];
  semantic_keywords: string[];
  faq_section: { question: string; answer: string }[];
  meta_title: string;
  meta_description: string;
  cta_block: string | null;
}

export interface ToolRenderSpec {
  version: 1;
  themeKey: string;
  brandLine: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLead: string;
  trustStrip: string[];
  formFields: FormField[];
  submitCta: string;
  engineId: CalculationEngineId;
  /** Strategic copy blocks (from blueprint — never raw HTML). */
  positioningBullets: string[];
  signalCards: InsightCard[];
  strategyCards: InsightCard[];
  monetizationCards: InsightCard[];
  roadmapSteps: string[];
  testimonialQuotes: { quote: string; name: string; role: string }[];
  faq: FaqItem[];
  footerNote: string;
}
