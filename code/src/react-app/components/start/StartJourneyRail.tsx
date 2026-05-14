import { Check, GitBranch } from "lucide-react";

const STEPS = [
  { id: 1, title: "Choose market", phase: "Discovery" },
  { id: 2, title: "Select revenue model", phase: "Economics" },
  { id: 3, title: "Configure assets", phase: "Systems" },
  { id: 4, title: "Generate blueprint", phase: "Design" },
  { id: 5, title: "Launch growth system", phase: "Ship" },
];

interface StartJourneyRailProps {
  activeIndex: number;
}

export default function StartJourneyRail({ activeIndex }: StartJourneyRailProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/50 bg-slate-950/[0.02] p-5 sm:p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.25)] backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-600">
            <GitBranch className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Onboarding journey
            </h2>
            <p className="text-xs text-slate-500">
              Connected workflow nodes · glass indicators · AI checkpoints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-600 backdrop-blur-sm">
          <span className="text-violet-600">{activeIndex}</span>
          <span className="text-slate-400">/</span>
          <span>{STEPS.length}</span>
          <span className="hidden sm:inline text-slate-400">·</span>
          <span className="hidden sm:inline text-slate-500">active lane</span>
        </div>
      </div>

      <div className="relative mt-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-[640px] items-start px-1 sm:min-w-0 sm:px-0">
          {STEPS.map((step, i) => {
            const done = i < activeIndex - 1;
            const active = i === activeIndex - 1;
            const last = i === STEPS.length - 1;

            return (
              <div key={step.id} className="flex min-w-0 flex-1 items-start">
                <div className="flex w-[88px] shrink-0 flex-col items-center sm:w-[104px]">
                  <div
                    className={`
                      relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xs font-bold transition-all duration-300
                      ${
                        active
                          ? "border-violet-400/50 bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_12px_32px_-8px_rgba(124,58,237,0.55)]"
                          : done
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700"
                            : "border-slate-200/80 bg-white/70 text-slate-400"
                      }
                    `}
                  >
                    {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : step.id}
                    {active && (
                      <span className="pointer-events-none absolute -inset-1 rounded-2xl border border-violet-400/40 animate-pulse" />
                    )}
                  </div>
                  <p
                    className={`mt-2.5 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                      active ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
                    {step.phase}
                  </p>
                </div>
                {!last && (
                  <div className="mt-[22px] h-px min-w-[8px] flex-1 border-t border-dashed border-slate-300/90 sm:min-w-[12px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
