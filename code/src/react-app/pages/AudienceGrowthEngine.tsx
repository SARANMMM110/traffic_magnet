import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Globe2,
  Layers,
  LayoutTemplate,
  Mail,
  Pause,
  Pencil,
  Radar,
  Rocket,
  Users,
} from "lucide-react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { useToast } from "@/react-app/components/Toast";
import { cn } from "@/react-app/lib/utils";
import CaptureFlowBuilderPanel from "@/react-app/components/audience-growth/CaptureFlowBuilderPanel";

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

interface AudienceFlowRow {
  id: number;
  name: string;
  status: string;
  assetType: string;
  captureMethod: string;
  publicId: string;
  stats?: {
    totalLeads: number;
    recentSubscribers: Array<{
      email: string;
      name: string | null;
      capturedAt: string;
    }>;
  };
}

export default function AudienceGrowthEngine() {
  const { showToast } = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [audienceFlows, setAudienceFlows] = useState<AudienceFlowRow[]>([]);

  const loadAudience = useCallback(async () => {
    try {
      const fRes = await fetch("/api/audience/flows", { credentials: "include" });
      if (fRes.ok) {
        const f = await fRes.json();
        const list = (f.flows ?? []).map((x: Record<string, unknown>) => ({
          id: x.id as number,
          name: String(x.name),
          status: String(x.status),
          assetType: String(x.assetType),
          captureMethod: String(x.captureMethod),
          publicId: String(x.publicId),
          stats: x.stats as AudienceFlowRow['stats'],
        }));
        setAudienceFlows(list);
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
          <Button className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800" onClick={() => setBuilderOpen(true)}>
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


        </section>









        {/* Workspace */}
        <section className="space-y-4 max-w-5xl">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Capture flows</h2>
                <p className="text-sm text-slate-500">Operational systems wired to your AI surface area.</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => setBuilderOpen(true)}>
                New flow
              </Button>
            </div>

            <div className="space-y-4">
              {audienceFlows.length > 0
                ? audienceFlows.map((flow) => (
                    <div
                      key={flow.id}
                      className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:border-violet-200/60 hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{flow.name}</h3>
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
                        </div>
                        <div className="flex flex-wrap gap-1.5">
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

                      {/* Stats Section */}
                      {flow.stats && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {/* Total Leads */}
                          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-violet-900">{flow.stats.totalLeads}</p>
                                <p className="text-xs font-medium text-violet-600">Total Leads Captured</p>
                              </div>
                            </div>
                          </div>

                          {/* Recent Subscribers */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Mail className="h-4 w-4 text-slate-600" />
                              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Recent Subscribers</p>
                            </div>
                            {flow.stats.recentSubscribers.length > 0 ? (
                              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                {flow.stats.recentSubscribers.map((sub, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="font-medium text-slate-900 truncate" title={sub.email}>
                                      {sub.name || sub.email}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No subscribers yet</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer - Public ID */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="font-mono text-[10px] text-slate-400">public {flow.publicId}</p>
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
                    </div>
                  ))}
            </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
}
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
