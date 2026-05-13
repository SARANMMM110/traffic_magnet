import type { ToolRenderSpec } from "./types";

const PALETTE: Record<
  string,
  { brand: string; brandHover: string; brandSoft: string; ink: string; muted: string; line: string; surface: string; dark: string }
> = {
  modern: {
    brand: "#4F46E5",
    brandHover: "#4338CA",
    brandSoft: "rgba(79, 70, 229, 0.12)",
    ink: "#0f172a",
    muted: "#64748b",
    line: "#e2e8f0",
    surface: "#ffffff",
    dark: "#0b1220",
  },
  ocean: {
    brand: "#0EA5E9",
    brandHover: "#0284C7",
    brandSoft: "rgba(14, 165, 233, 0.12)",
    ink: "#0c4a6e",
    muted: "#0369a1",
    line: "#bae6fd",
    surface: "#f8fafc",
    dark: "#082f49",
  },
  forest: {
    brand: "#059669",
    brandHover: "#047857",
    brandSoft: "rgba(5, 150, 105, 0.12)",
    ink: "#14532d",
    muted: "#166534",
    line: "#bbf7d0",
    surface: "#fafaf9",
    dark: "#052e16",
  },
  sunset: {
    brand: "#ea580c",
    brandHover: "#c2410c",
    brandSoft: "rgba(234, 88, 12, 0.12)",
    ink: "#1c1917",
    muted: "#57534e",
    line: "#fed7aa",
    surface: "#fffbeb",
    dark: "#431407",
  },
  purple: {
    brand: "#7c3aed",
    brandHover: "#6d28d9",
    brandSoft: "rgba(124, 58, 237, 0.12)",
    ink: "#1e1b4b",
    muted: "#5b21b6",
    line: "#ede9fe",
    surface: "#faf5ff",
    dark: "#1e0a3a",
  },
  slate: {
    brand: "#334155",
    brandHover: "#1e293b",
    brandSoft: "rgba(51, 65, 85, 0.12)",
    ink: "#0f172a",
    muted: "#475569",
    line: "#e2e8f0",
    surface: "#ffffff",
    dark: "#0f172a",
  },
};

export function themeRootVariables(themeKey: string): string {
  const p = PALETTE[themeKey] ?? PALETTE.modern;
  return `:root{
--brand-primary:${p.brand};
--brand-primary-hover:${p.brandHover};
--brand-primary-soft:${p.brandSoft};
--brand-secondary:${p.brandHover};
--brand-accent:${p.brand};
--surface:${p.surface};
--surface-soft:#f8fafc;
--surface-strong:#f1f5f9;
--surface-dark:${p.dark};
--ink:${p.ink};
--ink-soft:#334155;
--muted:${p.muted};
--muted-light:#94a3b8;
--line:${p.line};
--line-soft:#f1f5f9;
--line-dark:#cbd5e1;
--shadow-sm:0 1px 2px rgba(15,23,42,0.06);
--shadow-md:0 8px 24px rgba(15,23,42,0.08);
--shadow-lg:0 18px 48px rgba(15,23,42,0.12);
--radius-sm:10px;
--radius-md:14px;
--radius-lg:18px;
--radius-xl:22px;
--radius-2xl:24px;
}`;
}

