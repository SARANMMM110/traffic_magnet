import {
  ArrowUpRight,
  Gauge,
  Radar,
  ShieldHalf,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";

const RECS = [
  "Weighted demand is strongest in problem-aware queries with calculator intent.",
  "Pair programmatic landing with one flagship asset to compound topical authority.",
  "Monetization: hybrid lead-gen + affiliate stack reduces single-channel risk.",
];

const NICHES = [
  { label: "B2B diagnostics", score: "A-", note: "Low SERP volatility" },
  { label: "Local services", score: "B+", note: "Geo modifiers rising" },
  { label: "Creator tools", score: "A", note: "High LTV signals" },
];

export default function StartOpportunityWorkspace() {
  return (
    <section className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-[1.5rem] border border-slate-200/60 bg-gradient-to-br from-white/80 via-slate-50/40 to-violet-50/30 p-5 sm:p-6 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Radar className="h-3.5 w-3.5 text-sky-500" strokeWidth={2} />
                Opportunity workspace
              </div>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                AI is mapping your next compounding asset
              </h2>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200/60 bg-violet-500/10 text-violet-600">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span>Demand score</span>
                <Gauge className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">8.4</span>
                <span className="mb-1 text-xs font-semibold text-emerald-600">/ 10</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full w-[84%] rounded-full bg-gradient-to-r from-violet-500 via-sky-500 to-fuchsia-400 shadow-[0_0_16px_rgba(56,189,248,0.35)]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span>Competition</span>
                <ShieldHalf className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">Moderate</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                SERP leaders skew editorial; interactive gaps remain in mid-funnel.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/50 bg-slate-900/[0.03] p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <Waves className="h-3.5 w-3.5 text-fuchsia-500" strokeWidth={2} />
              Trend synthesis
            </div>
            <div className="mt-3 flex h-16 items-end gap-1">
              {[28, 42, 36, 55, 48, 62, 58, 70, 66, 78, 74, 88].map((pct, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-slate-200/80 to-sky-500/70"
                  style={{ height: `${pct}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/60 bg-white/50 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
            Growth prediction
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            If you ship a flagship asset within 14 days and attach two supporting tools, modeled
            organic lift lands in the{" "}
            <span className="font-semibold text-violet-700">+18–34%</span> range for qualified
            sessions—assuming baseline technical health.
          </p>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-[1.5rem] border border-violet-200/40 bg-gradient-to-b from-violet-500/[0.06] to-white/60 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-slate-900">AI recommendations</h3>
          <ul className="mt-3 space-y-3">
            {RECS.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50/40 p-5 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-900">Niche intelligence</h3>
          <div className="mt-3 space-y-2">
            {NICHES.map((n) => (
              <div
                key={n.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.label}</p>
                  <p className="text-[11px] text-slate-500">{n.note}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">
                  {n.score}
                  <ArrowUpRight className="h-3 w-3 opacity-80" />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/50 bg-gradient-to-br from-sky-500/5 to-fuchsia-500/5 p-5 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-900">Monetization signals</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Lead routing", "Tool upsell", "Newsletter bridge", "Affiliate fit"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-slate-600 backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
