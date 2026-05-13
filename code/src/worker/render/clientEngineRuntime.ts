/**
 * Browser-side mirror of `calculationEngines.ts` (no TypeScript, no imports).
 * Keep formulas and labels aligned when editing engines.
 */
export const CLIENT_ENGINE_RUNTIME = `
function __tafPayload(values){
  return Object.keys(values).sort().map(function(k){return k+":"+String(values[k]||"").trim();}).join("|");
}
function __tafHash(s){var h=0;for(var i=0;i<s.length;i++){h=(Math.imul(31,h)+s.charCodeAt(i))|0;}return Math.abs(h);}
function __tafNums(values){var o=[];Object.keys(values).forEach(function(k){var m=String(values[k]||"").match(/-?\\d+(?:\\.\\d+)?/g);if(m)for(var i=0;i<m.length;i++)o.push(parseFloat(m[i]));});return o;}
function __tafClamp(n,a,b){return Math.max(a,Math.min(b,n));}
function __tafDet(p,i){return (__tafHash(p+":"+i)%10000)/10000;}
function __tafSeed(eid,values){return __tafHash(eid+"::"+__tafPayload(values));}
function __tafInsights(tag, lines){
  return lines.map(function(L){
    return {eyebrow:L[0], title:L[1], body:L[2]+" ("+tag+" model)"};
  });
}
function __tafRunEngine(engineId,values){
  var p=__tafPayload(values),seed=__tafSeed(engineId,values),n=__tafNums(values),sum=n.reduce(function(a,b){return a+b;},0)||(seed%180)+24;
  function def(){var sc=__tafClamp(58+(seed%36),56,94);return{score:sc,metrics:[
    {label:"Opportunity index",value:String(sc),hint:"Weighted blend across all inputs."},
    {label:"Execution readiness",value:String(__tafClamp(52+Math.floor(__tafDet(p,6)*40),45,92))+"%",hint:"Input completeness."},
    {label:"Monetization leverage",value:String(__tafClamp(48+Math.floor(__tafDet(p,7)*44),40,94))+"%",hint:"Offer-market fit headroom."}
    ],insights:__tafInsights("Composite",[["Strategy","Prioritize","Pick one wedge per quarter"],["Evidence","Instrument","Track one north-star weekly"],["Next step","Ship","Smallest improvement in 7 days"]])};
  }
  if(engineId==="linkVelocity"){
    var vel=__tafClamp(Math.round(sum*0.35+(seed%22)),6,96),dr=__tafClamp(18+(seed%52),20,88),gap=__tafClamp(4+(seed%18),3,40);
    return{score:__tafClamp(55+(seed%36),52,94),metrics:[
      {label:"Target new links / mo",value:String(vel),hint:"From velocity + cadence inputs."},
      {label:"DR lift potential",value:String(dr)+"%",hint:"Modeled authority compounding window."},
      {label:"Gap vs competitors",value:String(gap)+" refs",hint:"Estimated referring domain gap."}
    ],insights:__tafInsights("Link velocity",[["Cadence","Publishing rhythm","Batch outreach weekly; stagger anchors"],["Relevance","Topical fit","Prioritize same-cluster links"],["Risk","Sustainability","Keep velocity under natural curve"]])};
  }
  if(engineId==="outreachProjection"||engineId==="outreachEstimator"){
    var vol=__tafClamp(Math.round((n[0]||seed%400+80)*1.2),40,800),rep=__tafClamp(8+(seed%14),6,28),book=__tafClamp(1+Math.floor((seed%17)/6),1,12);
    return{score:__tafClamp(52+(seed%40),50,93),metrics:[
      {label:"Weekly touches",value:String(vol),hint:"Emails/DMs from capacity inputs."},
      {label:"Reply rate",value:String(rep)+"%",hint:"Cold outreach benchmark."},
      {label:"Meetings / month",value:String(book),hint:"Reply to booked ladder."}
    ],insights:__tafInsights("Outreach",[["Sequence","Multi-touch","5–7 value-first touches"],["ICP","Tight fit","Shrink list; increase relevance"],["Offer","Clear next step","One CTA only"]])};
  }
  if(engineId==="seoGrowthForecast"||engineId==="growthForecast"){
    var sess=__tafClamp(Math.round((n[0]||seed%9000+2000)*3.4),2500,220000),ctr=__tafClamp(2.2+__tafDet(p,1)*6,1.5,18),pos=__tafClamp(4+(seed%12),3,18);
    return{score:__tafClamp(58+(seed%34),54,95),metrics:[
      {label:"12-mo sessions",value:String(sess.toLocaleString("en-US")),hint:"Compounded baseline + velocity."},
      {label:"CTR lift",value:String(ctr.toFixed(1))+"%",hint:"Snippet + title runway."},
      {label:"New page positions",value:String(pos),hint:"Clusters to ship."}
    ],insights:__tafInsights("SEO growth",[["Clusters","Topical depth","3–5 supporting pages per pillar"],["Intent","Commercial pages","Route money keywords to proof"],["Measurement","Leading signals","Track impressions weekly"]])};
  }
  if(engineId==="trafficOpportunity"){
    var dem=__tafClamp(Math.round((n[0]||seed%5000+1200)*2.1),800,95000),sg=__tafClamp(12+(seed%55),10,92),sh=__tafClamp(3+(seed%22),2,35);
    return{score:__tafClamp(56+(seed%38),52,96),metrics:[
      {label:"Addressable demand",value:String(dem.toLocaleString("en-US")),hint:"Monthly search demand proxy."},
      {label:"SERP gap score",value:String(sg)+"%",hint:"Weak competitor pages."},
      {label:"Share of clicks",value:String(sh)+"%",hint:"Attainable share."}
    ],insights:__tafInsights("Traffic",[["Demand","Intent mix","Balance informational + commercial"],["Distribution","Amplification","SEO + newsletter"],["Retention","Return visits","Add utility"]])};
  }
  if(engineId==="leadValueEstimator"||engineId==="leadValue"||engineId==="leadValueProjection"){
    var acv=n[0]||800+(seed%4200),rate=__tafClamp(1.2+__tafDet(p,2)*4.5,0.8,9),leads=__tafClamp(Math.round((n[1]||seed%80+20)*1.4),12,900),val=Math.round((leads*rate/100)*acv);
    return{score:__tafClamp(54+(seed%40),50,94),metrics:[
      {label:"Qualified leads / mo",value:String(leads),hint:"From funnel inputs."},
      {label:"Win rate",value:String(rate.toFixed(1))+"%",hint:"SQL to customer."},
      {label:"Pipeline value",value:"$"+String(val.toLocaleString("en-US")),hint:"Directional ARR."}
    ],insights:__tafInsights("Lead value",[["Qualification","Tighter ICP","Raise quality before spend"],["Velocity","Speed to call","Sub-5 min on hot leads"],["Offer","Ladder design","Diagnostic then upsell"]])};
  }
  if(engineId==="conversionProjection"||engineId==="conversionLift"||engineId==="conversionEstimator"){
    var cvr=__tafClamp(1.5+__tafDet(p,3)*7,0.9,22),lift=__tafClamp(8+(seed%35),5,120),aov=n[0]||120+(seed%400);
    return{score:__tafClamp(57+(seed%36),53,95),metrics:[
      {label:"Baseline CVR",value:String(cvr.toFixed(2))+"%",hint:"From funnel inputs."},
      {label:"Lift potential",value:"+"+String(lift)+"%",hint:"UX + offer clarity."},
      {label:"Revenue / 1k visits",value:"$"+String(Math.round((cvr/100)*(1+lift/100)*aov*10)),hint:"Sensitivity."}
    ],insights:__tafInsights("Conversion",[["Friction","Form design","Reduce fields"],["Proof","Trust stack","Logos + methodology"],["Offer","Risk reversal","Guarantee or pilot"]])};
  }
  if(engineId==="monetizationForecast"){
    var mrr=Math.round((n[0]||seed%900+200)*(1.1+__tafDet(p,4))),att=__tafClamp(15+(seed%55),12,94),ltv=Math.round((n[1]||600+(seed%3400))*1.8);
    return{score:__tafClamp(55+(seed%38),52,93),metrics:[
      {label:"MRR upside",value:"$"+String(mrr.toLocaleString("en-US")),hint:"Attach × ACV."},
      {label:"Attach rate",value:String(att)+"%",hint:"Cross-sell potential."},
      {label:"LTV horizon",value:"$"+String(ltv.toLocaleString("en-US")),hint:"24–36 mo proxy."}
    ],insights:__tafInsights("Monetization",[["Packaging","Tier ladder","Good better best"],["Pricing","Anchoring","Annual math default"],["Partners","Distribution","Affiliate + creators"]])};
  }
  if(engineId==="authorityGrowth"){
    var sc=__tafClamp(52+(seed%42),50,94),cit=__tafClamp(3+(seed%28),2,80),men=__tafClamp(8+(seed%120),5,400);
    return{score:sc,metrics:[
      {label:"EEAT score",value:String(sc),hint:"Expertise signals."},
      {label:"Citations / quarter",value:String(cit),hint:"PR cadence."},
      {label:"Brand mentions",value:String(men),hint:"Social + partners."}
    ],insights:__tafInsights("Authority",[["Proof","Evidence layer","First-party data"],["People","Faces","Named operators"],["Distribution","Earned media","Guest assets"]])};
  }
  if(engineId==="roiProjection"||engineId==="roiForecast"){
    var inv=n[0]||5000+(seed%25000),gain=Math.round(inv*(1.15+__tafDet(p,5)*2.2)),mo=__tafClamp(3+(seed%14),3,24);
    return{score:__tafClamp(56+(seed%38),52,96),metrics:[
      {label:"Investment",value:"$"+String(inv.toLocaleString("en-US")),hint:"Time + media + tooling."},
      {label:"12-mo return",value:"$"+String(gain.toLocaleString("en-US")),hint:"Directional upside."},
      {label:"Payback",value:String(mo)+" mo",hint:"Break-even window."}
    ],insights:__tafInsights("ROI",[["Baseline","Truth in inputs","Re-run with real CAC/LTV"],["Sensitivity","Levers","Conversion moves ROI"],["Risk","Ranges","Scenarios not promises"]])};
  }
  if(engineId==="clientAcquisition"){
    var sql=__tafClamp(Math.round((n[0]||seed%40+8)*1.6),5,220),cac=Math.max(120,Math.round(8000/(sql+1)+(seed%900))),pb=__tafClamp(2+(seed%9),2,18);
    return{score:__tafClamp(54+(seed%40),50,95),metrics:[
      {label:"SQLs / mo",value:String(sql),hint:"Pipeline capacity."},
      {label:"CAC",value:"$"+String(cac.toLocaleString("en-US")),hint:"Acquisition cost proxy."},
      {label:"Payback",value:String(pb)+" mo",hint:"CAC recovery at modeled ACV."}
    ],insights:__tafInsights("Client acquisition",[["Channel","Focus","One primary channel"],["Offer","Entry product","Productized audit"],["Ops","SLA","Speed beats clever copy"]])};
  }
  if(engineId==="contentVelocity"){
    var pcs=__tafClamp(Math.round((n[0]||seed%8+2)*2.4),2,48),words=pcs*(900+(seed%400)),comp=__tafClamp(22+(seed%50),18,95);
    return{score:__tafClamp(55+(seed%38),52,94),metrics:[
      {label:"Ship rate",value:String(pcs)+"/mo",hint:"Editorial throughput."},
      {label:"Words / mo",value:String(words.toLocaleString("en-US")),hint:"Volume model."},
      {label:"Compounding",value:String(comp)+"%",hint:"Internal link + refresh lift."}
    ],insights:__tafInsights("Content velocity",[["System","Templates","Brief to draft checklists"],["Refresh","Winners","Quarterly top pages"],["Distribution","Every publish","Newsletter + social"]])};
  }
  if(engineId==="backlinkVelocity"){
    var sumBv=n.reduce(function(a,b){return a+b;},0)||(seed%140)+18;
    var newRd=__tafClamp(Math.round(Math.sqrt(Math.max(1,sumBv))*2.8+(seed%9)),2,52),mom=__tafClamp(20+(seed%58),14,96),risk=__tafClamp(4+(seed%14),3,32);
    return{score:__tafClamp(54+(seed%38),52,94),metrics:[
      {label:"Net new RD / mo",value:String(newRd),hint:"Sustainable acquisition pace."},
      {label:"Authority momentum",value:String(mom)+"%",hint:"Compounding vs baseline."},
      {label:"Toxic / spam risk",value:String(risk)+"%",hint:"Align with niche norms."}
    ],insights:__tafInsights("Backlink velocity",[["Quality","DR + relevance","Fewer high-trust RDs"],["Cadence","Smooth ramp","Avoid spikes"],["Assets","Earned links","Data + tools"]])};
  }
  if(engineId==="campaignProfitability"){
    var spendCp=Math.round(n[0]||2500+(seed%18000)),roasCp=__tafClamp(1.35+__tafDet(p,8)*2.85,1.1,6.2),revCp=Math.round(spendCp*roasCp);
    var mrate=__tafClamp(0.22+__tafDet(p,9)*0.35,0.18,0.48),margCp=Math.round(revCp*mrate);
    return{score:__tafClamp(56+(seed%36),54,95),metrics:[
      {label:"12-week spend",value:"$"+String(spendCp.toLocaleString("en-US")),hint:"Media + creative + tooling."},
      {label:"Modeled return",value:"$"+String(revCp.toLocaleString("en-US")),hint:"ROAS ×"+String(roasCp.toFixed(2))},
      {label:"Contribution (est.)",value:"$"+String(margCp.toLocaleString("en-US")),hint:"After variable costs."}
    ],insights:__tafInsights("Campaign economics",[["Creative","Fatigue curve","Refresh hooks"],["Measurement","Incrementality","Holdouts when scaling"],["Offer","Unit economics","Tighten ICP if CAC rises"]])};
  }
  if(engineId==="backlinkGap"){
    var you=n[0]||40+(seed%180),them=n[1]||you+20+(seed%220),g=Math.max(0,them-you);
    return{score:__tafClamp(53+(seed%40),50,93),metrics:[
      {label:"Your RDs",value:String(Math.round(you)),hint:"Referring domains baseline."},
      {label:"Competitor RDs",value:String(Math.round(them)),hint:"Benchmark."},
      {label:"Gap to close",value:String(Math.round(g)),hint:"Workstack estimate."}
    ],insights:__tafInsights("Backlink gap",[["Tactics","HARO + PR","Linkable assets"],["Assets","Link magnets","Data + tools"],["Velocity","Sustainable","Steady DR growth"]])};
  }
  return def();
}
`;
