import { Link, useNavigate } from "react-router";
import { Archive, ChevronRight, Orbit, Plus, Search, Trash2 } from "lucide-react";
import type { DashboardProject } from "./dashboardTypes";

const GOAL_COLORS: Record<string, string> = {
  backlinks: "#38bdf8",
  leads: "#34d399",
  traffic: "#fb923c",
  engagement: "#c084fc",
};

const GOAL_LABELS: Record<string, string> = {
  backlinks: "Backlinks",
  leads: "Leads",
  traffic: "Traffic",
  engagement: "Engagement",
};

interface DashboardProjectsRailProps {
  projects: DashboardProject[];
  filteredProjects: DashboardProject[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  goalFilter: string;
  setGoalFilter: (g: string) => void;
  hoveredProject: number | null;
  setHoveredProject: (id: number | null) => void;
  getProjectColor: (index: number) => string;
  getProjectInitial: (name: string) => string;
  onArchive: (e: React.MouseEvent, project: DashboardProject) => void;
  onDeleteClick: (e: React.MouseEvent, project: DashboardProject) => void;
}

export default function DashboardProjectsRail({
  projects,
  filteredProjects,
  loading,
  searchQuery,
  setSearchQuery,
  goalFilter,
  setGoalFilter,
  hoveredProject,
  setHoveredProject,
  getProjectColor,
  getProjectInitial,
  onArchive,
  onDeleteClick,
}: DashboardProjectsRailProps) {
  const navigate = useNavigate();
  const goals = ["all", "backlinks", "leads", "traffic", "engagement"] as const;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <Orbit className="h-3.5 w-3.5 text-violet-500" strokeWidth={2} />
            Workspaces
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Command list
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Search, filter by objective, open a project, or manage lifecycle.
          </p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New workspace
        </Link>
      </div>

      {projects.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or niche…"
              className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-inner outline-none ring-violet-500/20 transition focus:border-violet-300 focus:ring-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoalFilter(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  goalFilter === g
                    ? "bg-slate-900 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {g === "all" ? "All objectives" : GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 py-20">
          <div className="spinner mb-4" />
          <p className="text-sm font-medium text-slate-600">Syncing workspace telemetry…</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-[1.25rem] border border-slate-200/80 bg-gradient-to-br from-white to-violet-50/40 px-8 py-16 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200/60 bg-violet-500/10">
            <Orbit className="h-8 w-8 text-violet-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {projects.length === 0 ? "No workspaces yet" : "Nothing matches this filter"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {projects.length === 0
              ? "Spin up your first project to unlock blueprint routing, asset generation, and publish paths."
              : "Try another objective chip or clear your search."}
          </p>
          {projects.length === 0 && (
            <Link
              to="/projects/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700"
            >
              Initialize workspace
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredProjects.map((project, index) => (
            <li key={project.id}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/projects/${project.id}`);
                  }
                }}
                className={`group relative flex cursor-pointer flex-col gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm transition sm:flex-row sm:items-center sm:gap-5 sm:p-5 ${
                  hoveredProject === project.id
                    ? "border-violet-300/80 shadow-md ring-1 ring-violet-200/60"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div
                  className="absolute left-0 top-4 bottom-4 w-1 rounded-full opacity-90 sm:top-5 sm:bottom-5"
                  style={{
                    background: `linear-gradient(180deg, ${getProjectColor(index)}, transparent)`,
                  }}
                />
                <div className="flex flex-1 items-start gap-4 pl-3 sm:items-center sm:pl-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-inner"
                    style={{
                      background: `linear-gradient(145deg, ${getProjectColor(index)}, #1e293b)`,
                    }}
                  >
                    {getProjectInitial(project.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 sm:text-lg">{project.name}</h3>
                      {project.goal && (
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: `${GOAL_COLORS[project.goal]}18`,
                            color: GOAL_COLORS[project.goal],
                          }}
                        >
                          {GOAL_LABELS[project.goal]}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{project.niche}</p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {project.tool_count} linked assets ·{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pl-3 sm:pl-0">
                  {hoveredProject === project.id && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => onArchive(e, project)}
                        className="rounded-xl border border-amber-200/80 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onDeleteClick(e, project)}
                        className="rounded-xl border border-red-200/80 bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </>
                  )}
                  <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
