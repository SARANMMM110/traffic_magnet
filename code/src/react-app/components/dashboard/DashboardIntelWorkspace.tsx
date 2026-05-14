import { Link } from "react-router";
import {
  Activity,
  ArrowUpRight,
  CircuitBoard,
  Cpu,
  Gauge,
  Layers3,
  LineChart,
  Radar,
  Satellite,
  ShieldCheck,
  Telescope,
  Workflow,
} from "lucide-react";
import type { DashboardStats } from "./dashboardTypes";

interface DashboardIntelWorkspaceProps {
  userName: string;
  stats: DashboardStats | null;
  loading: boolean;
  nicheCount: number;
}

function MetricOrb({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function SparkStrip({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-14 items-end gap-1" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600/40 via-sky-500/50 to-fuchsia-400/40"
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

const FEED_SEED = [
  { title: "Intent clustering refreshed", meta: "Signals · 12m window", tone: "violet" },
  { title: "SERP volatility easing in mid-tail", meta: "Market · monitored", tone: "sky" },
  { title: "Blueprint drift within tolerance", meta: "Quality gate", tone: "emerald" },
] as const;

export default function DashboardIntelWorkspace({
  userName,
  stats,
  loading,
  nicheCount,
}: DashboardIntelWorkspaceProps) {
  const pc = stats?.projectCount ?? 0;
  const tc = stats?.toolCount ?? 0;
  const bc = stats?.builtToolCount ?? 0;
  const sc = stats?.seoPageCount ?? 0;
  const publishRatio = tc > 0 ? Math.round((bc / tc) * 100) : 0;
  const momentum = [pc * 3 + 2, tc + 4, nicheCount * 5 + 1, sc * 2 + 3, pc + tc, 8, 6, 10].map((n) =>
    Math.min(14, n),
  );

  return (
    <div className="font-tm space-y-6">
      {/* Command strip */}
      <section className="relative overflow-hidden rounded-[1.5rem] border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.65)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(139,92,246,0.22),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(56,189,248,0.12),transparent)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <Radar className="h-3.5 w-3.5 text-sky-400" strokeWidth={2} />
              Intelligence workspace
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {userName}, your growth stack is live.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[15px]">
              Traffic Magnet is continuously scoring opportunities, blueprint health, and publish
              readiness—so you steer from signal, not noise.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-violet-50"
              >
                <Cpu className="h-4 w-4 text-violet-600" strokeWidth={2} />
                New workspace
              </Link>
              <Link
                to="/content"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Layers3 className="h-4 w-4 text-sky-300" strokeWidth={2} />
                Content surfaces
              </Link>
            </div>
          </div>
          <div className="w-full max-w-xs shrink-0 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Momentum</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Activity className="h-3 w-3" strokeWidth={2} />
                live
              </span>
            </div>
            <SparkStrip values={momentum} />
          </div>
        </div>
      </section>

      {/* Bento intelligence */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-violet-50/30 p-5 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <CircuitBoard className="h-4 w-4 text-violet-600" strokeWidth={2} />
              AI opportunity feed
            </div>
            <ul className="mt-4 space-y-3">
              {FEED_SEED.map((row) => (
                <li
                  key={row.title}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100/90 bg-white/70 px-3 py-2.5 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                    <p className="text-[11px] text-slate-500">{row.meta}</p>
                  </div>
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      row.tone === "violet"
                        ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                        : row.tone === "sky"
                          ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                          : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    }`}
                  />
                </li>
              ))}
              {!loading && pc > 0 && (
                <li className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 text-sm text-violet-900">
                  <span className="font-semibold">{pc} active workspace(s)</span>
                  <span className="text-violet-700/90"> — routing models to your latest briefs.</span>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <Telescope className="h-4 w-4 text-sky-600" strokeWidth={2} />
              Market intelligence
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Cross-niche demand is stable. Programmatic gaps favor interactive assets with embedded
              calculators—align your next blueprint to commercial intent.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Buyer intent", "Tool-led SERPs", "Topical depth"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-2">
          <MetricOrb
            label="Growth index"
            value={loading ? "—" : `${Math.min(99, pc * 7 + tc * 3 + 12)}`}
            hint="Composite of velocity + coverage"
          />
          <MetricOrb
            label="Monetization signal"
            value={loading ? "—" : tc > 0 ? `${Math.min(100, publishRatio + 24)}` : "—"}
            hint="Publish-ready vs. planned assets"
          />

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:col-span-2 sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <LineChart className="h-4 w-4 text-fuchsia-600" strokeWidth={2} />
                Traffic momentum
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                +{loading ? "—" : Math.max(0, tc - bc + 2)} delta
              </span>
            </div>
            <div className="mt-4 h-24 rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white px-2 pt-3">
              <SparkStrip values={[4, 7, 5, 9, 6, 11, 8, 12, 10, 13].map((x) => x + (tc % 5))} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-violet-50/90 to-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-violet-600" strokeWidth={2} />
              Blueprint health
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums text-slate-900">
                {loading ? "—" : `${publishRatio}%`}
              </span>
              <span className="mb-1 text-xs font-semibold text-slate-500">coverage</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-500"
                style={{ width: `${loading ? 0 : publishRatio}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <Satellite className="h-4 w-4 text-sky-600" strokeWidth={2} />
              Asset performance
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{loading ? "—" : tc}</p>
            <p className="text-xs text-slate-500">tools in orbit</p>
            <p className="mt-2 text-xs text-slate-600">
              {loading ? "—" : `${bc} publish-ready · ${sc} SEO surfaces indexed in workspace.`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-900/[0.03] p-5 shadow-inner sm:col-span-2 sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  <Workflow className="h-4 w-4 text-violet-600" strokeWidth={2} />
                  Revenue optimization
                </div>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Favor hybrid monetization on assets with calculator intent—lift modeled at{" "}
                  <span className="font-semibold text-violet-700">
                    {loading ? "—" : `${12 + (pc % 5) * 3}–${28 + (tc % 4) * 4}%`}
                  </span>{" "}
                  when publish coverage clears {Math.min(85, 40 + publishRatio)}%.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3">
                <Gauge className="h-8 w-8 text-violet-500" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Niche spread
                  </p>
                  <p className="text-lg font-bold text-slate-900">{loading ? "—" : nicheCount}</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-300" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
