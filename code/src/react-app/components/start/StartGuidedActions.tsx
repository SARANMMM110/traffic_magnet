import {
  ArrowRight,
  CircleDot,
  Layers3,
  LineChart,
  Satellite,
  Workflow,
} from "lucide-react";
import { useNavigate } from "react-router";

const ACTIONS = [
  {
    title: "Initialize growth project",
    hint: "AI selects structure, schema, and publish path.",
    status: "Ready",
    tone: "emerald",
    icon: Workflow,
    step: "Step 01",
    to: "/projects/new",
  },
  {
    title: "Calibrate revenue model",
    hint: "Attach monetization logic to your asset surface.",
    status: "Queued",
    tone: "amber",
    icon: LineChart,
    step: "Step 02",
    to: "/projects/new",
  },
  {
    title: "Deploy intelligence layer",
    hint: "Wire analytics, events, and refresh loops.",
    status: "After blueprint",
    tone: "slate",
    icon: Satellite,
    step: "Step 03",
    to: "/dashboard",
  },
];

const toneRing: Record<string, string> = {
  emerald: "border-emerald-500/25 bg-emerald-500/[0.06]",
  amber: "border-amber-500/25 bg-amber-500/[0.07]",
  slate: "border-slate-300/80 bg-slate-500/[0.04]",
};

export default function StartGuidedActions() {
  const navigate = useNavigate();

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Guided actions
          </h2>
          <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Workflow cards with status, depth, and next move
          </p>
        </div>
        <p className="text-xs text-slate-500">Select a lane to advance your operating system.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <button
            key={a.title}
            type="button"
            onClick={() => navigate(a.to)}
            className={`
              group relative flex flex-col rounded-[1.35rem] border p-5 text-left transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.22)]
              ${toneRing[a.tone] ?? toneRing.slate}
              border-slate-200/60 bg-white/55 backdrop-blur-md
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <CircleDot className="h-3 w-3 text-violet-500" />
                {a.step}
              </span>
              <span
                className={`
                rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
                ${
                  a.status === "Ready"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : a.status === "Queued"
                      ? "bg-amber-500/15 text-amber-800"
                      : "bg-slate-500/10 text-slate-600"
                }
              `}
              >
                {a.status}
              </span>
            </div>

            <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/60 bg-white/80 text-slate-700 shadow-sm transition-colors group-hover:border-violet-200 group-hover:text-violet-700">
              <a.icon className="h-5 w-5" strokeWidth={2} />
            </div>

            <h3 className="mt-3 text-sm font-bold leading-snug text-slate-900">{a.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{a.hint}</p>

            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-violet-600 transition-colors group-hover:text-violet-700">
              Continue
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 px-4 py-3 text-xs text-slate-600 backdrop-blur-sm">
        <Layers3 className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
        <span>
          <span className="font-semibold text-slate-800">Suggestion:</span> start with project
          initialization—Traffic Magnet will lock schema, render engine, and publishing cadence before
          downstream steps.
        </span>
      </div>
    </section>
  );
}
