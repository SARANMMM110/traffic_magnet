import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  ArrowDown,
  BarChart3,
  Globe,
  Layers,
  Loader2,
  Plus,
  Radar,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { useToast } from "@/react-app/components/Toast";
import GrowthPipelineBuilder from "@/react-app/components/growth-pipeline/GrowthPipelineBuilder";
import {
  deleteGrowthDeployment,
  executeGrowthDeployment,
  fetchGrowthOverview,
  type GrowthDeployment,
  type GrowthOverview,
} from "@/react-app/lib/growthPipelineApi";
import { PIPELINE_STEPS } from "@/react-app/lib/growthPipelineInject";
import { cn } from "@/react-app/lib/utils";
import { writePipelineDeploy } from "@/react-app/lib/pipelineDeploy";

const STATE_STYLES: Record<string, string> = {
  deploying: "bg-amber-50 text-amber-800 border-amber-200 animate-pulse",
  published: "bg-emerald-50 text-emerald-800 border-emerald-200",
  syncing: "bg-sky-50 text-sky-800 border-sky-200",
  tracking: "bg-violet-50 text-violet-800 border-violet-200",
  optimizing: "bg-indigo-50 text-indigo-800 border-indigo-200",
  error: "bg-rose-50 text-rose-800 border-rose-200",
  retrying: "bg-orange-50 text-orange-800 border-orange-200",
  idle: "bg-slate-50 text-slate-600 border-slate-200",
};

function PipelineFlowViz({ deployment }: { deployment?: GrowthDeployment | null }) {
  const icons = [Layers, Radar, Sparkles, Globe, BarChart3];
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {PIPELINE_STEPS.map((s, i) => {
        const Icon = icons[i] || Zap;
        const active = deployment
          ? (i === 0 && !!deployment.assetKey) ||
            (i === 1 && !!deployment.audienceFlowPublicId) ||
            (i === 2 && !!deployment.assistantPublicId) ||
            (i === 3 && !!deployment.publishTarget) ||
            (i === 4 && deployment.analyticsEnabled)
          : true;
        return (
          <div key={s.id} className="flex flex-col items-center w-full max-w-xs">
            <div
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur transition-all",
                active
                  ? "bg-white/90 border-violet-200 shadow-sm shadow-violet-500/10"
                  : "bg-slate-50/50 border-slate-200 opacity-60",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  active ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white" : "bg-slate-200 text-slate-500",
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                <p className="text-xs text-slate-500">
                  {i === 0 && (deployment?.assetType || "Your asset")}
                  {i === 1 && (deployment?.audienceFlowPublicId ? "Capture wired" : "Optional")}
                  {i === 2 && (deployment?.assistantPublicId ? "Assistant live" : "Optional")}
                  {i === 3 && (deployment?.publishTarget || "Publish")}
                  {i === 4 && (deployment?.analyticsEnabled ? "Tracking on" : "Off")}
                </p>
              </div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && <ArrowDown className="w-4 h-4 text-violet-400 my-1" />}
          </div>
        );
      })}
    </div>
  );
}

