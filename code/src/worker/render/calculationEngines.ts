import type { CalculationEngineId, EngineResult, InsightCard } from "./types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function payload(values: Record<string, string>): string {
  return Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${(v || "").trim()}`)
    .join("|");
}

function nums(values: Record<string, string>): number[] {
  const out: number[] = [];
  for (const v of Object.values(values)) {
    const m = String(v).match(/-?\d+(?:\.\d+)?/g);
    if (m) for (const x of m) out.push(parseFloat(x));
  }
  return out;
}

function det(seed: string, i: number): number {
  return (hashString(`${seed}:${i}`) % 10000) / 10000;
}

function insightsFor(
  engine: string,
  lines: [string, string, string][]
): InsightCard[] {
  return lines.map(([eyebrow, title, body]) => ({
    eyebrow,
    title,
    body: `${body} (${engine} model)`,
  }));
}

/** Core numeric spine shared by engines — deterministic from inputs + engine id. */
export function engineSeed(engineId: string, values: Record<string, string>): number {
  return hashString(`${engineId}::${payload(values)}`);
}

/** Net referring-domain momentum (distinct from generic “links/mo”). */
export function runBacklinkVelocity(engineId: string, values: Record<string, string>): EngineResult {
  const n = nums(values);
  const seed = engineSeed(engineId, values);
  const sum = n.reduce((a, b) => a + b, 0) || (seed % 140) + 18;
  const newRd = clamp(Math.round(Math.sqrt(Math.max(1, sum)) * 2.8 + (seed % 9)), 2, 52);
  const momentum = clamp(20 + (seed % 58), 14, 96);
  const risk = clamp(4 + (seed % 14), 3, 32);
  return {
    score: clamp(54 + (seed % 38), 52, 94),
    metrics: [
      { label: "Net new RD / mo", value: String(newRd), hint: "Sustainable acquisition pace from inputs." },
      { label: "Authority momentum", value: `${momentum}%`, hint: "Modeled compounding vs baseline." },
      { label: "Toxic / spam risk", value: `${risk}%`, hint: "Keep velocity aligned with niche norms." },
    ],
    insights: insightsFor("Backlink velocity", [
      ["Quality", "DR + relevance", "Prefer fewer high-trust RDs over bulk low-trust mentions."],
      ["Cadence", "Smooth ramp", "Avoid spikes that look unnatural to crawlers."],
      ["Assets", "Earned links", "Data studies and tools attract citations at scale."],
    ]),
  };
}

export function runLinkVelocity(engineId: string, values: Record<string, string>): EngineResult {
  const n = nums(values);
  const seed = engineSeed(engineId, values);
  const sum = n.reduce((a, b) => a + b, 0) || (seed % 180) + 24;
  const velocity = clamp(Math.round(sum * 0.35 + (seed % 22)), 6, 96);
  const dr = clamp(18 + (seed % 52), 20, 88);
  const gap = clamp(4 + (seed % 18), 3, 40);
  return {
    score: clamp(55 + (seed % 36), 52, 94),
    metrics: [
      { label: "Target new links / mo", value: String(velocity), hint: "From velocity + cadence inputs." },
      { label: "DR lift potential", value: `${dr}%`, hint: "Modeled authority compounding window." },
      { label: "Gap vs competitors", value: `${gap} refs`, hint: "Estimated referring domain gap." },
    ],
    insights: insightsFor("Link velocity", [
      ["Cadence", "Publishing rhythm", "Batch outreach weekly; stagger anchors to avoid footprint spikes."],
      ["Relevance", "Topical fit", "Prioritize same-cluster links before broad DR stacking."],
      ["Risk", "Sustainability", "Keep velocity under natural acquisition curve for the niche."],
    ]),
  };
}

export function runOutreachProjection(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const vol = clamp(Math.round((n[0] || seed % 400 + 80) * 1.2), 40, 800);
  const reply = clamp(8 + (seed % 14), 6, 28);
  const booked = clamp(1 + Math.floor((seed % 17) / 6), 1, 12);
  return {
    score: clamp(52 + (seed % 40), 50, 93),
    metrics: [
      { label: "Weekly touches", value: String(vol), hint: "Emails/DMs modeled from capacity inputs." },
      { label: "Reply rate", value: `${reply}%`, hint: "Conservative benchmark for cold outreach." },
      { label: "Meetings / month", value: String(booked), hint: "From reply → booked conversion ladder." },
    ],
    insights: insightsFor("Outreach", [
      ["Sequence", "Multi-touch", "Use 5–7 touches with value-first openers before any ask."],
      ["ICP", "Tight fit", "Shrink list size; increase relevance to lift reply quality."],
      ["Offer", "Clear next step", "One CTA: audit, teardown, or scorecard — not three."],
    ]),
  };
}

export function runSeoGrowthForecast(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const sessions = clamp(Math.round((n[0] || seed % 9000 + 2000) * 3.4), 2500, 220000);
  const ctr = clamp(2.2 + det(payload(values), 1) * 6, 1.5, 18);
  const pos = clamp(4 + (seed % 12), 3, 18);
  return {
    score: clamp(58 + (seed % 34), 54, 95),
    metrics: [
      { label: "12-mo sessions", value: sessions.toLocaleString("en-US"), hint: "Compounded from baseline + content velocity." },
      { label: "CTR lift", value: `${ctr.toFixed(1)}%`, hint: "Snippet + title optimization runway." },
      { label: "New page positions", value: String(pos), hint: "Incremental topical clusters to ship." },
    ],
    insights: insightsFor("SEO growth", [
      ["Clusters", "Topical depth", "Ship 3–5 supporting pages per pillar before chasing new pillars."],
      ["Intent", "Commercial pages", "Route money keywords to assets with proof + CTA above fold."],
      ["Measurement", "Leading signals", "Track impressions → clicks weekly; not only rankings."],
    ]),
  };
}

export function runTrafficOpportunity(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const demand = clamp(Math.round((n[0] || seed % 5000 + 1200) * 2.1), 800, 95000);
  const gap = clamp(12 + (seed % 55), 10, 92);
  const share = clamp(3 + (seed % 22), 2, 35);
  return {
    score: clamp(56 + (seed % 38), 52, 96),
    metrics: [
      { label: "Addressable demand", value: demand.toLocaleString("en-US"), hint: "Monthly search demand proxy." },
      { label: "SERP gap score", value: `${gap}%`, hint: "Weak competitor pages you can out-execute." },
      { label: "Share of clicks", value: `${share}%`, hint: "Attainable share with strong asset + distribution." },
    ],
    insights: insightsFor("Traffic", [
      ["Demand", "Intent mix", "Balance informational capture with commercial landing paths."],
      ["Distribution", "Amplification", "Pair SEO with newsletter + partner syndication for velocity."],
      ["Retention", "Return visits", "Add utility so users bookmark the asset."],
    ]),
  };
}

export function runLeadValueEstimator(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const acv = n[0] || 800 + (seed % 4200);
  const rate = clamp(1.2 + det(payload(values), 2) * 4.5, 0.8, 9);
  const leads = clamp(Math.round((n[1] || seed % 80 + 20) * 1.4), 12, 900);
  const value = Math.round((leads * rate / 100) * acv);
  return {
    score: clamp(54 + (seed % 40), 50, 94),
    metrics: [
      { label: "Qualified leads / mo", value: String(leads), hint: "From funnel inputs + conversion assumptions." },
      { label: "Win rate", value: `${rate.toFixed(1)}%`, hint: "Benchmark for SQL → customer." },
      { label: "Pipeline value", value: `$${value.toLocaleString("en-US")}`, hint: "Directional ARR contribution." },
    ],
    insights: insightsFor("Lead value", [
      ["Qualification", "Tighter ICP", "Raise lead quality before spend — improves win rate faster than volume."],
      ["Velocity", "Speed to call", "Sub-5 min response on hot leads materially lifts close rates."],
      ["Offer", "Ladder design", "Start with diagnostic; upsell implementation."],
    ]),
  };
}

export function runConversionProjection(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const cvr = clamp(1.5 + det(payload(values), 3) * 7, 0.9, 22);
  const lift = clamp(8 + (seed % 35), 5, 120);
  const aov = n[0] || 120 + (seed % 400);
  return {
    score: clamp(57 + (seed % 36), 53, 95),
    metrics: [
      { label: "Baseline CVR", value: `${cvr.toFixed(2)}%`, hint: "From funnel step inputs." },
      { label: "Lift potential", value: `+${lift}%`, hint: "From UX + offer clarity improvements." },
      { label: "Revenue / 1k visits", value: `$${Math.round((cvr / 100) * (1 + lift / 100) * aov * 10)}`, hint: "Rough incremental revenue sensitivity." },
    ],
    insights: insightsFor("Conversion", [
      ["Friction", "Form design", "Reduce fields; add progressive profiling after first yes."],
      ["Proof", "Trust stack", "Logos, methodology, and outcome bullets above the fold."],
      ["Offer", "Risk reversal", "Guarantee or pilot beats generic CTAs."],
    ]),
  };
}

function acvProxy(seed: number): number {
  return 600 + (seed % 3400);
}

export function runMonetizationForecast(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const mrr = Math.round((n[0] || seed % 900 + 200) * (1.1 + det(payload(values), 4)));
  const attach = clamp(15 + (seed % 55), 12, 94);
  const ltv = Math.round((n[1] || acvProxy(seed)) * 1.8);
  return {
    score: clamp(55 + (seed % 38), 52, 93),
    metrics: [
      { label: "MRR upside", value: `$${mrr.toLocaleString("en-US")}`, hint: "From attach rate × ACV assumptions." },
      { label: "Attach rate", value: `${attach}%`, hint: "Cross-sell potential on core asset." },
      { label: "LTV horizon", value: `$${ltv.toLocaleString("en-US")}`, hint: "24–36 month simplified LTV proxy." },
    ],
    insights: insightsFor("Monetization", [
      ["Packaging", "Tier ladder", "Good / better / best with clear value delta."],
      ["Pricing", "Anchoring", "Show annual math; default to annual on checkout."],
      ["Partners", "Distribution", "Affiliate + creator rev-share where intent is high."],
    ]),
  };
}

export function runAuthorityGrowth(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const score = clamp(52 + (seed % 42), 50, 94);
  const citations = clamp(3 + (seed % 28), 2, 80);
  const mentions = clamp(8 + (seed % 120), 5, 400);
  return {
    score,
    metrics: [
      { label: "EEAT score", value: String(score), hint: "Composite from expertise signals in inputs." },
      { label: "Citations / quarter", value: String(citations), hint: "PR + digital PR cadence model." },
      { label: "Brand mentions", value: String(mentions), hint: "Social + community + partner surfaces." },
    ],
    insights: insightsFor("Authority", [
      ["Proof", "Evidence layer", "Publish methodology, benchmarks, and first-party data."],
      ["People", "Faces", "Named operators beat anonymous brand voice for trust."],
      ["Distribution", "Earned media", "Guest assets on high-trust domains."],
    ]),
  };
}

export function runRoiProjection(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const invest = n[0] || 5000 + (seed % 25000);
  const gain = Math.round(invest * (1.15 + det(payload(values), 5) * 2.2));
  const months = clamp(3 + (seed % 14), 3, 24);
  return {
    score: clamp(56 + (seed % 38), 52, 96),
    metrics: [
      { label: "Investment", value: `$${invest.toLocaleString("en-US")}`, hint: "Time + media + tooling." },
      { label: "12-mo return", value: `$${gain.toLocaleString("en-US")}`, hint: "Directional upside band." },
      { label: "Payback", value: `${months} mo`, hint: "Months to break even on modeled cash." },
    ],
    insights: insightsFor("ROI", [
      ["Baseline", "Truth in inputs", "Re-run with real CAC/LTV when available."],
      ["Sensitivity", "Levers", "Conversion and attach move ROI faster than traffic alone."],
      ["Risk", "Ranges", "Treat outputs as scenarios, not promises."],
    ]),
  };
}

export function runClientAcquisition(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const sql = clamp(Math.round((n[0] || seed % 40 + 8) * 1.6), 5, 220);
  const cac = Math.max(120, Math.round(8000 / (sql + 1) + (seed % 900)));
  const payback = clamp(2 + (seed % 9), 2, 18);
  return {
    score: clamp(54 + (seed % 40), 50, 95),
    metrics: [
      { label: "SQLs / mo", value: String(sql), hint: "From pipeline + outbound capacity." },
      { label: "CAC", value: `$${cac.toLocaleString("en-US")}`, hint: "Simplified acquisition cost proxy." },
      { label: "Payback", value: `${payback} mo`, hint: "Months to recover CAC at modeled ACV." },
    ],
    insights: insightsFor("Client acquisition", [
      ["Channel", "Focus", "One primary channel until repeatable weekly wins."],
      ["Offer", "Entry product", "Productized audit lowers sales cycle."],
      ["Ops", "SLA", "Speed and follow-up discipline beat clever copy."],
    ]),
  };
}

export function runContentVelocity(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const pieces = clamp(Math.round((n[0] || seed % 8 + 2) * 2.4), 2, 48);
  const words = pieces * (900 + (seed % 400));
  const comp = clamp(22 + (seed % 50), 18, 95);
  return {
    score: clamp(55 + (seed % 38), 52, 94),
    metrics: [
      { label: "Ship rate", value: `${pieces}/mo`, hint: "Long-form + updates from team capacity." },
      { label: "Words / mo", value: words.toLocaleString("en-US"), hint: "Editorial throughput model." },
      { label: "Compounding", value: `${comp}%`, hint: "Internal link + refresh lift on existing pages." },
    ],
    insights: insightsFor("Content velocity", [
      ["System", "Templates", "Brief → outline → draft checklists reduce rework."],
      ["Refresh", "Winners", "Update top pages quarterly to defend rankings."],
      ["Distribution", "Every publish", "Newsletter + social atomization on ship day."],
    ]),
  };
}

/** Paid / lifecycle campaign economics — deterministic ROAS-style view. */
export function runCampaignProfitability(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const spend = Math.round(n[0] || 2500 + (seed % 18000));
  const roas = clamp(1.35 + det(payload(values), 8) * 2.85, 1.1, 6.2);
  const revenue = Math.round(spend * roas);
  const margin = Math.round(revenue * clamp(0.22 + det(payload(values), 9) * 0.35, 0.18, 0.48));
  return {
    score: clamp(56 + (seed % 36), 54, 95),
    metrics: [
      { label: "12-week spend", value: `$${spend.toLocaleString("en-US")}`, hint: "Media + creative + tooling envelope." },
      { label: "Modeled return", value: `$${revenue.toLocaleString("en-US")}`, hint: `ROAS ×${roas.toFixed(2)} vs spend (directional).` },
      { label: "Contribution (est.)", value: `$${margin.toLocaleString("en-US")}`, hint: "After variable costs — not net profit." },
    ],
    insights: insightsFor("Campaign economics", [
      ["Creative", "Fatigue curve", "Refresh hooks every 2–3 weeks on paid social."],
      ["Measurement", "Incrementality", "Hold out geo or time cells when scaling."],
      ["Offer", "Unit economics", "If CAC rises, tighten ICP before increasing spend."],
    ]),
  };
}

export function runBacklinkGap(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const n = nums(values);
  const you = n[0] || 40 + (seed % 180);
  const them = n[1] || you + 20 + (seed % 220);
  const gap = Math.max(0, them - you);
  return {
    score: clamp(53 + (seed % 40), 50, 93),
    metrics: [
      { label: "Your RDs", value: String(Math.round(you)), hint: "Referring domains baseline." },
      { label: "Competitor RDs", value: String(Math.round(them)), hint: "Benchmark competitor." },
      { label: "Gap to close", value: String(Math.round(gap)), hint: "Acquisition workstack estimate." },
    ],
    insights: insightsFor("Backlink gap", [
      ["Tactics", "HARO + PR", "Digital PR for linkable assets beats spray directories."],
      ["Assets", "Link magnets", "Original data + tools earn citations."],
      ["Velocity", "Sustainable", "Target steady monthly DR growth vs spikes."],
    ]),
  };
}

export function runWeightedInputs(engineId: string, values: Record<string, string>): EngineResult {
  const seed = engineSeed(engineId, values);
  const score = clamp(58 + (seed % 36), 56, 94);
  return {
    score,
    metrics: [
      { label: "Opportunity index", value: String(score), hint: "Weighted blend across all inputs." },
      { label: "Execution readiness", value: `${clamp(52 + Math.floor(det(payload(values), 6) * 40), 45, 92)}%`, hint: "Input completeness." },
      { label: "Monetization leverage", value: `${clamp(48 + Math.floor(det(payload(values), 7) * 44), 40, 94)}%`, hint: "Offer-market fit headroom." },
    ],
    insights: insightsFor("Composite", [
      ["Strategy", "Prioritize", "Pick one wedge: traffic, conversion, or monetization per quarter."],
      ["Evidence", "Instrument", "Track one north-star metric weekly."],
      ["Next step", "Ship", "Smallest publishable improvement in 7 days."],
    ]),
  };
}

const ROUTE: Record<
  CalculationEngineId,
  (engineId: string, values: Record<string, string>) => EngineResult
> = {
  linkVelocity: runLinkVelocity,
  backlinkVelocity: runBacklinkVelocity,
  outreachProjection: runOutreachProjection,
  seoGrowthForecast: runSeoGrowthForecast,
  trafficOpportunity: runTrafficOpportunity,
  leadValueEstimator: runLeadValueEstimator,
  leadValueProjection: runLeadValueEstimator,
  conversionProjection: runConversionProjection,
  conversionEstimator: runConversionProjection,
  monetizationForecast: runMonetizationForecast,
  authorityGrowth: runAuthorityGrowth,
  roiProjection: runRoiProjection,
  roiForecast: runRoiProjection,
  clientAcquisition: runClientAcquisition,
  contentVelocity: runContentVelocity,
  backlinkGap: runBacklinkGap,
  campaignProfitability: runCampaignProfitability,
  weightedInputs: runWeightedInputs,
  growthForecast: runSeoGrowthForecast,
  conversionLift: runConversionProjection,
  leadValue: runLeadValueEstimator,
  outreachEstimator: runOutreachProjection,
};

/** All engine ids accepted by `runEngineById` (for validation). */
export const ALL_CALCULATION_ENGINE_IDS = Object.keys(ROUTE) as CalculationEngineId[];

export function runEngineById(
  engineId: CalculationEngineId,
  values: Record<string, string>
): EngineResult {
  const runner = ROUTE[engineId] ?? runWeightedInputs;
  return runner(engineId, values);
}
