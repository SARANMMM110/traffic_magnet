import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Plus, Search, Archive } from "lucide-react";

interface Tool {
  id: number;
  project_id: number;
  project_name: string;
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

export default function ProjectsList() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch("/api/tools/with-blueprints", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
        setFilteredTools(data.tools || []);
      }
    } catch (error) {
      console.error("Failed to load tools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tools;

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tool.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by goal
    if (goalFilter !== "all") {
      filtered = filtered.filter((tool) => {
        const blueprint = tool.blueprint ? parseToolBlueprintJson(tool.blueprint) : {};
        const purpose = ((blueprint.purpose as string) || "").toLowerCase();
        
        switch (goalFilter) {
          case "backlinks":
            return purpose.includes("backlink") || purpose.includes("link building");
          case "leads":
            return purpose.includes("lead") || purpose.includes("email") || purpose.includes("contact");
          case "traffic":
            return purpose.includes("traffic") || purpose.includes("visitor") || purpose.includes("seo");
          case "engagement":
            return purpose.includes("engagement") || purpose.includes("conversion") || purpose.includes("retention");
          default:
            return true;
        }
      });
    }

    setFilteredTools(filtered);
  }, [searchTerm, goalFilter, tools]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-sm font-semibold uppercase tracking-wider text-slate-500">YOUR PROJECTS</h1>
          </div>

          {/* Filters Bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">All Goals</option>
              <option value="backlinks">Drive Backlinks</option>
              <option value="leads">Generate Leads</option>
              <option value="traffic">Increase Traffic</option>
              <option value="engagement">Improve Engagement</option>
            </select>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Archive className="h-4 w-4" />
              Archived
            </button>

            <Link to="/projects/new">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </Link>
          </div>

          {/* Tools List */}
          {loading ? (
            <div className="py-12 text-center text-slate-600">Loading...</div>
          ) : filteredTools.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No blueprints found</h3>
              <p className="text-sm text-slate-600">Generate blueprints for your tools to see them here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTools.map((tool) => {
                const blueprint = tool.blueprint ? parseToolBlueprintJson(tool.blueprint) : {};
                const purpose = (blueprint.purpose as string) || tool.description || "";
                const monetization = (blueprint.monetization_strategy as string) || "";
                const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
                const keywords = Array.isArray(blueprint.target_keywords)
                  ? (blueprint.target_keywords as string[])
                  : [];

                return (
                  <div
                    key={tool.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    {/* Title */}
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-slate-900">{tool.name}</h2>
                      <p className="text-sm text-violet-600">{tool.category}</p>
                    </div>

                    {/* Two Column Layout */}
                    <div className="mb-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Left: Purpose */}
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          PURPOSE
                        </div>
                        <p className="text-sm leading-relaxed text-slate-900">{purpose}</p>
                      </div>

                      {/* Right: Keywords */}
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          KEYWORDS
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword: string, i: number) => (
                            <span
                              key={i}
                              className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Left: Monetization */}
                      {monetization && (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            MONETIZATION
                          </div>
                          <p className="text-sm leading-relaxed text-slate-900">{monetization}</p>
                        </div>
                      )}

                      {/* Right: Call to Action */}
                      {cta && (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            CALL TO ACTION
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-orange-600">{cta}</p>
                        </div>
                      )}
                    </div>

                    {/* View Blueprint Button */}
                    <div className="mt-6 flex justify-end">
                      <Link to={`/blueprints/${tool.id}`}>
                        <button
                          type="button"
                          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                        >
                          View Full Blueprint
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
