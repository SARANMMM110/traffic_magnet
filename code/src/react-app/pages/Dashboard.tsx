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
  Compass,
  FileCode2,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
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
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.12]"
              style={{ background: "radial-gradient(circle at center, var(--brand), transparent 70%)" }}
            />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="flex max-w-xl flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm"
                  style={{
                    background:
                      "linear-gradient(145deg, color-mix(in srgb, var(--brand) 18%, white), color-mix(in srgb, var(--brand) 8%, transparent))",
                    borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)",
                  }}
                >
                  <LayoutDashboard className="h-7 w-7 text-[var(--brand)]" strokeWidth={2} />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="section-eyebrow">Overview</div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Dashboard</h1>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
                    Welcome back, <span className="font-medium text-foreground">{firstName}</span>. Track
                    workspaces, blueprints, and markets in one place — then open any project below.
                  </p>
                </div>
              </div>
              <Link to="/projects/new" className="shrink-0">
                <Button size="lg" className="h-12 w-full gap-2 rounded-xl px-6 shadow-md sm:w-auto">
                  <Plus className="h-5 w-5" />
                  New project
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="group relative overflow-hidden border-border/80 bg-gradient-to-b from-card to-muted/25 p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--brand)]/[0.07] blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex flex-col gap-1">
                <div className="mb-3 inline-flex w-fit rounded-xl bg-[var(--brand)]/10 p-2.5 text-[var(--brand)]">
                  <FolderKanban className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</p>
                <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                  {loading ? "—" : stats?.projectCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Active workspaces you&apos;re building in</p>
              </div>
            </Card>

            <Card className="group relative overflow-hidden border-border/80 bg-gradient-to-b from-card to-muted/25 p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/[0.08] blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex flex-col gap-1">
                <div className="mb-3 inline-flex w-fit rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                  <FileCode2 className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blueprints</p>
                <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                  {loading ? "—" : stats?.blueprintCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Saved tool specs across projects</p>
                {!loading && stats != null && stats.toolCount > 0 && (
                  <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span className="font-medium tabular-nums text-foreground">{stats.toolCount}</span>{" "}
                    discovery ideas in the pipeline
                  </p>
                )}
              </div>
            </Card>

            <Card className="group relative overflow-hidden border-border/80 bg-gradient-to-b from-card to-muted/25 p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/[0.08] blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex flex-col gap-1">
                <div className="mb-3 inline-flex w-fit rounded-xl bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400">
                  <Compass className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niches</p>
                <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                  {loading ? "—" : nicheCount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Distinct markets in your portfolio</p>
              </div>
            </Card>
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
