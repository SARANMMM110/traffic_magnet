import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useParams, useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { Input } from "@/react-app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { cn } from "@/react-app/lib/utils";
import BlueprintDetailPanel, {
  type BlueprintPanelTool,
} from "@/react-app/pages/BlueprintDetailPanel";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Download,
  FolderKanban,
  Layers,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  niche: string;
  goal: string | null;
  audience: string | null;
  created_at: string;
}

interface Tool {
  id: number;
  project_id: number;
  name: string;
  description: string;
  category: string;
  keywords: string;
  traffic_score: number;
  backlink_score: number;
  monetization_score: number;
  overall_score: number;
  reasoning: string;
  blueprint: string | null;
  html_content: string | null;
  landing_page_html: string | null;
  created_at: string;
}

function parseToolBlueprintJson(raw: string): Record<string, unknown> {
  let blueprint: Record<string, unknown> = {};
  try {
    blueprint = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const lines = raw.split("\n");
    let currentField = "";
    let currentValue = "";
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex !== -1) {
        if (currentField) {
          const key = currentField.toLowerCase().replace(/\s+/g, "_");
          blueprint[key] = currentValue.trim();
        }
        currentField = line.substring(0, colonIndex).trim();
        currentValue = line.substring(colonIndex + 1).trim();
      } else if (line.trim()) {
        currentValue += ` ${line.trim()}`;
      }
    }
    if (currentField) {
      const key = currentField.toLowerCase().replace(/\s+/g, "_");
      blueprint[key] = currentValue.trim();
    }
    const tk = blueprint.target_keywords;
    if (typeof tk === "string") {
      blueprint.target_keywords = tk.split(",").map((k: string) => k.trim());
    }
  }
  return blueprint;
}

function matchesGoalFilter(purpose: string, goalFilter: string): boolean {
  const p = purpose.toLowerCase();
  switch (goalFilter) {
    case "backlinks":
      return p.includes("backlink") || p.includes("link building");
    case "leads":
      return p.includes("lead") || p.includes("email") || p.includes("contact");
    case "traffic":
      return p.includes("traffic") || p.includes("visitor") || p.includes("seo");
    case "engagement":
      return p.includes("engagement") || p.includes("conversion") || p.includes("retention");
    default:
      return true;
  }
}

function HeroIllustration() {
  return (
    <div className="relative hidden h-[200px] w-full max-w-[340px] shrink-0 lg:block" aria-hidden>
      <div className="absolute -right-4 top-2 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl" />
      <div className="absolute bottom-0 right-8 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />

      {/* Browser window */}
      <div className="absolute right-4 top-0 w-[220px] rotate-[-4deg] rounded-2xl border border-violet-100/80 bg-white p-3 shadow-[0_24px_50px_-12px_rgba(99,91,255,0.35)]">
        <div className="mb-2 flex gap-1">
          <div className="h-2 w-2 rounded-full bg-red-300/80" />
          <div className="h-2 w-2 rounded-full bg-amber-300/80" />
          <div className="h-2 w-2 rounded-full bg-emerald-300/80" />
        </div>
        <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </div>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2 px-1">
          <div className="flex h-14 flex-1 items-end gap-1">
            {[40, 65, 45, 80, 55, 90].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-violet-500 to-indigo-400 opacity-80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Magnifying glass */}
      <div className="absolute bottom-6 right-0 flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white shadow-[0_12px_32px_-8px_rgba(99,91,255,0.3)]">
        <Search className="h-6 w-6 text-violet-600" strokeWidth={2} />
      </div>

      <Sparkles className="absolute right-28 top-6 h-5 w-5 text-violet-400/70" />
      <Sparkles className="absolute bottom-16 right-32 h-4 w-4 text-indigo-400/60" />
    </div>
  );
}

