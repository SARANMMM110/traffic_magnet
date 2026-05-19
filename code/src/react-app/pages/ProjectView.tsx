import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import {
  ArrowLeft,
  Download,
  Search,
  Plus,

  TrendingUp,
  Users,
  Target,
  Zap,
  ExternalLink,
  X,
  Tag,
  DollarSign,
  Eye,
  BarChart3,
  FileText,
  Rocket,
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
    const ir = blueprint.inputs_required;
    if (typeof ir === "string") {
      blueprint.inputs_required = ir.split(",").map((k: string) => k.trim());
    }
    const ils = blueprint.internal_linking_suggestions;
    if (typeof ils === "string") {
      blueprint.internal_links = ils.split(",").map((k: string) => k.trim());
    }
  }
  return blueprint;
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
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

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
    const rows = tools.map(t => [
      t.name,
      t.category,
      t.description,
      t.overall_score,
      t.traffic_score,
      t.backlink_score,
      t.monetization_score
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name || "project"}-tools.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "Exported!", message: "CSV file downloaded" });
  };

  const filteredTools = tools.filter((tool) => {
    if (!tool.blueprint) return false;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const blueprintCount = tools.filter(t => t.blueprint).length;

  if (loading || !project) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
        {/* Premium Hero Header */}
        <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-[1400px] px-8 py-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </button>

            <div className="flex items-start justify-between gap-8">
              {/* Left: Project Info */}
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.name}</h1>
                </div>
                <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    {project.niche}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-violet-600">{blueprintCount} assets</span>
                  {project.goal && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{project.goal}</span>
                    </>
                  )}
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                  AI-powered asset intelligence workspace for {project.niche}. Monitor performance, optimize monetization, and track conversion opportunities.
                </p>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <Link to="/audience-growth">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm transition-all hover:shadow"
                  >
                    <Users className="h-4 w-4" />
                    Audience Engine
                  </button>
                </Link>
                <Link to="/projects/new">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                  >
                    <Plus className="h-4 w-4" />
                    Create Asset
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="border-b border-slate-200/60 py-6">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="mb-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-violet-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Asset Intelligence</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets by name, category, or keyword..."
                  className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100"
                />
              </div>

              {/* Goal Filter */}
              <select
                value={goalFilter}
                onChange={(e) => setGoalFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100"
              >
                <option value="all">All Goals</option>
                <option value="backlinks">Drive Backlinks</option>
                <option value="leads">Generate Leads</option>
                <option value="traffic">Increase Traffic</option>
                <option value="engagement">Improve Engagement</option>
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">{filteredTools.length} assets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Cards Grid */}
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <div className="space-y-5">
            {filteredTools.map((tool) => {
              const blueprint = parseToolBlueprintJson(tool.blueprint as string);
              const purpose = (blueprint.purpose as string) || tool.description || "";
              const monetization = (blueprint.monetization_strategy as string) || "";
              const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
              const keywords = Array.isArray(blueprint.target_keywords)
                ? (blueprint.target_keywords as string[])
                : [];

              return (
                <div
                  key={tool.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5"
                >
                  {/* Decorative gradient */}
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-violet-100/50 to-indigo-100/50 opacity-0 transition-opacity group-hover:opacity-100"></div>

                  {/* Top Area */}
                  <div className="relative mb-6 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="mb-1 text-xl font-bold text-slate-900">{tool.name}</h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {tool.category}
                          </span>
                        </div>
                      </div>
                      
                      {/* AI Score Badges */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <Target className="h-3 w-3" />
                          Quality: {tool.overall_score}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          <TrendingUp className="h-3 w-3" />
                          SEO: {tool.traffic_score}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          <DollarSign className="h-3 w-3" />
                          Revenue: {tool.monetization_score}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTool(tool)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                      >
                        <Eye className="h-4 w-4" />
                        View Blueprint
                      </button>
                    </div>
                  </div>

                  {/* Middle Area: 2-Column Intelligent Layout */}
                  <div className="relative grid grid-cols-2 gap-8 rounded-xl bg-gradient-to-br from-slate-50/50 to-white/50 p-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      {/* Purpose */}
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-violet-600"></div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Purpose & Value</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700">{purpose}</p>
                      </div>

                      {/* Monetization */}
                      {monetization && (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-emerald-600"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Monetization Strategy</span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700">{monetization}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      {/* Keywords */}
                      {keywords.length > 0 && (
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Keyword Intelligence</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {keywords.slice(0, 6).map((keyword: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:shadow-sm"
                              >
                                <Tag className="h-3 w-3" />
                                {keyword}
                              </span>
                            ))}
                            {keywords.length > 6 && (
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                +{keywords.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Call to Action */}
                      {cta && (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-orange-600"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Conversion CTA</span>
                          </div>
                          <div className="rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-orange-700">{cta}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <Link to={`/blueprints/${tool.id}`} className="flex-1">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-violet-300 hover:bg-violet-50/50"
                      >
                        <FileText className="h-4 w-4" />
                        Blueprint
                      </button>
                    </Link>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-700"
                    >
                      <Rocket className="h-4 w-4" />
                      Deploy
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTools.length === 0 && (
              <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-16 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No assets found</p>
                <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sliding Blueprint Panel */}
      {selectedTool && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTool(null)}
          ></div>

          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-8 py-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedTool.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">Complete asset blueprint</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTool(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {(() => {
                  const blueprint = parseToolBlueprintJson(selectedTool.blueprint as string);
                  const purpose = (blueprint.purpose as string) || "";
                  const description = (blueprint.description as string) || "";
                  const monetization = (blueprint.monetization_strategy as string) || "";
                  const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
                  const keywords = Array.isArray(blueprint.target_keywords)
                    ? (blueprint.target_keywords as string[])
                    : [];
                  const inputs = Array.isArray(blueprint.inputs_required)
                    ? (blueprint.inputs_required as string[])
                    : [];

                  return (
                    <>
                      {/* Purpose */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Purpose</h3>
                        <p className="text-sm leading-relaxed text-slate-700">{purpose || description}</p>
                      </div>

                      {/* Keywords */}
                      {keywords.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Target Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700"
                              >
                                <Tag className="h-3 w-3" />
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inputs */}
                      {inputs.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">Required Inputs</h3>
                          <ul className="space-y-2">
                            {inputs.map((input: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                <div className="h-1.5 w-1.5 rounded-full bg-violet-600"></div>
                                {input}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Monetization */}
                      {monetization && (
                        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-700">Monetization Strategy</h3>
                          <p className="text-sm leading-relaxed text-slate-700">{monetization}</p>
                        </div>
                      )}

                      {/* CTA */}
                      {cta && (
                        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-700">Call to Action</h3>
                          <p className="text-sm font-semibold text-orange-700">{cta}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4">
                        <Link to={`/blueprints/${selectedTool.id}`} className="flex-1">
                          <button
                            type="button"
                            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Open Full Blueprint
                            </div>
                          </button>
                        </Link>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
