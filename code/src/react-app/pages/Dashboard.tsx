import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
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
import { useToast } from "@/react-app/components/Toast";
import { ConfirmModal } from "@/react-app/components/ConfirmModal";
import {
  Archive,
  ArrowRight,
  Calendar,
  ChevronRight,
  Compass,
  FileCode2,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  Layers,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

interface DashboardStats {
  projectCount: number;
  toolCount: number;
  blueprintCount: number;
  builtToolCount: number;
  seoPageCount: number;
}

interface Project {
  id: number;
  name: string;
  niche: string;
  goal: string | null;
  tool_count: number;
  created_at: string;
  updated_at?: string;
}

const GOAL_LABELS: Record<string, string> = {
  backlinks: "Backlinks",
  leads: "Leads",
  traffic: "Traffic",
  engagement: "Engagement",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, projectsRes] = await Promise.all([
        fetch("/api/dashboard/stats", { credentials: "include" }),
        fetch("/api/projects", { credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const blueprintCount =
          typeof statsData.blueprintCount === "number" ? statsData.blueprintCount : 0;
        setStats({
          ...statsData,
          blueprintCount,
        } as DashboardStats);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects((projectsData.projects || []) as Project[]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (e: MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/projects/${project.id}/archive`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        showToast({
          type: "success",
          title: "Project archived",
          message: `${project.name} has been archived`,
        });
        loadData();
      } else throw new Error("Archive failed");
    } catch {
      showToast({ type: "error", title: "Archive failed", message: "Could not archive project" });
    }
  };

  const handleDeleteClick = (e: MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        showToast({
          type: "success",
          title: "Project deleted",
          message: `${projectToDelete.name} has been permanently deleted`,
        });
        setDeleteModalOpen(false);
        setProjectToDelete(null);
        loadData();
      } else throw new Error("Delete failed");
    } catch {
      showToast({ type: "error", title: "Delete failed", message: "Could not delete project" });
    }
  };

  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGoal = goalFilter === "all" || project.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  const nicheCount =
    projects.length > 0 ? new Set(projects.map((p) => p.niche)).size : 0;

  const formatDate = (p: Project) => {
    const raw = p.updated_at || p.created_at;
    return new Date(raw).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const firstName = user?.google_user_data?.name?.split(" ")[0] || "there";

  return (
    <DashboardLayout>
      <div className="page-shell max-w-7xl space-y-8">
        <section className="relative">
          <div
            className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)]"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div
              className="h-1 w-full bg-gradient-to-r from-[var(--brand)] via-indigo-400 to-[var(--accent-cyan)]"
              aria-hidden
            />

            <div className="relative px-5 py-8 md:px-9 md:py-10">
              <div
                className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full opacity-50"
                style={{ background: "radial-gradient(circle at center, var(--brand-glow), transparent 68%)" }}
              />
              <div
                className="pointer-events-none absolute -left-32 bottom-0 h-56 w-56 rounded-full opacity-30"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(8, 145, 178, 0.12), transparent 70%)",
                }}
              />

              <div className="relative flex flex-col gap-10 lg:gap-12">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        <LayoutDashboard className="h-3.5 w-3.5 text-[var(--brand)]" aria-hidden />
                        Overview
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-[2.4rem]">
                        Dashboard
                      </h1>
                      <p className="text-pretty text-sm leading-relaxed text-[var(--text-secondary)] md:text-[15px] md:leading-7">
                        Hi, <span className="font-semibold text-[var(--text-primary)]">{firstName}</span>{" "}
                        — track workspaces, saved blueprints, and the markets you are building for. Open any
                        project below to keep shipping.
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:flex-col lg:items-stretch">
                    <Link to="/projects/new" className="w-full sm:w-auto lg:w-full">
                      <Button
                        size="lg"
                        className="h-12 w-full gap-2 rounded-[var(--radius-control)] px-6 text-[15px] font-semibold shadow-sm sm:min-w-[200px]"
                      >
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                        New project
                      </Button>
                    </Link>
                    <Link
                      to="/magnets"
                      className="group inline-flex items-center justify-center gap-1 self-center text-sm font-semibold text-[var(--brand)] hover:underline sm:self-end lg:self-stretch lg:justify-end"
                    >
                      Blueprint library
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

                <div className="relative border-t border-[var(--border)] pt-8 lg:pt-10">
                  <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Workspace pulse
                  </p>
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-8">
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] shadow-[var(--shadow-xs)]">
                          <FolderKanban className="h-5 w-5" strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Projects
                        </span>
                      </div>
                      <p className="text-5xl font-bold tabular-nums tracking-tighter text-foreground md:text-[3.25rem]">
                        {loading ? "—" : stats?.projectCount ?? 0}
                      </p>
                      <p className="mt-2 max-w-[14rem] text-sm leading-snug text-muted-foreground">
                        Active workspaces you&apos;re running experiments in.
                      </p>
                    </div>

                    <div className="border-t border-border/70 pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/[0.12] text-emerald-600 shadow-[var(--shadow-xs)] dark:text-emerald-400">
                          <FileCode2 className="h-5 w-5" strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Blueprints
                        </span>
                        {!loading && stats != null && stats.toolCount > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <Layers className="h-3 w-3 text-foreground/50" aria-hidden />
                            <span className="tabular-nums text-foreground">{stats.toolCount}</span>
                            <span className="font-medium normal-case">ideas</span>
                          </span>
                        )}
                      </div>
                      <p className="text-5xl font-bold tabular-nums tracking-tighter text-foreground md:text-[3.25rem]">
                        {loading ? "—" : stats?.blueprintCount ?? 0}
                      </p>
                      <p className="mt-2 max-w-[15rem] text-sm leading-snug text-muted-foreground">
                        Tool specs saved and ready to generate or refine.
                      </p>
                    </div>

                    <div className="border-t border-border/70 pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 shadow-[var(--shadow-xs)] dark:text-amber-400">
                          <Compass className="h-5 w-5" strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Niches
                        </span>
                      </div>
                      <p className="text-5xl font-bold tabular-nums tracking-tighter text-foreground md:text-[3.25rem]">
                        {loading ? "—" : nicheCount}
                      </p>
                      <p className="mt-2 max-w-[14rem] text-sm leading-snug text-muted-foreground">
                        Distinct markets represented across your projects.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold">Your projects</h2>
            <p className="text-sm text-muted-foreground">
              Search, filter by goal, and open a project from the grid.
            </p>
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or niche…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All goals</SelectItem>
                  <SelectItem value="backlinks">Backlinks</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading projects…</div>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">
              {projects.length === 0 ? "No projects yet" : "No matching projects"}
            </h3>
            <p className="mb-6 text-muted-foreground">
              {projects.length === 0
                ? "Create a project to start building traffic tools and landing pages."
                : "Try another search or goal filter."}
            </p>
            {projects.length === 0 && (
              <Link to="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create first project
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project: Project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <Card className="relative flex h-full flex-col space-y-4 p-6 transition-all hover:border-[var(--brand)]/40 hover:shadow-md">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-lg font-semibold">{project.name}</h3>
                        <div className="flex shrink-0 items-center gap-2">
                          {hoveredProject === project.id && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleArchiveProject(e, project)}
                                className="rounded-md p-1.5 transition-colors hover:bg-amber-500/15"
                                title="Archive"
                              >
                                <Archive className="h-4 w-4 text-amber-600" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, project)}
                                className="rounded-md p-1.5 transition-colors hover:bg-red-500/15"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </>
                          )}
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <span className="inline-block rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                        {project.niche}
                      </span>
                    </div>

                    {project.goal && (
                      <p className="text-sm text-muted-foreground">
                        Goal:{" "}
                        <span className="font-medium text-foreground">
                          {GOAL_LABELS[project.goal] ?? project.goal}
                        </span>
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(project)}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{project.tool_count}</p>
                        <p className="text-xs text-muted-foreground">tools</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length}{" "}
              {projects.length === 1 ? "project" : "projects"}
            </p>
          </>
        )}

        {deleteModalOpen && projectToDelete && (
          <ConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setProjectToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete project"
            description={`Are you sure you want to delete "${projectToDelete.name}"? This will permanently delete all ${projectToDelete.tool_count} assets. This action cannot be undone.`}
            confirmLabel="Delete project"
            confirmVariant="danger"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
