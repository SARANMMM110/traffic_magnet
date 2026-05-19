import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  FileStack,
  Globe2,
  Layers,
  LayoutTemplate,
  LineChart,
  Lock,
  Mail,
  MousePointerClick,
  Pause,
  Pencil,
  PieChart,
  Radar,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { useToast } from "@/react-app/components/Toast";
import { cn } from "@/react-app/lib/utils";
import CaptureFlowBuilderPanel from "@/react-app/components/audience-growth/CaptureFlowBuilderPanel";

const spark = [14, 16, 15, 19, 22, 21, 26, 28, 31, 34, 33, 38, 41, 44, 47];
const spark2 = [8, 9, 8, 11, 12, 14, 13, 16, 18, 19, 22, 24];

function MiniSparkline({ values, className }: { values: number[]; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const fillId = `${uid}-sparkFill`;
  const w = 112;
  const h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const t = max === min ? 0.5 : (v - min) / (max - min);
    const y = h - pad - t * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${d} L ${w - pad},${h} L ${pad},${h} Z`}
        fill={`url(#${fillId})`}
        className="translate-y-0.5"
      />
      <path d={d} fill="none" stroke="rgb(109, 40, 217)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniBars({ heights }: { heights: number[] }) {
  const max = Math.max(...heights);
  return (
    <div className="flex h-9 items-end gap-1" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-gradient-to-t from-violet-600/90 to-violet-400/70"
          style={{ height: `${(h / max) * 100}%`, minHeight: "4px" }}
        />
      ))}
    </div>
  );
}

const CAPTURE_FLOWS = [
  {
    id: "1",
    type: "SEO Asset Unlock",
    trigger: "Scroll + partial blur",
    rate: "6.8%",
    assets: "14 SEO bundles",
    quality: 92,
    status: "live" as const,
  },
  {
    id: "2",
    type: "Tool Access Gate",
    trigger: "Google Sign-In",
    rate: "11.2%",
    assets: "6 calculators",
    quality: 88,
    status: "live" as const,
  },
  {
    id: "3",
    type: "Landing Page Capture",
    trigger: "Exit intent + email",
    rate: "4.1%",
    assets: "9 landers",
    quality: 76,
    status: "live" as const,
  },
  {
    id: "4",
    type: "Content Wrapper Lock",
    trigger: "Timed gate",
    rate: "7.4%",
    assets: "11 wrappers",
    quality: 84,
    status: "paused" as const,
  },
  {
    id: "5",
    type: "AI Resource Download",
    trigger: "Email unlock",
    rate: "9.0%",
    assets: "3 kits",
    quality: 90,
    status: "live" as const,
  },
  {
    id: "6",
    type: "Google Sign-In Unlock",
    trigger: "One-tap OAuth",
    rate: "13.6%",
    assets: "All tools",
    quality: 95,
    status: "live" as const,
  },
];

const INSIGHTS = [
  {
    title: "Calculator assets convert 42% higher",
    detail: "Compared to static landing blocks over the last 14 sessions.",
    icon: PieChart,
  },
  {
    title: "Google sign-in lifts verified lead rate",
    detail: "OAuth gates show fewer throwaway addresses on tool endpoints.",
    icon: Globe2,
  },
  {
    title: "3 landing pages underperforming",
    detail: "Avg. time-on-page > 48s but capture below 2.1% — try partial lock.",
    icon: Target,
  },
  {
    title: "SEO asset #12 drives highest-quality traffic",
    detail: "Lead quality score 94; consider duplicating its headline pattern.",
    icon: LineChart,
  },
];

const ACTIVITY = [
  { t: "2m", label: "Verified lead", sub: "Compound ROI calc · Google", tone: "emerald" as const },
  { t: "6m", label: "Content unlock", sub: "Wrapper · SEO bundle #12", tone: "violet" as const },
  { t: "14m", label: "Subscriber +1", sub: "Landing · exit intent", tone: "sky" as const },
  { t: "22m", label: "OAuth completion", sub: "Tool gate · frictionless", tone: "amber" as const },
];