function GridSectionHeader({
  icon: Icon,
  label,
  color = "violet",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  color?: "violet" | "emerald";
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon
        className={cn("h-4 w-4", color === "emerald" ? "text-emerald-600" : "text-violet-600")}
        strokeWidth={2}
      />
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.14em]",
          color === "emerald" ? "text-emerald-600" : "text-violet-600",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
  const [panelTool, setPanelTool] = useState<BlueprintPanelTool | null>(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setTools(data.tools || []);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Category", "Description", "Overall Score", "Traffic Score", "Backlink Score", "Monetization Score"];
    const rows = tools.map((t) => [
      t.name,
      t.category,
      t.description,
      t.overall_score,
      t.traffic_score,
      t.backlink_score,
      t.monetization_score,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name || "project"}-tools.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "Exported!", message: "CSV file downloaded" });
  };

  const blueprintTools = tools.filter((t) => t.blueprint);

  const filteredTools = blueprintTools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const blueprint = parseToolBlueprintJson(tool.blueprint as string);
    const purpose = ((blueprint.purpose as string) || tool.description || "").toLowerCase();
    return matchesGoalFilter(purpose, goalFilter);
  });

  const blueprintCount = blueprintTools.length;

  const subtitleParts = project
    ? [project.niche, project.goal, `${blueprintCount} assets`].filter(Boolean)
    : [];

  const handleClosePanel = useCallback(() => setPanelTool(null), []);

  const handleBlueprintUpdated = useCallback((toolId: number, blueprintJson: string) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, blueprint: blueprintJson } : t)),
    );
    setPanelTool((prev) => (prev?.id === toolId ? { ...prev, blueprint: blueprintJson } : prev));
  }, []);

  if (loading || !project) {
    return (
      <DashboardLayout innerClassName="p-0" shellClassName="bg-[#F3F4F8]">
        <div className="flex min-h-[60vh] items-center justify-center text-slate-500">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout innerClassName="p-0" shellClassName="bg-[#F3F4F8]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8 md:py-8">
        {/* —— Hero card —— */}
        <section className="relative mb-8 overflow-hidden rounded-[24px] bg-white shadow-[0_4px_24px_-4px_rgba(99,91,255,0.12),0_8px_40px_-8px_rgba(15,23,42,0.06)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_50%_40%_at_10%_80%,rgba(167,139,250,0.08),transparent_50%)]"
            aria-hidden
          />

          <div className="relative px-6 pb-14 pt-5 md:px-8 md:pb-16 md:pt-6">
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50/50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">
                  <FolderKanban className="h-3.5 w-3.5" />
                  PROJECT WORKSPACE
                </span>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-[2rem] lg:text-[2.15rem]">
                  {project.name}
                </h1>
                <p className="text-sm text-slate-500 md:text-[15px]">{subtitleParts.join(" · ")}</p>
              </div>
              <HeroIllustration />
            </div>

            {/* Asset Blueprint tab — overlaps bottom */}
            <div className="absolute bottom-0 left-6 md:left-8">
              <div className="inline-flex items-center gap-2 rounded-t-xl border border-b-0 border-slate-100 bg-white px-5 py-3 shadow-[0_-4px_20px_-4px_rgba(99,91,255,0.08)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="border-b-2 border-violet-600 pb-0.5 text-sm font-semibold text-slate-800">
                  Asset Blueprint
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[11px] font-bold text-white">
                  {blueprintCount}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* —— Toolbar —— */}
        <section className="mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600/90">YOUR PROJECTS</p>
          <div className="flex flex-col gap-3 rounded-2xl bg-white/60 p-3 shadow-sm ring-1 ring-slate-100/80 md:flex-row md:items-center md:p-4">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-none"
              />
            </div>
            <Select value={goalFilter} onValueChange={setGoalFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white md:w-[150px]">
                <SelectValue placeholder="All Goals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="backlinks">Drive Backlinks</SelectItem>
                <SelectItem value="leads">Generate Leads</SelectItem>
                <SelectItem value="traffic">Increase Traffic</SelectItem>
                <SelectItem value="engagement">Improve Engagement</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Archive className="h-4 w-4" />
              Archived
            </button>
            <Link to="/projects/new" className="md:ml-auto">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(99,91,255,0.45)] transition hover:shadow-[0_10px_28px_-6px_rgba(99,91,255,0.55)] md:w-auto"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </Link>
          </div>
        </section>

        {/* —— Blueprint cards —— */}
        {filteredTools.length === 0 ? (
          <div className="rounded-[24px] bg-white p-12 text-center shadow-sm">
            <p className="font-medium text-slate-700">No blueprints found</p>
            <p className="mt-1 text-sm text-slate-500">Try another search or goal filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTools.map((tool) => {
              const blueprint = parseToolBlueprintJson(tool.blueprint as string);
              const purpose = (blueprint.purpose as string) || tool.description || "";
              const monetization = (blueprint.monetization_strategy as string) || "";
              const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
              const keywords = Array.isArray(blueprint.target_keywords)
                ? (blueprint.target_keywords as string[])
                : [];

              return (
                <article
                  key={tool.id}
                  className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_24px_-4px_rgba(99,91,255,0.1),0_8px_32px_-8px_rgba(15,23,42,0.05)]"
                >
                  {/* Card header */}
                  <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 md:text-xl">{tool.name}</h2>
                        <span className="mt-1.5 inline-flex rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPanelTool({
                          id: tool.id,
                          project_id: tool.project_id,
                          name: tool.name,
                          description: tool.description,
                          category: tool.category,
                          blueprint: tool.blueprint,
                          landing_page_html: tool.landing_page_html,
                        })
                      }
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      View Full Blueprint
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </header>

                  {/* 2×2 grid */}
                  <div className="grid md:grid-cols-2">
                    {/* Purpose */}
                    <div className="border-b border-slate-100 p-6 md:border-r md:p-8">
                      <GridSectionHeader icon={Target} label="PURPOSE" />
                      <div className="border-l-[3px] border-violet-500 pl-4">
                        <p className="text-sm leading-relaxed text-slate-600 md:text-[15px] md:leading-7">{purpose}</p>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="border-b border-slate-100 p-6 md:p-8">
                      <GridSectionHeader icon={Search} label="KEYWORDS" />
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Monetization */}
                    {monetization ? (
                      <div className="relative overflow-hidden border-b border-slate-100 p-6 md:border-b-0 md:border-r md:p-8">
                        <div
                          className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl"
                          aria-hidden
                        />
                        <GridSectionHeader icon={CircleDollarSign} label="MONETIZATION" color="emerald" />
                        <div className="relative border-l-[3px] border-emerald-500 pl-4">
                          <p className="text-sm leading-relaxed text-slate-600 md:text-[15px] md:leading-7">
                            {monetization}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* CTA */}
                    {cta ? (
                      <div
                        className={cn(
                          "relative overflow-hidden bg-gradient-to-br from-violet-50/90 via-indigo-50/50 to-violet-100/40 p-6 md:p-8",
                          !monetization && "md:col-span-2",
                        )}
                      >
                        <GridSectionHeader icon={Zap} label="CALL TO ACTION" />
                        <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_24px_-8px_rgba(99,91,255,0.15)]">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-800">{cta}</p>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <BlueprintDetailPanel
        tool={panelTool}
        open={panelTool !== null}
        onClose={handleClosePanel}
        onBlueprintUpdated={handleBlueprintUpdated}
      />
    </DashboardLayout>
  );
}
