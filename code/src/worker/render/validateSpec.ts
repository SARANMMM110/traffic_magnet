import { ALL_CALCULATION_ENGINE_IDS } from "./calculationEngines";
import type { ToolRenderSpec } from "./types";

const MAX_FIELDS = 8;
const MAX_TRUST = 12;
const MAX_FAQ = 10;
const MAX_TESTIMONIALS = 6;
const MAX_STRATEGY = 8;
const MAX_SIGNAL = 8;
const MAX_MONET = 6;
const MAX_ROADMAP = 8;

const engineSet = new Set<string>(ALL_CALCULATION_ENGINE_IDS);

export function validateToolRenderSpec(spec: ToolRenderSpec): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (spec.version !== 1) errors.push("spec.version must be 1");
  if (!spec.heroTitle?.trim()) errors.push("heroTitle required");
  if (!spec.heroLead?.trim()) errors.push("heroLead required");
  if (spec.heroTitle.length > 120) errors.push("heroTitle max 120 characters");
  if (spec.heroLead.length > 560) errors.push("heroLead max 560 characters");
  if (spec.faq.length < 2) errors.push("at least 2 FAQ items required");
  if (spec.submitCta.length < 8) errors.push("submitCta should be at least 8 characters");
  if (!spec.formFields?.length) errors.push("at least one form field required");
  if (spec.formFields.length > MAX_FIELDS) errors.push(`max ${MAX_FIELDS} fields`);
  const ids = new Set<string>();
  for (const f of spec.formFields) {
    if (!f.id?.trim()) errors.push("field.id required");
    if (ids.has(f.id)) errors.push(`duplicate field id: ${f.id}`);
    ids.add(f.id);
    if (!f.label?.trim()) errors.push(`field ${f.id}: label required`);
    if (f.type === "select" && (!f.options || !f.options.length)) errors.push(`field ${f.id}: select needs options`);
  }
  if (!spec.engineId) errors.push("engineId required");
  else if (!engineSet.has(spec.engineId)) errors.push(`unknown engineId: ${spec.engineId}`);
  if (!spec.themeKey) errors.push("themeKey required");
  if (!spec.submitCta?.trim()) errors.push("submitCta required");
  if (spec.trustStrip.length > MAX_TRUST) errors.push(`trustStrip max ${MAX_TRUST} items`);
  if (spec.faq.length > MAX_FAQ) errors.push(`faq max ${MAX_FAQ} items`);
  if (spec.testimonialQuotes.length > MAX_TESTIMONIALS) errors.push(`testimonialQuotes max ${MAX_TESTIMONIALS}`);
  if (spec.strategyCards.length > MAX_STRATEGY) errors.push(`strategyCards max ${MAX_STRATEGY}`);
  if (spec.signalCards.length > MAX_SIGNAL) errors.push(`signalCards max ${MAX_SIGNAL}`);
  if (spec.monetizationCards.length > MAX_MONET) errors.push(`monetizationCards max ${MAX_MONET}`);
  if (spec.roadmapSteps.length > MAX_ROADMAP) errors.push(`roadmapSteps max ${MAX_ROADMAP}`);
  return errors.length ? { ok: false, errors } : { ok: true };
}
