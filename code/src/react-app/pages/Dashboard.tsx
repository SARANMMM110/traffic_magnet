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
  FolderOpen,
  LayoutDashboard,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

interface DashboardStats {
  projectCount: number;
  toolCount: number;
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
        setStats(statsData);
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
        <div className="surface-panel flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="section-eyebrow">Overview</div>
            <h1 className="flex items-center gap-2 text-4xl font-bold">
              <LayoutDashboard className="h-9 w-9 text-[var(--brand)]" />
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {firstName}. Track projects, tools, and publishing at a glance.
            </p>
          </div>
          <Link to="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New project
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Projects</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {loading ? "—" : stats?.projectCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Active workspaces</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Tools</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {loading ? "—" : stats?.toolCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Generated assets</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Niches</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {loading ? "—" : nicheCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Distinct markets</p>
          </Card>
        </div>

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
