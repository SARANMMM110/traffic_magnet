import { clientCalculationSnippet, runCalculationEngine } from "./calculators";
import { benefitCopy, standaloneStyles, themeRootVariables } from "./designTokens";
import { escapeHtml, jsonForScript } from "./escape";
import { dashboardPreviewWorkspace } from "./htmlFragments";
import type { FormField, ToolRenderSpec } from "./types";

function fieldHtml(f: FormField): string {
  const id = escapeHtml(f.id);
  const label = escapeHtml(f.label);
  const ph = escapeHtml(f.placeholder ?? "");
  const help = f.help ? `<p style="font-size:12px;color:var(--muted);margin:6px 0 0">${escapeHtml(f.help)}</p>` : "";
  let control = "";
  if (f.type === "select" && f.options?.length) {
    const opts = f.options
      .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
      .join("");
    control = `<select id="${id}" name="${id}" required><option value="">Select…</option>${opts}</select>`;
  } else if (f.type === "textarea") {
    control = `<textarea id="${id}" name="${id}" placeholder="${ph}" required></textarea>`;
  } else {
    control = `<input id="${id}" name="${id}" type="text" placeholder="${ph}" required />`;
  }
  return `<div class="field-card"><label for="${id}">${label}</label>${control}${help}</div>`;
}