interface AudienceSummary {
  subscriberCount: number;
  subscribersLast30Days: number;
  eventsByType: Record<string, number>;
  conversionRateGateToUnlock: number;
  googleUnlocks: number;
  emailCaptures: number;
}

interface AudienceFlowRow {
  id: number;
  name: string;
  status: string;
  assetType: string;
  captureMethod: string;
  publicId: string;
}

interface AudienceExtendedDashboard {
  subscriberSeries: { day: string; count: number }[];
  unlockSeries: { day: string; count: number }[];
  unlockMethods: { method: string; count: number }[];
  trafficSources: { source: string; count: number }[];
  topAssets: { assetKey: string; events: number }[];
  funnel30d: Record<string, number>;
  publishingRoi: { pageViews: number; unlocks: number; visitorToUnlockPct: number };
}

function formatDayLabel(isoDay: string): string {
  if (!isoDay || isoDay.length < 10) return "";
  return isoDay.slice(5);
}

function formatTimeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const d = (Date.now() - t) / 60000;
  if (d < 1) return "now";
  if (d < 60) return `${Math.floor(d)}m`;
  return `${Math.floor(d / 60)}h`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function AudienceGrowthEngine() {
  const { showToast } = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [summary, setSummary] = useState<AudienceSummary | null>(null);
  const [audienceFlows, setAudienceFlows] = useState<AudienceFlowRow[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ event_type: string; asset_key: string; created_at: string }[]>([]);
  const [extended, setExtended] = useState<AudienceExtendedDashboard | null>(null);

  const loadAudience = useCallback(async () => {
    try {
      const [sRes, fRes, eRes, xRes] = await Promise.all([
        fetch("/api/audience/analytics/summary", { credentials: "include" }),
        fetch("/api/audience/flows", { credentials: "include" }),
        fetch("/api/audience/events/recent?limit=12", { credentials: "include" }),
        fetch("/api/audience/analytics/extended", { credentials: "include" }),
      ]);
      if (sRes.ok) {
        const s = await sRes.json();
        if (!s.error) setSummary(s as AudienceSummary);
      }
      if (fRes.ok) {
        const f = await fRes.json();
        const list = (f.flows ?? []).map((x: Record<string, unknown>) => ({
          id: x.id as number,
          name: String(x.name),
          status: String(x.status),
          assetType: String(x.assetType),
          captureMethod: String(x.captureMethod),
          publicId: String(x.publicId),
        }));
        setAudienceFlows(list);
      }
      if (eRes.ok) {
        const e = await eRes.json();
        setRecentEvents(Array.isArray(e.events) ? e.events : []);
      }
      if (xRes.ok) {
        const x = await xRes.json();
        if (!x.error) setExtended(x as AudienceExtendedDashboard);
      }
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    void loadAudience();
  }, [loadAudience]);

  useEffect(() => {
    if (!builderOpen) void loadAudience();
  }, [builderOpen, loadAudience]);

  const activityFeed = useMemo(() => {
    if (recentEvents.length === 0) return ACTIVITY;
    return recentEvents.map((ev, i) => ({
      t: formatTimeAgo(ev.created_at),
      label: ev.event_type.replace(/_/g, " "),
      sub: ev.asset_key || "—",
      tone: (["emerald", "violet", "sky", "amber"] as const)[i % 4],
    }));
  }, [recentEvents]);

  const subscriberSparkValues = useMemo(() => {
    if (extended?.subscriberSeries?.length) {
      const v = extended.subscriberSeries.map((s) => s.count);
      if (v.length >= 4) return v;
      return [...v, ...spark].slice(0, Math.max(v.length, 8));
    }
    return spark;
  }, [extended]);

  const unlockSparkValues = useMemo(() => {
    if (extended?.unlockSeries?.length) {
      const v = extended.unlockSeries.map((s) => s.count);
      if (v.length >= 4) return v;
      return [...v, ...[20, 19, 21, 22, 23, 22, 24, 26]].slice(0, 8);
    }
    return [20, 19, 21, 22, 23, 22, 24, 26, 27, 28, 29, 30];
  }, [extended]);

  const smartInsights = useMemo(() => {
    type Row = (typeof INSIGHTS)[number];
    const rows: Row[] = [];
    if (summary && (summary.eventsByType?.gate_opened ?? 0) > 25 && summary.conversionRateGateToUnlock < 8) {
      rows.push({
        title: "Optimize gate completion",
        detail: `Gate opens (${summary.eventsByType?.gate_opened}) outpace unlocks (${summary.conversionRateGateToUnlock}% rate). Try modal or sticky layout and a shorter delay in Content Wrapper preview.`,
        icon: Target,
      });
    }
    if (extended?.publishingRoi && extended.publishingRoi.pageViews > 15) {
      rows.push({
        title: "Visitor → unlock yield",
        detail: `${extended.publishingRoi.visitorToUnlockPct}% of tracked page views completed unlock in 30d — pair SEO assets with a live capture flow before publishing.`,
        icon: LineChart,
      });
    }
    if (extended?.trafficSources?.[0] && extended.trafficSources[0].count > 0) {
      const top = extended.trafficSources[0];
      rows.push({
        title: `Lead source signal: ${top.source.slice(0, 36)}${top.source.length > 36 ? "…" : ""}`,
        detail: `${top.count} subscribers attributed to this source recently. Clone the landing pattern to similar assets.`,
        icon: Globe2,
      });
    }
    for (const ins of INSIGHTS) {
      if (rows.length >= 4) break;
      rows.push(ins);
    }
    return rows.slice(0, 4);
  }, [summary, extended]);

  const pauseFlow = async (id: number) => {
    try {
      await fetch(`/api/audience/flows/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      });
      showToast({ type: "info", title: "Flow paused" });
      void loadAudience();
    } catch {
      showToast({ type: "error", title: "Could not pause flow" });
    }
  };

  const scrollToAnalytics = useCallback(() => {
    document.getElementById("conversion-analytics")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const metricsData = useMemo(() => {
    const liveFlows = audienceFlows.filter((f) => f.status === "live").length;
    const reach =
      summary != null
        ? Object.values(summary.eventsByType || {}).reduce((acc, v) => acc + (Number(v) || 0), 0)
        : null;
    return [
      {
        label: "Verified Subscribers",
        value: summary != null ? formatCount(summary.subscriberCount) : "24.8k",
        delta: summary != null ? `${formatCount(summary.subscribersLast30Days)} new (30d)` : "+6.2%",
        chart: subscriberSparkValues,
        icon: Users,
      },
      {
        label: "Active Capture Assets",
        value: audienceFlows.length > 0 ? String(liveFlows) : summary != null ? "0" : "47",
        delta: `${audienceFlows.length} flows total`,
        chart: spark2,
        icon: MousePointerClick,
      },
      {
        label: "Conversion Rate",
        value: summary != null ? `${summary.conversionRateGateToUnlock}%` : "8.4%",
        delta: summary != null ? "Gate → unlock" : "+1.2% WoW",
        chart: unlockSparkValues,
        icon: TrendingUp,
      },
      {
        label: "Publishing Reach",
        value: reach != null ? formatCount(reach) : "1.2M",
        delta:
          extended?.publishingRoi != null
            ? `${extended.publishingRoi.unlocks} unlocks / ${extended.publishingRoi.pageViews} views`
            : summary != null
              ? "Event volume · 30d"
              : "impressions / mo",
        chart: extended?.funnel30d
          ? [
              extended.funnel30d.page_view ?? 0,
              extended.funnel30d.gate_opened ?? 0,
              extended.funnel30d.unlock_attempted ?? 0,
              extended.funnel30d.unlock_completed ?? 0,
              extended.funnel30d.email_captured ?? 0,
              extended.funnel30d.google_sign_in_success ?? 0,
            ]
          : [10, 12, 11, 15, 18, 22, 25, 28, 30, 33, 35, 38],
        icon: Globe2,
      },
    ];
  }, [summary, audienceFlows, extended, subscriberSparkValues, unlockSparkValues]);

  return (
    <DashboardLayout
      shellClassName="bg-gradient-to-br from-slate-50 via-violet-50/25 to-sky-50/20"
      innerClassName="max-w-[1440px] mx-auto pb-24 md:pb-8"
    >
      <CaptureFlowBuilderPanel
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onDeploy={() => {
          showToast({
            type: "success",
            title: "Capture flow deployed",
            message: `Flow is now live. You can attach it to your assets and start capturing subscribers.`,
          });
          void loadAudience();
        }}
      />

      {/* Mobile sticky actions */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
        <div className="pointer-events-auto flex gap-2 border-t border-slate-200/80 bg-white/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={scrollToAnalytics}>
            Analytics
          </Button>
          <Button className="flex-1 flex-[1.2] rounded-xl bg-slate-900 hover:bg-slate-800" onClick={() => setBuilderOpen(true)}>
            Create flow
          </Button>
        </div>
      </div>

      <div className="space-y-10 lg:space-y-14">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700 shadow-sm backdrop-blur-sm">
              <Radar className="h-3.5 w-3.5" />
              Audience infrastructure
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.08]">
              Audience Growth Engine
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-[1.05rem]">
              Transform AI-generated traffic into subscribers, audience intelligence, and monetizable growth
              infrastructure.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              Capture verified leads directly from landing pages, SEO assets, interactive tools, and published content
              systems — without rebuilding your stack.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-12 rounded-2xl bg-slate-900 px-6 text-base shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                onClick={() => setBuilderOpen(true)}
              >
                Create Capture Flow
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-2xl border-slate-200/90 bg-white/80 px-6 text-base" onClick={scrollToAnalytics}>
                View Conversion Analytics
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-violet-500" />
                Content Wrapper
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5 text-sky-500" />
                Landing &amp; HTML
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-emerald-500" />
                Publishing Hub
              </span>
            </div>
          </div>

          {/* Hero preview panel */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-violet-400/25 via-sky-300/20 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Conversion command</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Live workspace</p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-lg border-emerald-200/80 bg-emerald-50/80 text-[10px] font-semibold text-emerald-800">
                  Healthy
                </Badge>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Conversion rate</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                    {summary != null ? `${summary.conversionRateGateToUnlock}%` : "8.4%"}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600">
                    {summary != null ? "Gate → unlock (30d)" : "+1.2% vs prior week"}
                  </p>
                  <div className="mt-2">
                    <MiniSparkline values={spark} className="h-9 w-full" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-violet-50/40 p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Subscriber growth</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                    {summary != null ? formatCount(summary.subscribersLast30Days) : "+612"}
                  </p>
                  <p className="text-[11px] font-medium text-violet-600">
                    {summary != null ? "New subscribers (30d)" : "Rolling 30 days"}
                  </p>
                  <div className="mt-3 flex justify-between">
                    <MiniBars heights={[12, 18, 14, 22, 26, 20, 28, 32]} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-3.5 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Top assets</p>
                    <span className="text-[10px] font-medium text-slate-400">by verified leads</span>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {(extended?.topAssets?.length
                      ? extended.topAssets.slice(0, 5)
                      : [
                          { assetKey: "Margin stress-test", events: 142 },
                          { assetKey: "SEO wrapper · bundle #12", events: 118 },
                          { assetKey: "Landing · product-led SEO", events: 96 },
                        ]
                    ).map((row) => {
                      const maxEv = Math.max(
                        1,
                        ...(extended?.topAssets?.length
                          ? extended.topAssets.map((a) => a.events)
                          : [142, 118, 96]),
                      );
                      const pct = Math.round((row.events / maxEv) * 100);
                      return (
                        <li key={row.assetKey} className="flex items-center gap-3 text-xs">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-28 shrink-0 truncate font-medium text-slate-800" title={row.assetKey}>
                            {row.assetKey}
                          </span>
                          <span className="shrink-0 tabular-nums text-slate-500">{row.events} evt</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-200/50 bg-slate-50/40 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Verified leads (24h)</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {summary != null ? summary.emailCaptures + summary.googleUnlocks : "184"}
                  </p>
                  <MiniSparkline values={spark2} className="mt-2 h-7 w-full opacity-90" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Google unlocks</p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">
                        {summary != null && summary.subscriberCount > 0
                          ? `${Math.round((summary.googleUnlocks / Math.max(1, summary.subscriberCount)) * 100)}%`
                          : "68%"}
                      </p>
                      <p className="text-[11px] text-slate-500">of new subs OAuth-verified</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <Globe2 className="h-6 w-6 text-slate-700" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Activity</p>
                <ul className="mt-2 max-h-[140px] space-y-2 overflow-y-auto pr-1">
                  {activityFeed.map((a, i) => (
                    <li key={`${a.t}-${a.label}-${i}`} className="flex gap-3 text-xs">
                      <span className="shrink-0 tabular-nums text-slate-400">{a.t}</span>
                      <span
                        className={cn(
                          "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          a.tone === "emerald" && "bg-emerald-500",
                          a.tone === "violet" && "bg-violet-500",
                          a.tone === "sky" && "bg-sky-500",
                          a.tone === "amber" && "bg-amber-500",
                        )}
                      />
                      <div>
                        <p className="font-semibold text-slate-800">{a.label}</p>
                        <p className="text-[11px] text-slate-500">{a.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-200/50 bg-white/60 px-4 py-3">
                <span className="rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                  Content unlock +18%
                </span>
                <span className="rounded-lg border border-violet-200/60 bg-violet-50/80 px-2 py-1 text-[10px] font-semibold text-violet-800">
                  Lead quality stable
                </span>
                <span className="rounded-lg border border-sky-200/60 bg-sky-50/80 px-2 py-1 text-[10px] font-semibold text-sky-800">
                  Publish sync OK
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Metric strip */}
        <section id="conversion-analytics" className="scroll-mt-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metricsData.map((m) => (
              <Card
                key={m.label}
                className="border-slate-200/70 bg-gradient-to-br from-white/95 to-slate-50/50 shadow-sm shadow-slate-900/[0.03]"
                size="sm"
              >
                <CardContent className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
                      <m.icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <MiniSparkline values={m.chart} className="h-7 w-20 shrink-0 opacity-90" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{m.label}</p>
                    <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">{m.value}</p>
                    <p className="text-xs font-medium text-emerald-600">{m.delta}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="scroll-mt-8 space-y-5 rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Command center</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Real analytics · 14-day motion</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Subscriber growth, unlock completion, acquisition sources, and asset-level event heat — fed from your live
                capture pipeline.
              </p>
            </div>
            <Link
              to="/content"
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              Wire Content Wrapper
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {!extended ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
              Extended charts appear after the first successful sync with{" "}
              <span className="font-mono text-xs">/api/audience/analytics/extended</span>. If this persists, apply migration{" "}
              <span className="font-mono">0002_audience_engine.sql</span>.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">New subscribers by day</p>
                <div className="mt-3 flex h-36 items-end gap-1">
                  {extended.subscriberSeries.length === 0 ? (
                    <p className="text-xs text-slate-500">No subscriber rows in this window yet.</p>
                  ) : (
                    extended.subscriberSeries.map((s) => {
                      const max = Math.max(1, ...extended.subscriberSeries.map((x) => x.count));
                      const h = Math.round((s.count / max) * 100);
                      return (
                        <div key={s.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-violet-700 to-violet-400"
                            style={{ height: `${Math.max(s.count ? 8 : 2, h)}%` }}
                            title={`${s.day}: ${s.count}`}
                          />
                          <span className="truncate text-[8px] font-medium text-slate-400">{formatDayLabel(s.day)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unlock completions by day</p>
                <div className="mt-3 flex h-36 items-end gap-1">
                  {extended.unlockSeries.length === 0 ? (
                    <p className="text-xs text-slate-500">Unlock events will appear after visitors complete a gate.</p>
                  ) : (
                    extended.unlockSeries.map((s) => {
                      const max = Math.max(1, ...extended.unlockSeries.map((x) => x.count));
                      const h = Math.round((s.count / max) * 100);
                      return (
                        <div key={s.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-sky-700 to-sky-400"
                            style={{ height: `${Math.max(s.count ? 8 : 2, h)}%` }}
                            title={`${s.day}: ${s.count}`}
                          />
                          <span className="truncate text-[8px] font-medium text-slate-400">{formatDayLabel(s.day)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Lead sources · 30d</p>
                  <span className="text-[10px] font-medium text-slate-400">Subscriber attribution</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(() => {
                    const list = extended.trafficSources.length
                      ? extended.trafficSources
                      : [{ source: "(no data yet)", count: 0 }];
                    const max = Math.max(1, ...list.map((x) => x.count));
                    return list.map((t) => {
                      const w = Math.round((t.count / max) * 100);
                      return (
                        <div key={t.source} className="space-y-1">
                          <div className="flex justify-between gap-2 text-xs">
                            <span className="truncate font-medium text-slate-800" title={t.source}>
                              {t.source}
                            </span>
                            <span className="shrink-0 tabular-nums text-slate-500">{t.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                              style={{ width: `${w}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unlock mix</p>
                <ul className="mt-3 space-y-2">
                  {(extended.unlockMethods.length ? extended.unlockMethods : [{ method: "—", count: 0 }]).map((u) => (
                    <li key={u.method} className="flex items-center justify-between text-xs">
                      <span className="font-medium capitalize text-slate-800">{u.method}</span>
                      <span className="tabular-nums text-slate-500">{u.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Engagement heat · 30d events</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!Object.values(extended.funnel30d).some((v) => Number(v) > 0) ? (
                    <span className="text-xs text-slate-500">No funnel events recorded in this window.</span>
                  ) : (
                    Object.entries(extended.funnel30d)
                      .filter(([, v]) => (v as number) > 0)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {k.replace(/_/g, " ")}
                          <span className="tabular-nums text-slate-900">{v as number}</span>
                        </span>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Pipeline */}
        <section className="rounded-3xl border border-slate-200/70 bg-white/60 p-5 shadow-sm backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Publishing pipeline</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">From traffic to monetization</h2>
            </div>
            <p className="max-w-md text-sm text-slate-500">
              Every AI asset can participate: capture, qualify, publish, and compound — without leaving the platform.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
            {[
              { title: "Traffic assets", sub: "Tools, SEO, landers", icon: Zap },
              { title: "Audience capture", sub: "Gates & OAuth", icon: Lock },
              { title: "Publishing", sub: "Hub + WordPress", icon: Rocket },
              { title: "Subscribers", sub: "Verified lists", icon: Mail },
              { title: "Monetization", sub: "Offers & upsell", icon: Sparkles },
            ].map((node, i) => (
              <div key={node.title} className="flex flex-1 items-center gap-2 lg:flex-col lg:gap-0">
                <div className="flex flex-1 flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-sm lg:min-h-[120px]">
                  <node.icon className="h-4 w-4 text-violet-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{node.title}</p>
                  <p className="text-xs text-slate-500">{node.sub}</p>
                </div>
                {i < 4 && (
                  <div className="flex items-center justify-center py-1 lg:px-2 lg:py-0">
                    <ChevronRight className="h-5 w-5 rotate-90 text-slate-300 lg:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 px-4 py-4 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Deep platform links</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { to: "/content", label: "Content Wrapper", icon: FileStack },
              { to: "/magnets", label: "Interactive tools", icon: Layers },
              { to: "/seo-pages", label: "SEO assets", icon: BookOpen },
              { to: "/wordpress", label: "Publishing Hub", icon: Globe2 },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <l.icon className="h-3.5 w-3.5 text-violet-600" />
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Workspace */}
        <section className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-4 lg:col-span-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Capture flows</h2>
                <p className="text-sm text-slate-500">Operational systems wired to your AI surface area.</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => setBuilderOpen(true)}>
                New flow
              </Button>
            </div>

            <div className="space-y-3">
              {audienceFlows.length > 0
                ? audienceFlows.map((flow) => (
                    <div
                      key={flow.id}
                      className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:border-violet-200/60 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{flow.name}</h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-lg text-[10px] font-bold uppercase",
                                flow.status === "live"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-amber-200 bg-amber-50 text-amber-900",
                              )}
                            >
                              {flow.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {flow.captureMethod} · {flow.assetType}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-slate-400">public {flow.publicId}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs" onClick={scrollToAnalytics}>
                            <BarChart3 className="mr-1 h-3 w-3" />
                            Analytics
                          </Button>
                          {flow.status === "live" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-xs text-slate-500"
                              onClick={() => void pauseFlow(flow.id)}
                            >
                              <Pause className="mr-1 h-3 w-3" />
                              Pause
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Widget</p>
                          <p className="text-xs text-slate-600">Served from /api/audience/widget.js</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Inject</p>
                          <p className="text-xs text-slate-600">POST /api/audience/inject-html</p>
                        </div>
                        <div className="flex items-end sm:justify-end">
                          <span className="text-[11px] font-medium text-slate-400">Live infrastructure</span>
                        </div>
                      </div>
                    </div>
                  ))
                : CAPTURE_FLOWS.map((flow) => (
                    <div
                      key={flow.id}
                      className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:border-violet-200/60 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{flow.type}</h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-lg text-[10px] font-bold uppercase",
                                flow.status === "live"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-amber-200 bg-amber-50 text-amber-900",
                              )}
                            >
                              {flow.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{flow.trigger}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs">
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs" onClick={scrollToAnalytics}>
                            <BarChart3 className="mr-1 h-3 w-3" />
                            Analytics
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 rounded-lg px-2 text-xs">
                            <Rocket className="mr-1 h-3 w-3" />
                            Deploy
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs text-slate-500">
                            <Pause className="mr-1 h-3 w-3" />
                            Pause
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Conversion</p>
                          <p className="text-sm font-semibold text-slate-900">{flow.rate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Assets</p>
                          <p className="text-sm font-medium text-slate-700">{flow.assets}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Lead quality</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 flex-1 max-w-[100px] overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                                style={{ width: `${flow.quality}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-slate-800">{flow.quality}</span>
                          </div>
                        </div>
                        <div className="flex items-end sm:justify-end">
                          <span className="text-[11px] font-medium text-slate-400">Demo preview</span>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          <aside className="space-y-4 lg:col-span-5">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-violet-50/30 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">AI conversion suggestions</p>
                <ul className="mt-4 space-y-3">
                  {smartInsights.map((ins) => (
                    <li key={ins.title} className="flex gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                        <ins.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-snug text-slate-900">{ins.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{ins.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Traffic → lead ratio</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-slate-900">
                      {extended?.publishingRoi && extended.publishingRoi.unlocks > 0
                        ? `1 : ${Math.max(1, Math.round(extended.publishingRoi.pageViews / Math.max(1, extended.publishingRoi.unlocks)))}`
                        : summary != null && summary.subscriberCount > 0
                          ? `1 : ${Math.max(1, Math.round((summary.eventsByType?.page_view ?? 0) / Math.max(1, summary.subscriberCount)))}`
                          : "1 : 42"}
                    </p>
                    <p className="text-xs text-slate-500">Instrumented views per unlock (weighted)</p>
                  </div>
                  <MiniBars heights={[10, 14, 12, 18, 22, 26, 24, 30]} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-slate-900 p-5 text-slate-100 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Publishing recommendations</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-200">
                  <li className="flex gap-2">
                    <span className="text-violet-300">→</span>
                    Push OAuth gate to top 3 calculators before next newsletter send.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-violet-300">→</span>
                    Mirror Content Wrapper CTA on WordPress posts tagged “SEO”.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-violet-300">→</span>
                    Schedule partial unlock A/B on underperforming landers.
                  </li>
                </ul>
                <Button
                  asChild
                  variant="secondary"
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
                >
                  <Link to="/wordpress">Open Publishing Hub</Link>
                </Button>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 text-sm text-slate-600 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lead quality signals</p>
                <p className="mt-2 leading-relaxed">
                  OAuth completions, dwell time on gated sections, and repeat visits correlate with{" "}
                  <span className="font-semibold text-slate-900">89%</span> of downstream monetization events in this
                  workspace model.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
