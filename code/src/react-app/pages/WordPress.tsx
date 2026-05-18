import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Globe,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  Rocket,
  Settings2,
  Sparkles,
  TrendingUp,
  Plus,
  Upload,
  Zap,
  Copy,
  X,
} from "lucide-react";
import {
  ConnectWordPressPanel,
  type WordPressSitePublic,
} from "@/react-app/components/wordpress/ConnectWordPressPanel";
import {
  appendDeployment,
  computeSeoReachScore,
  faviconUrl,
  getDeploymentRecords,
  saveDeploymentRecords,
  type DeploymentRecord,
} from "@/react-app/lib/publishingSites";
import { readPipelineDeploy, clearPipelineDeploy, type PipelineDeployPayload } from "@/react-app/lib/pipelineDeploy";
 
const PUBLISHING_SHELL =
  "bg-[#f8f9fb] bg-gradient-to-br from-[#fafbfc] via-[#f6f7f9] to-[#eef1f5]";
 
interface Campaign {
  id: number;
  name: string;
  tool_name: string | null;
  target_keyword: string | null;
  created_at: string;
  full_page_html: string | null;
}
 
interface Magnet {
  id: number;
  name: string;
  project_name: string;
  html_content: string | null;
  landing_page_html: string | null;
  blueprint: string | null;
  updated_at: string;
}
 
interface DashboardStats {
  blueprintCount: number;
  builtToolCount: number;
  seoPageCount: number;
}
 
function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
 
function healthLabel(health: string): string {
  switch (health) {
    case "healthy":
      return "Connected";
    case "degraded":
      return "Degraded";
    case "offline":
      return "Offline";
    case "pending":
      return "Verifying";
    default:
      return "Unknown";
  }
}
 
function healthClasses(health: string): string {
  switch (health) {
    case "healthy":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
    case "degraded":
      return "bg-amber-50 text-amber-700 ring-amber-600/15";
    case "offline":
      return "bg-rose-50 text-rose-700 ring-rose-600/15";
    default:
      return "bg-sky-50 text-sky-700 ring-sky-600/15";
  }
}
 
