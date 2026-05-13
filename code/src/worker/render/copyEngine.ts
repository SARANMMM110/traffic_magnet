import type { ToolRenderSpec } from "./types";

export interface CopyPack {
  emotionalHook: string;
  urgencyLine: string;
  transformation: string;
  authorityLine: string;
  leverageLine: string;
  ctaMicro: string;
}

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/** Deterministic conversion layer — no LLM; shapes blueprint prose into positioning. */
export function buildCopyPack(
  blueprint: Record<string, unknown>,
  keyword?: string,
  niche?: string
): CopyPack {
  const purpose = String(blueprint.purpose ?? "");
  const mono = String(blueprint.monetization_strategy ?? "");
  const conv = String(blueprint.conversion_psychology ?? "");
  const auth = String(blueprint.authority_positioning ?? "");
  const title = String(blueprint.title ?? "Your asset");
  const kw = (keyword ?? "").trim();
  const nc = (niche ?? "").trim();
  const market = kw && nc ? `${kw} in ${nc}` : kw || nc || "your market";

  return {
    emotionalHook: clip(
      purpose
        ? `If ${clip(purpose, 72)} is the bottleneck in ${market}, this asset compresses debate into a revenue-anchored plan.`
        : `${title} is built to turn attention in ${market} into qualified pipeline — not vanity engagement.`,
      230
    ),
    urgencyLine: clip(
      mono
        ? `Competitors compound weekly: ${clip(mono, 96)} Delaying execution widens the gap you pay to close later.`
        : "Every sprint without a prioritized acquisition asset leaks budget, rankings, and trust to faster operators.",
      210
    ),
    transformation: clip(
      conv
        ? `Commercial outcome in focus: ${clip(conv, 118)}`
        : "Shift from scattered experiments to a single prioritized stack your team can ship, measure, and compound.",
      230
    ),
    authorityLine: clip(
      auth || String(blueprint.competitor_advantage ?? ""),
      200
    ),
    leverageLine: clip(
      `Treat this as a board-level lens: prioritize the wedge that moves pipeline in ${market} this quarter — not a laundry list of tactics.`,
      200
    ),
    ctaMicro: clip(String(blueprint.cta_text ?? "Generate my opportunity report"), 120),
  };
}

export function mergeCopyIntoSpec(spec: ToolRenderSpec, copy: CopyPack): ToolRenderSpec {
  return {
    ...spec,
    heroLead: `${copy.emotionalHook} ${copy.transformation} ${spec.heroLead}`.replace(/\s+/g, " ").trim().slice(0, 520),
    positioningBullets: [
      copy.urgencyLine,
      copy.leverageLine,
      copy.authorityLine || spec.positioningBullets[0] || spec.heroLead,
      ...spec.positioningBullets,
    ].filter(Boolean).slice(0, 6),
  };
}
