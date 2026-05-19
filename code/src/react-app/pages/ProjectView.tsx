import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { Card } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { ArrowLeft, Archive, Download, Plus, Search } from "lucide-react";

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

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");

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

  if (loading || !project) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout innerClassName="p-0">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 lg:px-8">
        {/* Page header */}
        <header className="space-y-5">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                {project.niche} · {blueprintCount} assets
              </p>
            </div>
            <Button variant="outline" onClick={exportCSV} className="shrink-0 gap-2 self-start">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Asset Blueprint tab */}
          <div className="flex items-center gap-2 border-b border-border pb-0">
            <span className="inline-flex items-center gap-2 border-b-2 border-[var(--brand)] px-1 pb-3 text-sm font-semibold text-foreground">
              Asset Blueprint
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[11px] font-bold text-white tabular-nums">
                {blueprintCount}
              </span>
            </span>
          </div>
        </header>

        {/* Toolbar */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">YOUR PROJECTS</h2>
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
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
              <Button type="button" variant="outline" className="gap-2">
                <Archive className="h-4 w-4" />
                Archived
              </Button>
              <Link to="/projects/new" className="lg:ml-auto">
                <Button className="w-full gap-2 lg:w-auto">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Asset list — stacked sections (distinct from vendor 2×2 grid) */}
        <section className="space-y-5">
          {filteredTools.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No blueprints found</p>
            </Card>
          ) : (
            filteredTools.map((tool) => {
              const blueprint = parseToolBlueprintJson(tool.blueprint as string);
              const purpose = (blueprint.purpose as string) || tool.description || "";
              const monetization = (blueprint.monetization_strategy as string) || "";
              const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
              const keywords = Array.isArray(blueprint.target_keywords)
                ? (blueprint.target_keywords as string[])
                : [];

              return (
                <Card key={tool.id} className="overflow-hidden p-0">
                  <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">{tool.category}</p>
                    </div>
                    <Link to={`/blueprints/${tool.id}`} className="shrink-0">
                      <Button
                        variant="outline"
                        className="w-full border-amber-500/60 text-amber-700 hover:bg-amber-500/10 sm:w-auto"
                      >
                        View Full Blueprint
                      </Button>
                    </Link>
                  </div>

                  <div className="divide-y divide-border">
                    <div className="grid gap-6 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">PURPOSE</p>
                        <p className="text-sm leading-relaxed text-foreground">{purpose}</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">KEYWORDS</p>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 px-5 py-5 md:grid-cols-2">
                      {monetization ? (
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            MONETIZATION
                          </p>
                          <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{monetization}</p>
                        </div>
                      ) : null}
                      {cta ? (
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            CALL TO ACTION
                          </p>
                          <p className="text-sm font-medium leading-relaxed text-amber-700">{cta}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
