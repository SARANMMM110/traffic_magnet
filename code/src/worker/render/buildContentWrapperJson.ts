import { buildCopyPack } from "./copyEngine";
import { deriveToolRenderSpec } from "./deriveSpec";
import { escapeHtml } from "./escape";
import { runCalculationEngine } from "./calculators";
import type { ContentWrapperPackage } from "./types";

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/**
 * Structured article + meta package (no LLM).
 * Introduction / FAQ answers use simple escaped <p> blocks only.
 */
export function buildContentWrapperJson(
  keyword: string,
  niche: string,
  blueprint: Record<string, unknown>,
  includeCta: boolean,
  _ctaType: string | null,
  ctaText: string | null,
  ctaUrl: string | null
): ContentWrapperPackage {
  const spec = deriveToolRenderSpec(blueprint);
  const copy = buildCopyPack(blueprint, keyword, niche);
  const title = String(blueprint.title ?? spec.heroTitle);
  const purpose = String(blueprint.purpose ?? "");

  const pageH1 = clip(`${keyword}: ${title} — ${spec.brandLine}`, 110);

  const demo = runCalculationEngine(spec.engineId, {});
  
  const kw = Array.isArray(blueprint.target_keywords)
    ? (blueprint.target_keywords as unknown[]).map((x) => String(x))
    : [];
  const semantic = Array.from(
    new Set([
      keyword,
      niche,
      title,
      ...kw,
      `${keyword} strategy`,
      `${keyword} monetization`,
      `${niche} lead generation`,
      "EEAT content",
      "conversion optimization",
    ])
  ).slice(0, 24);
  
  const chipRow = semantic
    .slice(0, 8)
    .map((k) => `<span class="cw-chip">${escapeHtml(k)}</span>`)
    .join("");
  const snapM0 = demo.metrics[0];
  const snapM1 = demo.metrics[1] ?? demo.metrics[0];

  const intro = `<p class="cw-intro"><strong>${escapeHtml(keyword)}</strong> in <em>${escapeHtml(niche)}</em> — ${escapeHtml(copy.emotionalHook)}</p>
<p>${escapeHtml(copy.transformation)}</p>
<p>${escapeHtml(clip(purpose, 420))}</p>
<p>${escapeHtml(copy.urgencyLine)}</p>
<section class="cw-editorial-band" aria-label="Opportunity snapshot">
  <div class="cw-snapshot-grid">
    <div class="cw-snap"><span class="cw-snap-lbl">Opportunity index</span><strong class="cw-snap-val">${demo.score}</strong><span class="cw-snap-hint">Platform model</span></div>
    <div class="cw-snap"><span class="cw-snap-lbl">Engine</span><strong class="cw-snap-val cw-mono">${escapeHtml(spec.engineId)}</strong><span class="cw-snap-hint">Deterministic</span></div>
    <div class="cw-snap"><span class="cw-snap-lbl">${escapeHtml(snapM0?.label ?? "Primary lever")}</span><strong class="cw-snap-val">${escapeHtml(snapM0?.value ?? "—")}</strong><span class="cw-snap-hint">${escapeHtml(clip(snapM0?.hint ?? snapM1?.hint ?? "", 80))}</span></div>
    <div class="cw-snap"><span class="cw-snap-lbl">${escapeHtml(snapM1?.label ?? "Secondary")}</span><strong class="cw-snap-val">${escapeHtml(snapM1?.value ?? "—")}</strong><span class="cw-snap-hint">Directional</span></div>
  </div>
  <div class="cw-chip-row" aria-label="Semantic coverage">${chipRow}</div>
  <p class="cw-leverage">${escapeHtml(clip(`Leverage framing: ${copy.authorityLine || "Position this asset as proof-backed utility, not a novelty widget."}`, 260))}</p>
</section>`;

  const steps = spec.roadmapSteps.slice(0, 5).map((desc, i) => ({
    step_number: i + 1,
    title: `Step ${i + 1}: execution focus`,
    description: clip(desc, 280),
  }));

  const feats = Array.isArray(blueprint.features)
    ? (blueprint.features as unknown[]).slice(0, 8).map((x) => clip(String(x), 220))
    : spec.positioningBullets.slice(0, 6);

  const faq_section = spec.faq.slice(0, 8).map((f) => ({
    question: f.question,
    answer: `<p>${escapeHtml(f.answer)}</p>`,
  }));

  const meta_title = clip(`${keyword} | ${title}`, 58);
  const meta_description = clip(
    `${copy.ctaMicro} ${copy.authorityLine || purpose}`.replace(/\s+/g, " "),
    155
  );

  let cta_block: string | null = null;
  if (includeCta && ctaUrl) {
    const label = escapeHtml(ctaText || copy.ctaMicro || "Get the asset");
    cta_block = `<section class="cw-cta"><a class="cw-cta-btn" href="${escapeHtml(ctaUrl)}">${label}</a><p>${escapeHtml(copy.ctaMicro)}</p></section>`;
  } else if (includeCta) {
    cta_block = `<section class="cw-cta"><p>${escapeHtml(copy.ctaMicro)}</p></section>`;
  }

  return {
    page_h1: pageH1,
    introduction: intro,
    how_it_works: steps,
    key_benefits: feats,
    semantic_keywords: semantic,
    faq_section,
    meta_title,
    meta_description,
    cta_block,
  };
}
