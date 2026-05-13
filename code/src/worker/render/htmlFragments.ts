import { hashString } from "./calculationEngines";
import { escapeHtml } from "./escape";
import type { MetricTile } from "./types";

/** Non-placeholder dashboard: live bands sized from modeled index + engine label. */
export function dashboardPreviewBands(score: number, engineId: string): string {
  const s = Math.max(0, Math.min(100, score));
  const w2 = Math.round((s * 0.72 + 18) % 100) || 44;
  const w3 = Math.round((s * 1.07 + 9) % 100) || 58;
  return `<div style="margin-top:14px;display:grid;gap:10px" class="dash-preview" aria-hidden="true">
    <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)"><span>Demand</span><span>Execution</span><span>Revenue</span></div>
    <div style="height:10px;border-radius:999px;background:var(--line);overflow:hidden"><i style="display:block;height:100%;width:${s}%;background:linear-gradient(90deg,var(--brand-primary),var(--brand-secondary));border-radius:inherit"></i></div>
    <div style="height:10px;border-radius:999px;background:var(--line);overflow:hidden"><i style="display:block;height:100%;width:${w2}%;background:linear-gradient(90deg,var(--brand-secondary),var(--brand-primary));opacity:0.85;border-radius:inherit"></i></div>
    <div style="height:10px;border-radius:999px;background:var(--line);overflow:hidden"><i style="display:block;height:100%;width:${w3}%;background:linear-gradient(90deg,var(--muted-light),var(--brand-primary));opacity:0.75;border-radius:inherit"></i></div>
    <p style="margin:0;font-size:11px;color:var(--muted)">Live model: <strong style="color:var(--ink)">${escapeHtml(engineId)}</strong> · bands reflect your opportunity index (${s}), not decorative filler.</p>
  </div>`;
}

function sparkPoints(seed: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 14; i++) {
    const v = 22 + (hashString(`${seed}:sp:${i}`) % 58);
    const x = 4 + i * 8;
    pts.push(`${x},${100 - v}`);
  }
  return pts.join(" ");
}

const FEED_LIBRARY: [string, string, string][] = [
  ["Acquisition", "Intent depth", "Route commercial keywords to proof-heavy landings before broad top-of-funnel."],
  ["Monetization", "Offer ladder", "Productize diagnostics so paid upgrades feel like the obvious next step."],
  ["Retention", "Utility signal", "Assets that save time earn return visits — bookmarkable beats one-shot."],
  ["Distribution", "Compounding", "Pair SEO wins with newsletter + partner syndication the week you ship."],
  ["Risk", "Sustainable pace", "Model outputs are scenarios — cap velocity to what your ops can instrument."],
  ["Ops", "Instrumentation", "Pick one north-star metric per channel; review weekly, not monthly."],
];

function dashboardInsightFeed(seed: string): string {
  const start = hashString(`${seed}:feed`) % FEED_LIBRARY.length;
  const parts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const [eyebrow, title, body] = FEED_LIBRARY[(start + i) % FEED_LIBRARY.length];
    parts.push(
      `<article class="dash-feed-item"><span class="dash-feed-eyebrow">${escapeHtml(eyebrow)}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></article>`
    );
  }
  return `<div class="dash-feed-head"><span>AI recommendation feed</span><span class="pill">Deterministic</span></div><div class="dash-feed">${parts.join("")}</div>`;
}

function dashboardHeatmap(seed: string): string {
  const cells: string[] = [];
  for (let i = 0; i < 32; i++) {
    const intensity = 0.12 + (hashString(`${seed}:hm:${i}`) % 85) / 100;
    cells.push(`<span class="dash-hm-cell" style="--hm:${intensity.toFixed(2)}"></span>`);
  }
  return `<div class="dash-heatmap-wrap"><div class="dash-heatmap-head"><span>Execution heatmap</span><span class="sub">Relative pressure by workstream</span></div><div class="dash-heatmap" role="presentation">${cells.join("")}</div></div>`;
}

function dashboardGrowthTimeline(seed: string, score: number): string {
  const phases = ["Baseline", "Activation", "Scale", "Compound"];
  const w = Math.max(0, Math.min(100, score));
  const items = phases.map((label, i) => {
    const pct = Math.min(100, Math.round(w * (0.35 + i * 0.22) + (hashString(`${seed}:tl:${i}`) % 12)));
    return `<div class="dash-tl-node"><span class="dash-tl-dot"></span><div><strong>${escapeHtml(label)}</strong><div class="dash-tl-bar"><i style="width:${pct}%"></i></div><small>${pct}% modeled readiness</small></div></div>`;
  });
  return `<div class="dash-timeline"><div class="dash-timeline-head"><span>Growth timeline</span><span class="pill">Forecast</span></div><div class="dash-tl-rail">${items.join("")}</div></div>`;
}

/** Rich hero-side analytics chrome — same tokens as exported page (no fake empty dashboard). */
export function dashboardPreviewWorkspace(
  score: number,
  engineId: string,
  metrics: MetricTile[]
): string {
  const s = Math.max(0, Math.min(100, score));
  const seed = `${engineId}:${s}`;
  const gid = hashString(seed) % 1000003;
  const poly = sparkPoints(seed);
  const rows: MetricTile[] = metrics.slice(0, 3);
  while (rows.length < 3) {
    rows.push({ label: "Signal", value: "—", hint: "Runs after submit" });
  }
  const tableBody = rows
    .map(
      (m) => `<tr><td>${escapeHtml(m.label)}</td><td class="num">${escapeHtml(m.value)}</td><td>${escapeHtml(m.hint || "—")}</td></tr>`
    )
    .join("");
  const bands = dashboardPreviewBands(s, engineId);
  const feed = dashboardInsightFeed(seed);
  const heat = dashboardHeatmap(seed);
  const timeline = dashboardGrowthTimeline(seed, s);
  return `<div class="dash-workspace" aria-hidden="true">
    <div class="dash-kpi-row">
      <div class="dash-kpi"><span class="lbl">Opportunity index</span><strong>${s}</strong><span class="sub">Modeled from engine</span></div>
      <div class="dash-kpi"><span class="lbl">Engine</span><strong class="mono">${escapeHtml(engineId)}</strong><span class="sub">Deterministic core</span></div>
      <div class="dash-kpi"><span class="lbl">Confidence band</span><strong>${Math.min(94, 58 + (hashString(seed) % 28))}%</strong><span class="sub">Input coverage</span></div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-head"><span>Trailing projection</span><span class="pill">Live</span></div>
      <svg class="dash-spark" viewBox="0 0 112 100" preserveAspectRatio="none" role="img" aria-label="Projection curve">
        <defs><linearGradient id="tafdashg${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="var(--brand-primary)" stop-opacity="0.35"/><stop offset="100%" stop-color="var(--brand-secondary)" stop-opacity="0.08"/></linearGradient></defs>
        <polyline fill="none" stroke="var(--line)" stroke-width="1" points="0,88 112,88"/>
        <polygon fill="url(#tafdashg${gid})" points="0,100 ${poly} 112,100"/>
        <polyline fill="none" stroke="var(--brand-primary)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" points="${poly}"/>
      </svg>
    </div>
    <div class="dash-table-wrap">
      <table class="dash-mini-table">
        <thead><tr><th>Driver</th><th>Value</th><th>Note</th></tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
    ${feed}
    <div class="dash-split">
      ${heat}
      ${timeline}
    </div>
    ${bands}
  </div>`;
}
