import { Activity, Cpu, Orbit, Radio } from "lucide-react";

interface StartWelcomeHeroProps {
  firstName: string;
}

function IntelBars() {
  const heights = [40, 72, 52, 88, 48, 96, 56, 78, 44, 100, 62, 84];
  return (
    <div className="flex h-36 items-end justify-center gap-1 sm:gap-1.5" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 origin-bottom rounded-full bg-gradient-to-t from-sky-500/30 via-violet-500/70 to-fuchsia-400/50 shadow-[0_0_12px_rgba(139,92,246,0.35)] animate-tm-bar sm:w-1.5"
          style={{
            height: `${h}%`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function StartWelcomeHero({ firstName }: StartWelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-gradient-to-br from-slate-50/90 via-white/50 to-violet-50/40 p-6 sm:p-8 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_24px_64px_-24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/25 via-sky-400/15 to-fuchsia-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-sky-400/10 blur-2xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
            <Orbit className="h-3.5 w-3.5 text-violet-500" strokeWidth={2} />
            Your growth workspace
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[2rem] leading-[1.15]">
            Welcome back,
            <span className="block bg-gradient-to-r from-violet-600 via-sky-600 to-fuchsia-500 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            Traffic Magnet is scanning market structure, intent clusters, and monetization paths. Your
            workspace prioritizes the highest-leverage moves—so you build assets that compound, not
            campaigns that decay.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 px-3 py-2 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-700">Live models</span>
              <span className="text-[11px] text-slate-500">routing</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 px-3 py-2 shadow-sm backdrop-blur-md">
              <Cpu className="h-3.5 w-3.5 text-sky-600" strokeWidth={2} />
              <span className="text-xs font-semibold text-slate-700">Reasoning depth</span>
              <span className="text-[11px] text-slate-500">high</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 px-3 py-2 shadow-sm backdrop-blur-md">
              <Radio className="h-3.5 w-3.5 text-violet-600" strokeWidth={2} />
              <span className="text-xs font-semibold text-slate-700">Signals</span>
              <span className="text-[11px] text-slate-500">in sync</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Demand index", value: "84", delta: "+6.2", icon: Activity },
              { label: "Intent depth", value: "72", delta: "+3.1", icon: Cpu },
              { label: "Moat score", value: "61", delta: "+1.4", icon: Orbit },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200/50 bg-slate-900/[0.03] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <s.icon className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    {s.delta}
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-2xl">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[220px] flex-col justify-between rounded-2xl border border-slate-200/50 bg-gradient-to-b from-white/60 to-slate-50/30 p-5 shadow-inner backdrop-blur-md lg:min-h-[280px]">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <span>Neural activity</span>
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-violet-700">real-time</span>
          </div>
          <IntelBars />
          <p className="text-center text-[11px] leading-relaxed text-slate-500">
            Latency-aware synthesis · cross-channel corroboration · niche stability scoring
          </p>
        </div>
      </div>
    </section>
  );
}