function deploymentClasses(status: DeploymentRecord["status"] | null): string {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700";
    case "syncing":
      return "bg-sky-50 text-sky-700";
    case "scheduled":
      return "bg-violet-50 text-violet-700";
    case "failed":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export default function WordPress() {
  const { showToast } = useToast();
  const [pipelineHandoff, setPipelineHandoff] = useState<PipelineDeployPayload | null>(null);
  const [sites, setSites] = useState<WordPressSitePublic[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [settingsSite, setSettingsSite] = useState<WordPressSitePublic | null>(null);
  const [syncingSiteId, setSyncingSiteId] = useState<number | null>(null);

  const loadPublishingSites = useCallback(async () => {
    try {
      const res = await fetch("/api/wordpress/sites", { credentials: "include" });
      const data = await res.json();
      setSites(Array.isArray(data.sites) ? data.sites : []);
    } catch {
      setSites([]);
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, magnetsRes, statsRes] = await Promise.all([
        fetch("/api/content-campaigns", { credentials: "include" }),
        fetch("/api/magnets", { credentials: "include" }),
        fetch("/api/dashboard/stats", { credentials: "include" }),
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns ?? []);
      }
      if (magnetsRes.ok) {
        const data = await magnetsRes.json();
        setMagnets(data.magnets ?? []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          blueprintCount: data.blueprintCount ?? 0,
          builtToolCount: data.builtToolCount ?? 0,
          seoPageCount: data.seoPageCount ?? 0,
        });
      }
      await loadPublishingSites();
    } catch {
      showToast({
        type: "error",
        title: "Load failed",
        message: "Could not load publishing workspace data",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast, loadPublishingSites]);

  useEffect(() => {
    setDeployments(getDeploymentRecords());
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const p = readPipelineDeploy();
    if (p) setPipelineHandoff(p);
  }, []);

  const dismissPipelineHandoff = useCallback(() => {
    clearPipelineDeploy();
    setPipelineHandoff(null);
  }, []);

  const copyPipelineHandoff = useCallback(async () => {
    if (!pipelineHandoff?.html) return;
    try {
      await navigator.clipboard.writeText(pipelineHandoff.html);
      showToast({ type: "success", title: "Copied", message: "Deploy-ready HTML is on your clipboard." });
    } catch {
      showToast({ type: "error", title: "Copy failed", message: "Your browser blocked clipboard access." });
    }
  }, [pipelineHandoff, showToast]);

  const readyCampaigns = useMemo(
    () => campaigns.filter((c) => Boolean(c.full_page_html)),
    [campaigns],
  );
  const pendingCampaigns = useMemo(
    () => campaigns.filter((c) => !c.full_page_html),
    [campaigns],
  );
  const landingPages = useMemo(
    () => magnets.filter((m) => Boolean(m.landing_page_html)),
    [magnets],
  );
  const htmlAssets = useMemo(
    () => magnets.filter((m) => Boolean(m.html_content)),
    [magnets],
  );
  const blueprintAssets = useMemo(
    () => magnets.filter((m) => Boolean(m.blueprint)),
    [magnets],
  );

  const publishedCount = deployments.filter((d) => d.status === "published").length;
  const scheduledCount = deployments.filter((d) => d.status === "scheduled").length;

  const seoReachScore = computeSeoReachScore({
    connectedSites: sites.length,
    publishedAssets: publishedCount + htmlAssets.length,
    readyCampaigns: readyCampaigns.length,
    landingPages: landingPages.length,
    blueprints: stats?.blueprintCount ?? blueprintAssets.length,
  });

  const handleSyncSite = async (site: WordPressSitePublic) => {
    setSyncingSiteId(site.id);
    try {
      const res = await fetch(`/api/wordpress/sites/${site.id}/verify`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        showToast({
          type: "error",
          title: "Connection test failed",
          message: data.message || "Could not reach WordPress with stored credentials.",
        });
        await loadPublishingSites();
        return;
      }
      await loadPublishingSites();
      appendDeployment({
        siteId: String(site.id),
        siteName: site.siteName,
        assetName: "Connection verified",
        assetType: "wrapper",
        status: "published",
      });
      setDeployments(getDeploymentRecords());
      showToast({
        type: "success",
        title: "Connection verified",
        message: `${site.siteName} is responding and ready to publish.`,
      });
    } catch {
      showToast({ type: "error", title: "Error", message: "Verification request failed" });
    } finally {
      setSyncingSiteId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsSite) return;
    try {
      const res = await fetch(`/api/wordpress/sites/${settingsSite.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: settingsSite.siteName,
          publishingFrequency: settingsSite.publishingFrequency,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast({
          type: "error",
          title: "Save failed",
          message: err.error || "Could not update site",
        });
        return;
      }
      const data = await res.json();
      setSites((prev) => prev.map((s) => (s.id === settingsSite.id ? data.site : s)));
      setSettingsSite(null);
      showToast({ type: "success", title: "Settings saved" });
    } catch {
      showToast({ type: "error", title: "Error", message: "Could not save settings" });
    }
  };

  const handleRemoveSite = async (siteId: number) => {
    try {
      const res = await fetch(`/api/wordpress/sites/${siteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        showToast({ type: "error", title: "Remove failed", message: "Could not remove site" });
        return;
      }
      setSites((prev) => prev.filter((s) => s.id !== siteId));
      const nextDeployments = deployments.filter((d) => d.siteId !== String(siteId));
      setDeployments(nextDeployments);
      saveDeploymentRecords(nextDeployments);
      setSettingsSite(null);
      showToast({
        type: "success",
        title: "Site removed",
        message: "Destination removed from your publishing network",
      });
    } catch {
      showToast({ type: "error", title: "Error", message: "Could not remove site" });
    }
  };
 
  const statusMetrics = [
    {
      label: "Connected Sites",
      value: sites.length,
      hint: sites.length ? "Active destinations" : "No destinations yet",
      icon: Globe,
    },
    {
      label: "Published Assets",
      value: publishedCount + readyCampaigns.length + htmlAssets.length,
      hint: `${readyCampaigns.length} wrapper-ready`,
      icon: Rocket,
    },
    {
      label: "Scheduled Deployments",
      value: scheduledCount,
      hint: scheduledCount ? "Queued for delivery" : "None scheduled",
      icon: Clock,
    },
    {
      label: "SEO Reach Score",
      value: seoReachScore,
      hint: "Distribution potential",
      icon: TrendingUp,
      suffix: "/100",
    },
  ];
 
  const aiRecommendations = [
    readyCampaigns.length > 0 && {
      text: `${readyCampaigns.length} SEO asset${readyCampaigns.length === 1 ? "" : "s"} ready for deployment`,
      action: "Review in Content Studio",
      to: "/content",
    },
    landingPages.length > 0 && {
      text: `${landingPages.length} landing page${landingPages.length === 1 ? "" : "s"} optimized for publishing`,
      action: "View tools",
      to: "/magnets",
    },
    pendingCampaigns.length > 0 && {
      text: `${pendingCampaigns.length} content wrapper${pendingCampaigns.length === 1 ? "" : "s"} pending full HTML sync`,
      action: "Complete wrappers",
      to: "/content",
    },
    sites.length === 0 && {
      text: "Connect your first WordPress destination to unlock automated distribution",
      action: "Connect site",
      onClick: () => setConnectOpen(true),
    },
    sites.length > 0 &&
      readyCampaigns.length === 0 && {
        text: "Generate wrapped content in Content Studio to populate your publish queue",
        action: "Open Content Studio",
        to: "/content",
      },
  ].filter(Boolean) as Array<{ text: string; action: string; to?: string; onClick?: () => void }>;
 
  const hasSites = sites.length > 0;
 
  return (
    <DashboardLayout shellClassName={PUBLISHING_SHELL} innerClassName="p-0">
      <div className="min-h-full">
        {pipelineHandoff && (
          <div className="border-b border-violet-200/80 bg-gradient-to-r from-violet-600/[0.08] via-white to-sky-50/40 px-6 py-4 lg:px-10">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                  <Rocket className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-950">Content Wrapper deploy handoff</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                    {pipelineHandoff.pageTitle ? (
                      <>
                        Queued asset: <span className="font-medium text-neutral-900">{pipelineHandoff.pageTitle}</span>
                      </>
                    ) : (
                      "Queued HTML package from Content Wrapper."
                    )}
                    {pipelineHandoff.audienceFlowPublicId && (
                      <span className="mt-1 block text-[11px] font-medium text-violet-800">
                        Includes Audience Growth capture · flow {pipelineHandoff.audienceFlowPublicId.slice(0, 8)}…
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyPipelineHandoff()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200/90 bg-white px-3 text-xs font-semibold text-violet-900 shadow-sm transition hover:bg-violet-50"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Copy HTML
                </button>
                <Link
                  to="/content"
                  className="inline-flex h-9 items-center rounded-xl border border-neutral-200/90 bg-white/90 px-3 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
                >
                  Content Studio
                </Link>
                <button
                  type="button"
                  onClick={dismissPipelineHandoff}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800"
                  aria-label="Dismiss handoff"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Page header — clean row like reference, premium execution */}
        <header className="border-b border-neutral-200/60 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/25 via-indigo-500/15 to-fuchsia-500/20 blur-md"
                  aria-hidden
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 ring-1 ring-white/30">
                  <Globe className="h-6 w-6 text-white" strokeWidth={1.75} />
                </div>
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[1.65rem]">
                    WordPress Sites
                  </h1>
                  {hasSites && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Network live
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-500 sm:text-[15px]">
                  {hasSites
                    ? "Publishing destinations, deployment health, and Content Studio sync in one workspace."
                    : "Manage the WordPress sites you publish content to — connect once, then deploy from Content Studio and your build pipeline."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setConnectOpen((open) => !open)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-md ring-1 ring-white/20 transition active:scale-[0.98] ${
                  connectOpen
                    ? "border border-violet-200 bg-violet-50 text-violet-800 shadow-violet-500/10 hover:bg-violet-100"
                    : "bg-gradient-to-b from-violet-600 to-indigo-600 text-white shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/30"
                }`}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Connect Site
              </button>
              {hasSites && (
                <button
                  type="button"
                  onClick={() =>
                    showToast({
                      type: "info",
                      title: "Import coming soon",
                      message: "Connect sites manually for now",
                    })
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200/90 bg-white/90 px-4 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-white hover:shadow"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </button>
              )}
            </div>
          </div>
        </header>
 
        {/* Network metrics — only when destinations exist */}
        {hasSites && (
          <section className="border-b border-neutral-200/60 bg-white/40">
            <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-neutral-200/50 px-6 lg:grid-cols-4 lg:px-10">
              {statusMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="bg-[#f8f9fb] px-5 py-5 transition hover:bg-white/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                          {metric.label}
                        </p>
                        <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-neutral-950">
                          {loading ? "—" : metric.value}
                          {metric.suffix && (
                            <span className="ml-0.5 text-sm font-normal text-neutral-400">
                              {metric.suffix}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{metric.hint}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200/70 bg-white/80 text-neutral-500">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
 
        {/* Main workspace */}
        <section className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10 lg:py-10">
          {!hasSites ? (
            <article className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-neutral-200/90 bg-white px-8 py-16 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 ring-1 ring-neutral-100">
                <Globe className="h-8 w-8 text-neutral-300" strokeWidth={1.5} />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
                No sites added yet. Click{" "}
                <button
                  type="button"
                  onClick={() => setConnectOpen(true)}
                  className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
                >
                  Connect Site
                </button>{" "}
                to get started.
              </p>
            </article>
          ) : (
            <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                        Your sites
                      </h2>
                      <p className="mt-0.5 text-sm text-neutral-500">
                        Destinations and deployment health
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        {sites.length} connected
                      </span>
                      <button
                        type="button"
                        onClick={() => setConnectOpen((o) => !o)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                          connectOpen
                            ? "border border-violet-200 bg-violet-50 text-violet-800"
                            : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Connect Site
                      </button>
                    </div>
                  </div>
 
                  <div className="space-y-4">
                    {sites.map((site) => {
                      const isSyncing = syncingSiteId === site.id;
                      return (
                        <article
                          key={site.id}
                          className="group rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white via-white to-neutral-50/50 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-neutral-300/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                        >
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-4">
                              <div className="relative">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
                                  <img
                                    src={faviconUrl(site.domain)}
                                    alt=""
                                    className="h-6 w-6"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                </div>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                                    site.connectionHealth === "healthy"
                                      ? "bg-emerald-500"
                                      : site.connectionHealth === "offline"
                                        ? "bg-rose-500"
                                        : "bg-amber-400"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-neutral-950">
                                    {site.siteName}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${healthClasses(site.connectionHealth)}`}
                                  >
                                    {healthLabel(site.connectionHealth)}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-sm text-neutral-500">{site.domain}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                                    WordPress · REST
                                  </span>
                                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium capitalize text-neutral-600">
                                    {site.publishingFrequency} cadence
                                  </span>
                                  <span
                                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                                      site.seoSyncStatus === "synced"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    SEO {site.seoSyncStatus}
                                  </span>
                                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                                    {site.assetsDeployed} assets deployed
                                  </span>
                                  {isSyncing && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Verifying
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                                Last verified
                              </p>
                              <p className="mt-0.5 text-sm font-medium text-neutral-700">
                                {formatRelativeTime(site.lastVerifiedAt)}
                              </p>
                              <p className="mt-1 text-[11px] text-neutral-400">Last publish</p>
                              <p className="text-sm font-medium text-neutral-700">
                                {formatRelativeTime(site.lastPublishAt)}
                              </p>
                              <p
                                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${deploymentClasses(
                                  site.publishingAccess ? "published" : "idle",
                                )}`}
                              >
                                {site.publishingAccess ? "Publishing ready" : "Limited access"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                            <a
                              href={site.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                            >
                              Open Dashboard
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                            <Link
                              to="/content"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                            >
                              Quick publish
                            </Link>
                            <button
                              type="button"
                              disabled={isSyncing}
                              onClick={() => handleSyncSite(site)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {isSyncing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Test connection
                            </button>
                            <button
                              type="button"
                              onClick={() => setSettingsSite(site)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                              Settings
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
 
                  {/* Content pipeline integration */}
                  <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-950">
                          Ready-to-publish assets
                        </h3>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          Generated from Content Wrapper, blueprints, and build pipeline
                        </p>
                      </div>
                      <Link
                        to="/content"
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-950"
                      >
                        Content Studio →
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "Wrapped campaigns",
                          count: readyCampaigns.length,
                          pending: pendingCampaigns.length,
                          icon: Layers,
                        },
                        {
                          label: "Landing pages",
                          count: landingPages.length,
                          icon: Rocket,
                        },
                        {
                          label: "HTML widgets",
                          count: htmlAssets.length,
                          icon: Zap,
                        },
                        {
                          label: "Blueprint drafts",
                          count: blueprintAssets.length,
                          icon: Sparkles,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-neutral-500 shadow-sm">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">{item.label}</p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {loading ? "—" : item.count}
                                {"pending" in item && (item.pending ?? 0) > 0 && (
                                  <span className="ml-1.5 text-xs font-normal text-amber-600">
                                    · {item.pending} pending
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
 
                {/* Right — AI activity panel */}
                <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                  <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-neutral-500" />
                      <h2 className="text-sm font-semibold text-neutral-950">AI publishing insights</h2>
                    </div>
 
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">Publishing automation</p>
                          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                            Distribution engine active across {sites.length} destination
                            {sites.length === 1 ? "" : "s"}.
                          </p>
                          {readyCampaigns.length > 0 && (
                            <p className="mt-2 text-xs font-medium text-emerald-700">
                              Publishing velocity up ~{Math.min(28, readyCampaigns.length * 7)}%
                              this week
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
 
                    <div className="mt-5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                        AI recommendations
                      </p>
                      <ul className="mt-3 space-y-2">
                        {aiRecommendations.slice(0, 4).map((rec) => (
                          <li
                            key={rec.text}
                            className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2.5"
                          >
                            <p className="text-xs leading-relaxed text-neutral-700">{rec.text}</p>
                            {rec.to ? (
                              <Link
                                to={rec.to}
                                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-950 hover:underline"
                              >
                                {rec.action}
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={rec.onClick}
                                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-950 hover:underline"
                              >
                                {rec.action}
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
 
                  <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                      Recent deployments
                    </p>
                    {deployments.length === 0 ? (
                      <p className="mt-4 text-sm text-neutral-500">No deployments recorded yet.</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {deployments.slice(0, 5).map((d) => (
                          <li key={d.id} className="flex gap-3">
                            <CircleDot className="mt-1 h-3.5 w-3.5 shrink-0 text-neutral-300" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-neutral-800">
                                {d.assetName}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {d.siteName} · {formatRelativeTime(d.timestamp)}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${deploymentClasses(d.status)}`}
                            >
                              {d.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
 
                  <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                        Content wrapper queue
                      </p>
                      <Link2 className="h-3.5 w-3.5 text-neutral-400" />
                    </div>
                    {campaigns.length === 0 ? (
                      <p className="mt-4 text-sm text-neutral-500">
                        No wrapped content yet. Generate campaigns in Content Studio.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {campaigns.slice(0, 4).map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-neutral-800">{c.name}</p>
                              <p className="truncate text-[11px] text-neutral-500">
                                {c.target_keyword || c.tool_name || "SEO campaign"}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                c.full_page_html
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {c.full_page_html ? "Ready" : "Pending"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
 
                  <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                      SEO distribution activity
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                        <span className="text-xs text-neutral-600">SEO pages indexed</span>
                        <span className="text-sm font-semibold tabular-nums text-neutral-900">
                          {loading ? "—" : stats?.seoPageCount ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                        <span className="text-xs text-neutral-600">Built HTML assets</span>
                        <span className="text-sm font-semibold tabular-nums text-neutral-900">
                          {loading ? "—" : htmlAssets.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                        <span className="text-xs text-neutral-600">Connected landing pages</span>
                        <span className="text-sm font-semibold tabular-nums text-neutral-900">
                          {loading ? "—" : landingPages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
            </div>
          )}
        </section>
      </div>

      {/* Site settings dialog */}
      <Dialog open={Boolean(settingsSite)} onOpenChange={(open) => !open && setSettingsSite(null)}>
        <DialogContent className="rounded-2xl border-neutral-200/80 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-950">
              Destination settings
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              Configure publishing preferences for {settingsSite?.siteName}.
            </DialogDescription>
          </DialogHeader>
          {settingsSite && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Site name</Label>
                <Input
                  value={settingsSite.siteName}
                  onChange={(e) =>
                    setSettingsSite({ ...settingsSite, siteName: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-neutral-500">
                WordPress user: <span className="font-medium text-neutral-700">{settingsSite.username}</span> ·
                Credentials are stored encrypted on the server. To rotate a password, remove this site and connect
                again.
              </p>
              <div className="space-y-2">
                <Label>Publishing cadence</Label>
                <Select
                  value={settingsSite.publishingFrequency}
                  onValueChange={(v) =>
                    setSettingsSite({
                      ...settingsSite,
                      publishingFrequency: v as WordPressSitePublic["publishingFrequency"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <button
              type="button"
              onClick={() => settingsSite && handleRemoveSite(settingsSite.id)}
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              Remove site
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSettingsSite(null)}
                className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Save changes
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConnectWordPressPanel
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onConnected={loadPublishingSites}
      />
    </DashboardLayout>
  );
}