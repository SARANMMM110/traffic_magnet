import { Binoculars, Gem, LineChart, Radar } from "lucide-react";

const INSIGHTS = [
  {
    title: "High opportunity detected",
    detail: "Cluster overlap in commercial calculators",
    icon: Gem,
    desktopClass:
      "right-[2%] top-[2%] border-fuchsia-200/50 bg-gradient-to-br from-fuchsia-500/12 to-white/55",
    delay: "0s",
  },
  {
    title: "Low competition niche",
    detail: "Editorial moat thinning in mid tail",
    icon: Binoculars,
    desktopClass:
      "left-[1%] top-[36%] border-sky-200/50 bg-gradient-to-br from-sky-500/12 to-white/55",
    delay: "0.5s",
  },
  {
    title: "Monetization potential rising",
    detail: "Affiliate + lead composite fit",
    icon: LineChart,
    desktopClass:
      "right-[8%] bottom-[10%] border-violet-200/50 bg-gradient-to-br from-violet-500/12 to-white/55",
    delay: "1s",
  },
  {
    title: "Traffic opportunity identified",
    detail: "Programmatic gap vs. incumbents",
    icon: Radar,
    desktopClass:
      "left-[6%] bottom-[4%] border-emerald-200/50 bg-gradient-to-br from-emerald-500/12 to-white/55",
    delay: "1.5s",
  },
];

export function StartInsightMobileStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
      {INSIGHTS.map((card) => (
        <div
          key={card.title}
          className="min-w-[220px] snap-start rounded-2xl border border-slate-200/60 bg-white/60 px-3 py-2.5 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <card.icon className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800">{card.title}</p>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-600">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function StartInsightDesktopCanvas() {
  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-slate-200/40 bg-slate-900/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.08),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.07),transparent_40%)]" />
      {INSIGHTS.map((card) => (
        <div
          key={card.title}
          className={`pointer-events-none absolute max-w-[220px] rounded-2xl border px-3.5 py-2.5 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)] backdrop-blur-md animate-tm-float ${card.desktopClass}`}
          style={{ animationDelay: card.delay }}
        >
          <div className="flex items-center gap-2">
            <card.icon className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800">{card.title}</p>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-600">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}