export function standaloneStyles(): string {
  return `
*{box-sizing:border-box}
body{margin:0;font-family:Inter,Manrope,system-ui,-apple-system,sans-serif;background:var(--surface-soft);color:var(--ink);line-height:1.6}
.experience-shell{min-height:100vh;background:radial-gradient(1200px 600px at 10% -10%, var(--brand-primary-soft), transparent 55%),var(--surface-soft)}
.site-nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 28px;border-bottom:1px solid var(--line);background:rgba(255,255,255,0.86);backdrop-filter:blur(10px)}
.site-nav a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:500;margin-left:18px}
.site-nav .mark{font-weight:800;letter-spacing:-0.03em;color:var(--ink)}
.hero-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:40px;padding:56px 28px 32px;max-width:1180px;margin:0 auto}
.hero-copy h1{font-size:clamp(40px,5vw,64px);line-height:1.05;margin:16px 0 12px;letter-spacing:-0.03em}
.hero-copy .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:var(--muted)}
.hero-copy .lead{font-size:18px;color:var(--ink-soft);max-width:52ch}
.cta-group{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.btn-primary{border:none;border-radius:999px;padding:14px 22px;font-weight:700;font-size:15px;color:#fff;background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));cursor:pointer;box-shadow:var(--shadow-md);transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 36px rgba(15,23,42,0.14);filter:brightness(1.03)}
.btn-secondary{border:1px solid var(--line);border-radius:999px;padding:14px 20px;font-weight:600;background:#fff;cursor:pointer;color:var(--ink);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.btn-secondary:hover{transform:translateY(-1px);box-shadow:var(--shadow-sm);border-color:var(--brand-primary)}
.hero-composition{border-radius:var(--radius-xl);background:linear-gradient(145deg,#fff,var(--surface-strong));border:1px solid var(--line);box-shadow:var(--shadow-lg);padding:20px}
.ai-product-preview{min-height:260px;border-radius:var(--radius-lg);border:1px solid var(--line);background:linear-gradient(165deg,rgba(255,255,255,0.95),rgba(248,250,252,0.98));padding:16px;box-shadow:var(--shadow-md)}
.dash-workspace{margin-top:4px;display:grid;gap:12px}
.dash-kpi-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dash-kpi{border:1px solid var(--line);border-radius:var(--radius-lg);padding:12px 14px;background:linear-gradient(180deg,rgba(255,255,255,0.95),var(--surface-strong));box-shadow:var(--shadow-sm)}
.dash-kpi .lbl{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:6px}
.dash-kpi strong{display:block;font-size:22px;letter-spacing:-0.03em;color:var(--ink)}
.dash-kpi .mono{font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;word-break:break-all}
.dash-kpi .sub{display:block;margin-top:6px;font-size:11px;color:var(--muted-light)}
.dash-chart-card{border:1px solid var(--line);border-radius:var(--radius-lg);background:rgba(255,255,255,0.78);backdrop-filter:blur(10px);padding:12px;box-shadow:var(--shadow-sm)}
.dash-chart-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)}
.dash-chart-head .pill{font-size:10px;padding:3px 8px;border-radius:999px;background:var(--brand-primary-soft);color:var(--brand-primary)}
.dash-spark{width:100%;height:96px;display:block}
.dash-table-wrap{border:1px solid var(--line);border-radius:var(--radius-md);overflow:hidden;background:#fff}
.dash-mini-table{width:100%;border-collapse:collapse;font-size:12px}
.dash-mini-table th,.dash-mini-table td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line-soft)}
.dash-mini-table th{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);background:var(--surface-strong)}
.dash-mini-table td.num{font-weight:800;color:var(--ink);white-space:nowrap}
.dash-mini-table tr:last-child td{border-bottom:none}
.preview-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.preview-header .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted)}
.preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.signal-card,.strategy-card,.monetization-card{border:1px solid var(--line);border-radius:var(--radius-md);padding:12px;background:var(--surface)}
.signal-card small,.strategy-card small{color:var(--muted);font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:0.08em}
.trust-bar{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center;padding:18px 28px;border-block:1px solid var(--line);background:rgba(255,255,255,0.65);color:var(--muted);font-size:13px;font-weight:600}
.tool-panel{max-width:1180px;margin:0 auto;padding:32px 28px 8px}
.configurator-card{border-radius:var(--radius-xl);background:#fff;border:1px solid var(--line);box-shadow:var(--shadow-md);padding:24px}
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section-head h2{margin:0;font-size:22px}
.tool-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.field-card{border:1px solid var(--line);border-radius:var(--radius-lg);padding:14px;background:var(--surface-strong);transition:border-color .2s,transform .2s}
.field-card:hover{border-color:var(--brand-primary);transform:translateY(-1px)}
.field-card label{display:block;font-size:13px;font-weight:700;margin-bottom:6px}
.field-card input,.field-card select,.field-card textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 12px;font-size:14px;font-family:inherit;background:#fff}
.field-card textarea{min-height:96px;resize:vertical}
.analysis-workspace{display:none;margin-top:20px;padding-top:20px;border-top:1px solid var(--line)}
.analysis-workspace.is-visible{display:block}
.score-meter{height:10px;border-radius:999px;background:var(--line);overflow:hidden;margin:12px 0 20px}
.score-meter i{display:block;height:100%;width:0%;background:linear-gradient(90deg,var(--brand-primary),var(--brand-secondary));border-radius:inherit;transition:width .6s ease}
.metrics-section{max-width:1180px;margin:0 auto;padding:24px 28px}
.metrics-section h3{margin:0 0 12px;font-size:18px}
.benefits-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.benefit-card{border:1px solid var(--line);border-radius:var(--radius-lg);padding:16px;background:#fff;box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s}
.benefit-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}
.timeline-rail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:1180px;margin:0 auto;padding:24px 28px}
.roadmap-step{border:1px dashed var(--line);border-radius:var(--radius-md);padding:14px;background:#fff;font-size:14px}
.testimonial-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;max-width:1180px;margin:0 auto;padding:24px 28px}
.testimonial-card{border:1px solid var(--line);border-radius:var(--radius-lg);padding:16px;background:#fff}
.testimonial-card .avatar{width:36px;height:36px;border-radius:999px;background:var(--brand-primary-soft);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--brand-primary)}
.faq-section{max-width:900px;margin:0 auto;padding:32px 28px 48px}
.faq-section details{border:1px solid var(--line);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:10px;background:#fff;transition:border-color .2s ease,box-shadow .2s ease}
.faq-section summary{cursor:pointer;font-weight:600}
.final-cta{margin:0 28px 48px;padding:44px 28px;border-radius:var(--radius-xl);background:linear-gradient(135deg,var(--surface-dark),#111827);color:#fff;text-align:center}
.final-cta h2{margin:0 0 10px;font-size:clamp(26px,3vw,36px)}
.site-footer{border-top:1px solid var(--line);background:#fff;padding:40px 28px 28px}
.footer-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;max-width:1180px;margin:0 auto}
.newsletter{max-width:1180px;margin:24px auto 0;padding-top:20px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted)}
@keyframes taf-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes taf-soft-pulse{0%,100%{opacity:1}50%{opacity:.72}}
.dash-feed-head,.dash-heatmap-head,.dash-timeline-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)}
.dash-heatmap-head .sub,.dash-timeline-head .sub{font-size:10px;font-weight:600;text-transform:none;letter-spacing:0;color:var(--muted-light)}
.dash-feed{display:grid;gap:8px}
.dash-feed-item{border-radius:var(--radius-md);padding:10px 12px;border:1px solid var(--line);background:linear-gradient(120deg,rgba(255,255,255,0.92),rgba(241,245,249,0.95));box-shadow:var(--shadow-sm);animation:taf-rise .55s ease backwards}
.dash-feed-item:nth-child(2){animation-delay:.08s}
.dash-feed-item:nth-child(3){animation-delay:.16s}
.dash-feed-eyebrow{display:block;font-size:9px;font-weight:800;letter-spacing:0.12em;color:var(--brand-primary);margin-bottom:4px;text-transform:uppercase}
.dash-feed-item strong{display:block;font-size:13px;margin-bottom:4px;color:var(--ink)}
.dash-feed-item p{margin:0;font-size:12px;color:var(--ink-soft);line-height:1.45}
.dash-split{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dash-heatmap-wrap,.dash-timeline{border:1px solid var(--line);border-radius:var(--radius-lg);padding:12px;background:rgba(255,255,255,0.75);backdrop-filter:blur(8px);box-shadow:var(--shadow-sm);animation:taf-rise .6s ease backwards}
.dash-heatmap{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(4,10px);gap:3px}
.dash-hm-cell{border-radius:3px;background:linear-gradient(180deg,rgba(79,70,229,0.15),var(--brand-primary));opacity:var(--hm);transition:transform .2s ease,opacity .2s ease}
.dash-hm-cell:hover{transform:scale(1.15);opacity:1}
.dash-tl-rail{display:flex;flex-direction:column;gap:10px}
.dash-tl-node{display:flex;gap:10px;align-items:flex-start}
.dash-tl-dot{width:10px;height:10px;border-radius:999px;margin-top:4px;background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));box-shadow:0 0 0 4px var(--brand-primary-soft)}
.dash-tl-bar{height:6px;border-radius:999px;background:var(--line);overflow:hidden;margin:6px 0 4px;max-width:180px}
.dash-tl-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--brand-primary),var(--brand-secondary));border-radius:inherit;transition:width 1s ease}
.dash-tl-node small{font-size:10px;color:var(--muted)}
.faq-section details[open]{border-color:var(--brand-primary-soft);box-shadow:0 8px 28px rgba(15,23,42,0.06)}
body.is-landing .hero-grid{animation:taf-rise .7s ease backwards}
body.is-landing .hero-composition{animation:taf-rise .75s ease .05s backwards}
body.is-landing .metrics-section{background:linear-gradient(180deg,transparent,rgba(241,245,249,0.65));border-radius:var(--radius-xl);margin:0 18px;padding-left:18px;padding-right:18px}
body.is-landing .final-cta{background:radial-gradient(800px 400px at 20% 0%,rgba(99,102,241,0.35),transparent 55%),linear-gradient(135deg,var(--surface-dark),#0f172a)}
.form-stepper{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;padding:10px 12px;border-radius:var(--radius-lg);border:1px dashed var(--line);background:rgba(255,255,255,0.65)}
.form-step{font-size:11px;font-weight:700;color:var(--muted);padding:6px 10px;border-radius:999px;background:var(--surface-strong)}
.form-step.is-on{background:var(--brand-primary-soft);color:var(--brand-primary)}
.analysis-workspace.is-visible .score-meter i{animation:taf-soft-pulse 2.4s ease infinite}
@media(max-width:1024px){.hero-grid,.tool-form-grid,.benefits-grid,.testimonial-grid,.timeline-rail,.footer-grid,.dash-kpi-row{grid-template-columns:1fr 1fr}.dash-split{grid-template-columns:1fr}}
@media(max-width:768px){.hero-grid,.tool-form-grid,.benefits-grid,.testimonial-grid,.timeline-rail,.footer-grid,.dash-kpi-row{grid-template-columns:1fr}}
`;
}

export function benefitCopy(spec: ToolRenderSpec): string[] {
  const base = spec.positioningBullets.length ? spec.positioningBullets : [spec.heroLead];
  const features = [
    "Guided inputs map to a prioritized execution path",
    "Insight workspace highlights traffic, conversion, and revenue leverage",
    "Designed for authority: clear claims, bounded metrics, next actions",
    "Responsive layout with premium spacing and motion discipline",
    "Exports as a single self-contained page for fast deployment",
    "Built for iteration: rerun when your offer or channel mix changes",
  ];
  return features.map((f, i) => `${f} — ${base[i % base.length].slice(0, 90)}`.slice(0, 160));
}