export default function GrowthPipeline() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<GrowthOverview | null>(null);
  const [deployments, setDeployments] = useState<GrowthDeployment[]>([]);
  const [operationsFeed, setOperationsFeed] = useState<
    Array<{ id: number; eventType: string; createdAt: string; deploymentName?: string; assetKey: string }>
  >([]);
  const [queue, setQueue] = useState<Array<{ deploymentId: number; name: string; state: string }>>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selected, setSelected] = useState<GrowthDeployment | null>(null);
  const [audienceFlows, setAudienceFlows] = useState<Array<{ publicId: string; name: string }>>([]);
  const [assistants, setAssistants] = useState<Array<{ publicId: string; name: string; status: string }>>([]);
  const [wpSites, setWpSites] = useState<Array<{ id: number; siteName: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, flows, asst, sites] = await Promise.all([
        fetchGrowthOverview(),
        fetch("/api/audience/flows", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/assistants", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/wordpress/sites", { credentials: "include" }).then((r) => r.json()),
      ]);
      setOverview(data.overview);
      setDeployments(data.deployments);
      setOperationsFeed(data.operationsFeed || []);
      setQueue(data.queue || []);
      setAudienceFlows(
        (flows.flows || []).map((f: { publicId: string; name: string }) => ({ publicId: f.publicId, name: f.name })),
      );
      setAssistants(
        (asst.assistants || []).map((a: { publicId: string; name: string; status: string }) => ({
          publicId: a.publicId,
          name: a.name,
          status: a.status,
        })),
      );
      setWpSites(
        (sites.sites || []).map((s: { id: number; siteName: string }) => ({ id: s.id, siteName: s.siteName })),
      );
      if (!selected && data.deployments[0]) setSelected(data.deployments[0]);
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Failed to load pipeline", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const redeploy = async (d: GrowthDeployment) => {
    try {
      const result = await executeGrowthDeployment(d.id);
      if (result.handoff.publishTarget === "wordpress") {
        writePipelineDeploy({
          html: result.html,
          source: "growth-pipeline",
          growthDeploymentId: d.id,
          growthDeploymentPublicId: d.publicId,
          audienceFlowPublicId: d.audienceFlowPublicId,
          audienceAssetKey: d.assetKey,
          assistantPublicId: d.assistantPublicId,
          analyticsEnabled: d.analyticsEnabled,
          publishTarget: d.publishTarget,
          wordpressSiteId: d.wordpressSiteId,
          pageTitle: d.name,
        });
        navigate("/wordpress");
      }
      showToast({ title: "Deployment updated", type: "success" });
      load();
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Deploy failed", type: "error" });
    }
  };

  const ov = overview || {
    totalDeployments: 0,
    liveDeployments: 0,
    activeRuns: 0,
    totalEvents: 0,
    leadsInfluenced: 0,
    assistantEngagements: 0,
    publishingTargets: 0,
    conversionRate: 0,
  };

  if (loading && !overview) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
        <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="space-y-6">
            <div>
              <Badge className="mb-3 bg-violet-100 text-violet-800 hover:bg-violet-100">Growth OS</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Growth Deployment Pipeline
              </h1>
              <p className="mt-3 text-lg text-slate-600 max-w-xl">
                Connect AI assets, audience capture, assistants, publishing systems, and analytics into one intelligent
                growth workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                onClick={() => setBuilderOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create deployment flow
              </Button>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link to="/content">Open Content Studio</Link>
              </Button>
            </div>
            <p className="text-sm text-slate-500">
              Deploy complete AI-powered growth systems across your assets, publishing channels, and monetization
              infrastructure.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Live flows", value: ov.liveDeployments, icon: Workflow },
                { label: "Events (30d)", value: ov.totalEvents, icon: Activity },
                { label: "Leads", value: ov.leadsInfluenced, icon: Target },
                { label: "AI chats", value: ov.assistantEngagements, icon: Sparkles },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur p-4">
                  <m.icon className="w-4 h-4 text-violet-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                  <p className="text-xs text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-800">Live operations</span>
              </div>
              {queue.length > 0 && (
                <Badge variant="outline" className="text-amber-700 border-amber-200">
                  {queue.length} in queue
                </Badge>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
              {queue.map((q) => (
                <div key={q.deploymentId} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <div>
                    <p className="text-sm font-medium">{q.name}</p>
                    <p className="text-xs text-amber-800 capitalize">{q.state}…</p>
                  </div>
                </div>
              ))}
              {operationsFeed.slice(0, 8).map((ev) => (
                <div key={ev.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <TrendingUp className="w-4 h-4 text-violet-500 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">{ev.eventType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-500">
                      {ev.deploymentName || ev.assetKey} · {new Date(ev.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {operationsFeed.length === 0 && queue.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">Execute a deployment to see live activity.</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-12 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Connected workflow</h2>
            <p className="text-sm text-slate-500 mb-4">Every layer wired automatically on deploy.</p>
            <PipelineFlowViz deployment={selected} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Deployment flows</h2>
              <Button size="sm" variant="outline" onClick={load}>
                Refresh
              </Button>
            </div>
            {deployments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white/50">
                <Rocket className="w-10 h-10 text-violet-500 mx-auto mb-3" />
                <p className="text-slate-600">Create your first unified growth deployment.</p>
              </div>
            )}
            {deployments.map((d) => (
              <div
                key={d.id}
                className={cn(
                  "rounded-xl border p-5 bg-white/90 transition-all cursor-pointer",
                  selected?.id === d.id ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-200 hover:shadow-md",
                )}
                onClick={() => setSelected(d)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{d.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {d.assetType} · {d.assetKey}
                    </p>
                  </div>
                  <Badge className={cn("capitalize border", STATE_STYLES[d.deploymentState] || STATE_STYLES.idle)}>
                    {d.deploymentState}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {d.audienceFlowPublicId && <Badge variant="secondary">Audience</Badge>}
                  {d.assistantPublicId && <Badge variant="secondary">AI Assistant</Badge>}
                  {d.analyticsEnabled && <Badge variant="secondary">Analytics</Badge>}
                  <Badge variant="outline">{d.publishTarget}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => redeploy(d)}>
                    Redeploy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGrowthDeployment(d.id).then(load);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GrowthPipelineBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onComplete={(d, html) => {
          setBuilderOpen(false);
          setSelected(d);
          if (html && d.publishTarget === "wordpress") navigate("/wordpress");
          load();
        }}
        audienceFlows={audienceFlows}
        assistants={assistants}
        wordpressSites={wpSites}
      />
    </DashboardLayout>
  );
}