export function buildStandaloneHtml(
  spec: ToolRenderSpec,
  variant: "standalone" | "landing" = "standalone"
): string {
  const panelId = variant === "landing" ? "interactive-tool" : "tool";
  const bodyClass = variant === "landing" ? "is-landing" : "is-standalone";
  const demoResult = runCalculationEngine(spec.engineId, {});
  const bands = dashboardPreviewWorkspace(demoResult.score, spec.engineId, demoResult.metrics);
  const benefits = benefitCopy(spec);
  const faqHtml = spec.faq
    .slice(0, 8)
    .map(
      (item) => `<details><summary>${escapeHtml(item.question)}</summary><p style="margin:10px 0 0;color:var(--ink-soft);font-size:14px">${escapeHtml(item.answer)}</p></details>`
    )
    .join("");

  const signalsHtml = spec.signalCards
    .slice(0, 4)
    .map(
      (c) => `<article class="signal-card"><small>${escapeHtml(c.eyebrow)}</small><strong>${escapeHtml(c.title)}</strong><p style="margin:6px 0 0;font-size:13px;color:var(--ink-soft)">${escapeHtml(c.body)}</p></article>`
    )
    .join("");

  const strategyHtml = spec.strategyCards
    .slice(0, 3)
    .map(
      (c) => `<article class="strategy-card"><small>${escapeHtml(c.eyebrow)}</small><strong>${escapeHtml(c.title)}</strong><p style="margin:6px 0 0;font-size:13px;color:var(--ink-soft)">${escapeHtml(c.body)}</p></article>`
    )
    .join("");

  const monetHtml = spec.monetizationCards
    .slice(0, 3)
    .map(
      (c) => `<article class="monetization-card"><small>${escapeHtml(c.eyebrow)}</small><strong>${escapeHtml(c.title)}</strong><p style="margin:6px 0 0;font-size:13px;color:var(--ink-soft)">${escapeHtml(c.body)}</p></article>`
    )
    .join("");

  const roadmapHtml = spec.roadmapSteps
    .slice(0, 4)
    .map((step, i) => `<div class="roadmap-step"><strong>Step ${i + 1}.</strong> ${escapeHtml(step)}</div>`)
    .join("");

  const testimonialHtml = spec.testimonialQuotes
    .slice(0, 3)
    .map((t) => {
      const initials = t.name
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return `<article class="testimonial-card"><div style="display:flex;gap:12px;align-items:flex-start"><div class="avatar">${escapeHtml(initials)}</div><div><p style="margin:0 0 8px;font-size:14px;color:var(--ink-soft)">“${escapeHtml(t.quote)}”</p><p style="margin:0;font-size:13px;font-weight:700">${escapeHtml(t.name)}</p><p style="margin:2px 0 0;font-size:12px;color:var(--muted)">${escapeHtml(t.role)}</p></div></div></article>`;
    })
    .join("");

  const fields = spec.formFields.map(fieldHtml).join("");
  const gridFullRow =
    spec.formFields.length % 2 === 1
      ? `<style>#business-asset-form .field-card:last-child{grid-column:1/-1}</style>`
      : "";

  const specJson = jsonForScript({ engineId: spec.engineId, fieldIds: spec.formFields.map((f) => f.id) });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(spec.heroTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"/>
<style>${themeRootVariables(spec.themeKey)}${standaloneStyles()}</style>
</head>
<body class="${bodyClass}">
<div class="experience-shell">
<header class="site-nav">
  <div class="mark">${escapeHtml(spec.heroTitle)}</div>
  <nav><a href="#${panelId}">Tool</a><a href="#insights">Insights</a><a href="#faq">FAQ</a><a href="#cta">Get started</a></nav>
</header>
<section class="hero-grid">
  <div class="hero-copy">
    <span class="eyebrow">${escapeHtml(spec.brandLine)} · ${escapeHtml(spec.heroEyebrow)}</span>
    <h1>${escapeHtml(spec.heroTitle)}</h1>
    <p class="lead">${escapeHtml(spec.heroLead)}</p>
    <div class="cta-group">
      <a class="btn-primary" href="#${panelId}" style="text-decoration:none;display:inline-block">${escapeHtml(spec.submitCta)}</a>
      <button type="button" class="btn-secondary" onclick="document.getElementById('faq')?.scrollIntoView({behavior:'smooth'})">Read FAQ</button>
    </div>
  </div>
  <div class="hero-composition">
    <div class="ai-product-preview">
      <div class="preview-header"><p class="eyebrow">Live preview</p><strong style="font-size:14px">Strategy console</strong></div>
      <div class="preview-grid">${signalsHtml}</div>
      ${bands}
    </div>
  </div>
</section>
<div class="trust-bar">${spec.trustStrip.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
<section class="tool-panel" id="${panelId}">
  <div class="configurator-card">
    <div class="section-head"><h2>Configure your inputs</h2><span style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.12em">Platform engine</span></div>
    ${gridFullRow}
    <form id="business-asset-form" class="tool-form-grid" onsubmit="return window.__TAF_HANDLE_SUBMIT(event)">
      ${
        variant === "landing"
          ? `<div class="form-stepper" style="grid-column:1/-1" aria-hidden="true"><span class="form-step is-on">1 · Inputs</span><span class="form-step">2 · Model</span><span class="form-step">3 · Insights</span></div>`
          : ""
      }
      ${fields}
      <div style="grid-column:1/-1">
        <button type="submit" class="btn-primary" style="width:100%;border-radius:14px">${escapeHtml(spec.submitCta)}</button>
      </div>
    </form>
    <div id="insights" class="analysis-workspace">
      <h3 style="margin:0 0 8px">Your opportunity workspace</h3>
      <p style="margin:0 0 12px;color:var(--muted);font-size:14px">Modeled index from your inputs — use as a prioritization lens, not a guarantee.</p>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <strong style="font-size:34px;letter-spacing:-0.03em" id="taf-score-label">${demoResult.score}</strong>
        <span style="font-size:13px;color:var(--muted)">Opportunity index</span>
      </div>
      <div class="score-meter" aria-hidden="true"><i id="taf-score-meter" style="width:0%"></i></div>
      <div class="tool-form-grid" style="margin-bottom:16px">
        ${demoResult.metrics
          .map(
            (m, i) => `<div class="field-card" style="background:#fff"><small style="color:var(--muted);font-weight:700;text-transform:uppercase;font-size:10px">${escapeHtml(m.label)}</small><div id="taf-m-${i}" style="font-size:22px;font-weight:800;margin-top:6px">${escapeHtml(m.value)}</div><p style="margin:6px 0 0;font-size:12px;color:var(--muted)">${escapeHtml(m.hint || "")}</p></div>`
          )
          .join("")}
      </div>
      <div class="preview-grid" style="margin-bottom:14px">${strategyHtml}</div>
      <div class="preview-grid">${monetHtml}</div>
    </div>
  </div>
</section>
<section class="metrics-section" id="signals">
  <h3>Qualitative momentum signals</h3>
  <p style="margin:0 0 14px;max-width:70ch;color:var(--ink-soft);font-size:14px">These are narrative signals derived from your strategy blueprint — not fabricated vanity metrics.</p>
  <div class="benefits-grid">${benefits.map((b) => `<div class="benefit-card"><strong style="display:block;margin-bottom:6px;font-size:15px">Advantage</strong><p style="margin:0;font-size:13px;color:var(--ink-soft)">${escapeHtml(b)}</p></div>`).join("")}</div>
</section>
<div class="timeline-rail">${roadmapHtml}</div>
<div class="testimonial-grid">${testimonialHtml}</div>
<section class="faq-section" id="faq">${faqHtml}</section>
<section class="final-cta" id="cta">
  <h2>Ship a premium asset, not a generic page</h2>
  <p style="opacity:0.85;max-width:60ch;margin:0 auto 18px;font-size:15px">Turn traffic into qualified intent with a structured experience your team can iterate on.</p>
  <button type="button" class="btn-primary" onclick="document.getElementById('${panelId}')?.scrollIntoView({behavior:'smooth'})">${escapeHtml(spec.submitCta)}</button>
</section>
<footer class="site-footer">
  <div class="footer-grid">
    <div><strong>${escapeHtml(spec.heroTitle)}</strong><p style="font-size:13px;color:var(--muted)">${escapeHtml(spec.footerNote)}</p></div>
    <div><strong>Product</strong><p style="font-size:13px;color:var(--muted)">Assessment · Insights · Roadmap</p></div>
    <div><strong>Company</strong><p style="font-size:13px;color:var(--muted)">Trust-first positioning</p></div>
    <div><strong>Legal</strong><p style="font-size:13px;color:var(--muted)">No warranties on modeled outputs</p></div>
  </div>
  <div class="newsletter"><span>Built with the platform render engine (structured blueprint → stable UI).</span><span>Inter · Manrope · responsive · single-file</span></div>
</footer>
</div>
<script type="application/json" id="taf-render-spec">${specJson}</script>
<script>
${clientCalculationSnippet()}
window.__TAF_HANDLE_SUBMIT=function(e){
  e.preventDefault();
  var form=document.getElementById("business-asset-form");
  var spec=JSON.parse(document.getElementById("taf-render-spec").textContent);
  var values={};
  spec.fieldIds.forEach(function(id){
    var el=document.getElementById(id);
    if(el) values[id]=(el.value||"").trim();
  });
  var out=__tafRunEngine(spec.engineId, values);
  document.getElementById("taf-score-label").textContent=String(out.score);
  var meter=document.getElementById("taf-score-meter");
  if(meter) meter.style.width=Math.min(100,out.score)+"%";
  out.metrics.forEach(function(m,i){
    var node=document.getElementById("taf-m-"+i);
    if(node) node.textContent=m.value;
  });
  var ws=document.querySelector(".analysis-workspace");
  if(ws){ ws.classList.add("is-visible"); ws.scrollIntoView({behavior:"smooth",block:"start"}); }
  return false;
};
</script>
</body>
</html>`;
}
