import { clientCalculationSnippet, runCalculationEngine } from "./calculators";
import { escapeHtml, jsonForScript } from "./escape";
import type { FormField, ToolRenderSpec } from "./types";

function embedField(f: FormField): string {
  const id = escapeHtml(f.id);
  const label = escapeHtml(f.label);
  const ph = escapeHtml(f.placeholder ?? "");
  let inner = "";
  if (f.type === "select" && f.options?.length) {
    inner = `<div class="taf-select-wrap"><select class="taf-select" id="${id}" name="${id}" required><option value="">Choose…</option>${f.options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select></div>`;
  } else if (f.type === "textarea") {
    inner = `<textarea class="taf-textarea" id="${id}" name="${id}" placeholder="${ph}" required></textarea>`;
  } else {
    inner = `<input class="taf-input" id="${id}" name="${id}" type="text" placeholder="${ph}" required/>`;
  }
  return `<div class="taf-field-card"><span class="taf-icon-chip" aria-hidden="true"></span><label for="${id}">${label}</label>${inner}</div>`;
}

export function buildEmbedHtml(spec: ToolRenderSpec): string {
  const demo = runCalculationEngine(spec.engineId, {});
  const fields = spec.formFields.map(embedField).join("");
  const specJson = jsonForScript({ engineId: spec.engineId, fieldIds: spec.formFields.map((f) => f.id) });
  const strat = spec.strategyCards[0];
  const strat2 = spec.strategyCards[1] ?? spec.strategyCards[0];

  return `<div class="taf-widget">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700&display=swap');
.taf-widget{font-family:Inter,Manrope,system-ui,sans-serif;color:#0f172a;border:1px solid #e2e8f0;border-radius:18px;background:#fff;box-shadow:0 12px 32px rgba(15,23,42,0.08);overflow:hidden}
.taf-widget-header{padding:16px 18px;border-bottom:1px solid #e2e8f0;background:linear-gradient(180deg,#fafafa,#fff)}
.taf-ai-badge{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#4f46e5;background:rgba(79,70,229,0.1);padding:4px 10px;border-radius:999px}
.taf-widget-header h3{margin:8px 0 4px;font-size:17px;letter-spacing:-0.02em}
.taf-widget-header p{margin:0;font-size:13px;color:#64748b}
.taf-stepper{display:flex;gap:8px;padding:10px 18px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b}
.taf-stepper span{padding:6px 10px;border-radius:999px;background:#f8fafc}
.taf-stepper span.is-on{background:#eef2ff;color:#4338ca}
.taf-progress{height:4px;background:#f1f5f9}
.taf-progress i{display:block;height:100%;width:38%;background:linear-gradient(90deg,#4f46e5,#6366f1)}
.taf-tool-panel{padding:14px 18px 18px}
.taf-step-card{margin-bottom:12px}
.taf-field-card{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#f8fafc;margin-bottom:10px}
.taf-field-card label{display:block;font-size:12px;font-weight:700;margin-bottom:6px}
.taf-input,.taf-select,.taf-textarea{width:100%;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font:inherit;background:#fff}
.taf-textarea{min-height:72px;resize:vertical}
.taf-primary-button{width:100%;border:none;border-radius:14px;padding:12px 14px;font-weight:800;font-size:14px;color:#fff;background:linear-gradient(135deg,#4f46e5,#6366f1);cursor:pointer;margin-top:8px}
.taf-insight-dashboard{display:none;padding:16px 18px 20px;border-top:1px solid #e2e8f0;background:#fafafa}
.taf-insight-dashboard.is-on{display:block}
.taf-score-meter{height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin:10px 0 14px}
.taf-score-meter i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#4f46e5,#6366f1);transition:width .5s ease}
.taf-metric-card{border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#fff;margin-bottom:8px;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.taf-metric-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,0.08);border-color:#c7d2fe}
.taf-metric-card strong{font-size:18px}
.taf-strategy-card{border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#fff;margin-bottom:8px;font-size:13px;color:#334155}
.taf-cta-block{margin-top:10px;padding:12px;border-radius:14px;background:#0f172a;color:#fff;text-align:center;font-size:13px;font-weight:700}
.taf-lead-capture{margin-top:10px;padding:10px;border-radius:12px;border:1px dashed #cbd5e1;font-size:12px;color:#64748b}
.taf-export-actions{display:flex;gap:8px;margin-top:8px;font-size:12px;color:#64748b}
.taf-icon-chip{display:inline-block;width:8px;height:8px;border-radius:99px;background:#6366f1;margin-right:6px;vertical-align:middle}
@media(max-width:520px){.taf-widget{border-radius:14px}}
</style>
<div class="taf-widget-header">
  <span class="taf-ai-badge">AI business intelligence</span>
  <h3>${escapeHtml(spec.heroTitle)}</h3>
  <p>${escapeHtml(spec.heroLead.slice(0, 160))}${spec.heroLead.length > 160 ? "…" : ""}</p>
</div>
<div class="taf-stepper"><span class="is-on">Inputs</span><span>Model</span><span>Insights</span></div>
<div class="taf-progress"><i></i></div>
<form id="taf-assessment-form" class="taf-assessment-form" onsubmit="event.preventDefault();window.__TAF_EMBED_SUBMIT&&window.__TAF_EMBED_SUBMIT(event);">
<div class="taf-tool-panel">
  <div class="taf-step-card">${fields}<button type="submit" class="taf-primary-button">${escapeHtml(spec.submitCta)}</button></div>
</div>
<div class="taf-insight-dashboard" id="taf-dash">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
    <strong style="font-size:26px;letter-spacing:-0.03em" id="taf-emb-score">${demo.score}</strong>
    <span style="font-size:12px;color:#64748b">Opportunity index</span>
  </div>
  <div class="taf-score-meter"><i id="taf-emb-meter" style="width:0%"></i></div>
  ${demo.metrics
    .map(
      (m, i) => `<div class="taf-metric-card"><small style="color:#64748b;font-weight:700;text-transform:uppercase;font-size:9px">${escapeHtml(m.label)}</small><div id="taf-em-${i}" style="margin-top:4px"><strong>${escapeHtml(m.value)}</strong></div><p style="margin:4px 0 0;font-size:11px;color:#94a3b8">${escapeHtml(m.hint || "")}</p></div>`
    )
    .join("")}
  <div class="taf-strategy-card"><strong>${escapeHtml(strat?.title ?? "Recommendation")}</strong><p style="margin:6px 0 0">${escapeHtml(strat?.body ?? "")}</p></div>
  <div class="taf-strategy-card"><strong>${escapeHtml(strat2?.title ?? "Next step")}</strong><p style="margin:6px 0 0">${escapeHtml(strat2?.body ?? "")}</p></div>
  <div class="taf-cta-block">Book a strategy call or export this plan into your CMS.</div>
  <div class="taf-lead-capture">Lead capture: connect your ESP or CRM to store respondents (wire in your endpoint).</div>
  <div class="taf-export-actions"><span>Copy summary</span><span>Share link</span><span>Download PDF</span></div>
</div>
</form>
<script type="application/json" id="taf-embed-spec">${specJson}</script>
<script>
${clientCalculationSnippet()}
window.__TAF_EMBED_SUBMIT=function(e){
  var spec=JSON.parse(document.getElementById("taf-embed-spec").textContent);
  var values={};
  spec.fieldIds.forEach(function(id){var el=document.getElementById(id);if(el)values[id]=(el.value||"").trim();});
  var out=__tafRunEngine(spec.engineId,values);
  document.getElementById("taf-emb-score").textContent=String(out.score);
  var m=document.getElementById("taf-emb-meter");if(m)m.style.width=Math.min(100,out.score)+"%";
  out.metrics.forEach(function(x,i){var n=document.getElementById("taf-em-"+i);if(n)n.innerHTML="<strong>"+String(x.value)+"</strong>";});
  var d=document.getElementById("taf-dash");if(d)d.classList.add("is-on");
};
</script>
</div>`;
}
