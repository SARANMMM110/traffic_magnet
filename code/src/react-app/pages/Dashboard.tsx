import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { ConfirmModal } from "@/react-app/components/ConfirmModal";
import { QuickAction } from "@/react-app/components/QuickAction";
import {
  Sparkles,
  Plus,
  Search,
  ChevronRight,
  Rocket,
  Archive,
  Trash2,
  Zap,
  FileText,
  Wand2,
  TrendingUp,
  Target,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface DashboardStats {
  projectCount: number;
  toolCount: number;
  builtToolCount: number;
  seoPageCount: number;
  recentProjects: Array<{
    id: number;
    name: string;
    niche: string;
    goal: string | null;
    tool_count: number;
    created_at: string;
  }>;
}

interface Project {
  id: number;
  name: string;
  niche: string;
  goal: string | null;
  tool_count: number;
  created_at: string;
}

const GOAL_COLORS: Record<string, string> = {
  backlinks: "#3B82F6",
  leads: "#10B981",
  traffic: "#F59E0B",
  engagement: "#8B5CF6",
};

const GOAL_LABELS: Record<string, string> = {
  backlinks: "Backlinks",
  leads: "Leads",
  traffic: "Traffic",
  engagement: "Engagement",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        setProjects(projectsData.projects || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (e: React.MouseEvent, project: Project) => {
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
      } else {
        throw new Error("Archive failed");
      }
    } catch (error) {
      console.error("Failed to archive project:", error);
      showToast({
        type: "error",
        title: "Archive failed",
        message: "Could not archive project",
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
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
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      showToast({
        type: "error",
        title: "Delete failed",
        message: "Could not delete project",
      });
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGoal = goalFilter === "all" || project.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  const getProjectColor = (index: number) => {
    const colors = ["#7C5CFC", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    return colors[index % colors.length];
  };

  const getProjectInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="page-shell space-y-8">
        {/* Hero Welcome Section */}
        <div className="surface-panel relative overflow-hidden">
          <div
            className="absolute right-0 top-0 w-96 h-96 opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(99, 91, 255, 0.4), transparent)",
            }}
          />
          <div className="relative z-10 p-8 md:p-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-[var(--border)] mb-6">
                <Sparkles className="w-4 h-4 text-[var(--brand)]" />
                <span className="text-sm font-semibold text-[var(--brand)]">
                  AI-Powered Growth Studio
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                Welcome back,{" "}
                <span className="text-gradient">{user?.google_user_data.name?.split(" ")[0] || "there"}</span>
              </h1>
              <p className="text-xl leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
                Create AI-powered SEO tools in minutes. Build traffic magnets, generate landing pages,
                and wrap content—all from one polished workspace.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Link to="/projects/new">
                  <button className="btn-primary rounded-2xl px-6 py-3.5 text-base font-semibold inline-flex items-center gap-2 shadow-xl">
                    <Zap className="w-5 h-5" />
                    Generate New Tool
                  </button>
                </Link>
                <Link to="/content">
                  <button className="btn-secondary rounded-2xl px-6 py-3.5 text-base font-semibold inline-flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Content Wrapper
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Section - Contextual Guidance */}
        {!loading && (
          <div className="premium-card p-8">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                }}
              >
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  {projects.length === 0 ? "Get Started in 3 Steps" : "Recommended Next Steps"}
                </h2>
                <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                  {projects.length === 0
                    ? "Here's how to create your first traffic magnet"
                    : "Continue growing your traffic toolkit"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {projects.length === 0 ? (
                <>
                  <QuickAction
                    to="/projects/new"
                    icon={Target}
                    title="Create Your First Project"
                    description="Choose a niche and set your traffic goal. We'll discover tool ideas for you."
                    color="#635BFF"
                    iconBg="rgba(99, 91, 255, 0.15)"
                  />
                  <div className="premium-card p-6 opacity-60">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(16, 185, 129, 0.15)" }}
                    >
                      <Wand2 className="w-7 h-7" style={{ color: "#10B981" }} />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      Generate Blueprint
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      AI creates detailed blueprints with keywords, monetization, and CTAs
                    </p>
                  </div>
                  <div className="premium-card p-6 opacity-60">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(37, 99, 235, 0.15)" }}
                    >
                      <Rocket className="w-7 h-7" style={{ color: "#2563EB" }} />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      Build & Publish
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Generate landing pages and export ready-to-publish HTML
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <QuickAction
                    to="/projects/new"
                    icon={Plus}
                    title="Create Another Project"
                    description="Expand into new niches and discover more tool opportunities."
                    color="#635BFF"
                    iconBg="rgba(99, 91, 255, 0.15)"
                  />
                  <QuickAction
                    to={`/projects/${projects[0].id}`}
                    icon={TrendingUp}
                    title="Optimize Existing Tools"
                    description="Generate variations and landing pages for your current assets."
                    color="#10B981"
                    iconBg="rgba(16, 185, 129, 0.15)"
                  />
                  <QuickAction
                    to="/content"
                    icon={FileText}
                    title="Wrap with Content"
                    description="Boost SEO by wrapping tools in AI-generated articles."
                    color="#2563EB"
                    iconBg="rgba(37, 99, 235, 0.15)"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div>
          <h3 className="section-eyebrow mb-5">YOUR PROGRESS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="premium-card p-7">
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(99, 91, 255, 0.15)" }}
                >
                  <Target className="w-7 h-7" style={{ color: "var(--brand)" }} />
                </div>
                <span className="section-eyebrow">Projects</span>
              </div>
              <p className="text-5xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {loading ? "..." : stats?.projectCount || 0}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Active campaigns running
              </p>
            </div>

            <div className="premium-card p-7">
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(16, 185, 129, 0.15)" }}
                >
                  <Zap className="w-7 h-7" style={{ color: "#10B981" }} />
                </div>
                <span className="section-eyebrow">Tools</span>
              </div>
              <p className="text-5xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {loading ? "..." : stats?.toolCount || 0}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Traffic magnets generated
              </p>
            </div>

            <div className="premium-card p-7">
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(245, 158, 11, 0.15)" }}
                >
                  <TrendingUp className="w-7 h-7" style={{ color: "#F59E0B" }} />
                </div>
                <span className="section-eyebrow">Niches</span>
              </div>
              <p className="text-5xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {loading
                  ? "..."
                  : projects.length > 0
                  ? new Set(projects.map((p) => p.niche)).size
                  : 0}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Markets explored
              </p>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-eyebrow">YOUR PROJECTS</h3>
            <Link to="/projects/new">
              <button className="btn-primary rounded-2xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </Link>
          </div>

          {/* Search & Filters */}
          {projects.length > 0 && (
            <div className="premium-card p-5 mb-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects by name or niche..."
                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl text-base"
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <select
                  value={goalFilter}
                  onChange={(e) => setGoalFilter(e.target.value)}
                  className="px-5 py-3.5 rounded-2xl text-base font-medium"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="all">All Goals</option>
                  <option value="backlinks">Backlinks</option>
                  <option value="leads">Leads</option>
                  <option value="traffic">Traffic</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>
            </div>
          )}

          {/* Project List */}
          {loading ? (
            <div className="premium-card p-16 text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
                Loading your projects...
              </p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="premium-card p-16 text-center">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center"
                style={{ background: "rgba(99, 91, 255, 0.15)" }}
              >
                <Rocket className="w-12 h-12" style={{ color: "var(--brand)" }} />
              </div>
              <h3 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                {projects.length === 0
                  ? "Ready to build your first traffic magnet?"
                  : "No matching projects"}
              </h3>
              <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                {projects.length === 0
                  ? "Create a project, choose your niche, and let AI discover tool opportunities for you."
                  : "Try adjusting your search or filter settings"}
              </p>
              {projects.length === 0 && (
                <Link to="/projects/new">
                  <button className="btn-primary rounded-2xl px-8 py-4 text-lg font-semibold inline-flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Create First Project
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="premium-card p-6 flex items-center gap-5 group cursor-pointer"
                  style={{
                    borderColor:
                      hoveredProject === project.id ? "rgba(99, 91, 255, 0.3)" : "var(--border)",
                  }}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-2xl flex-shrink-0 shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${getProjectColor(index)}, var(--brand-dim))`,
                    }}
                  >
                    {getProjectInitial(project.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-4 flex-wrap">
                      <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
                        {project.niche}
                      </p>
                      {project.goal && (
                        <span
                          className="px-3 py-1.5 rounded-xl text-sm font-bold"
                          style={{
                            background: `${GOAL_COLORS[project.goal]}20`,
                            color: GOAL_COLORS[project.goal],
                          }}
                        >
                          {GOAL_LABELS[project.goal]}
                        </span>
                      )}
                      <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        {project.tool_count} {project.tool_count === 1 ? "tool" : "tools"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hoveredProject === project.id && (
                      <>
                        <button
                          onClick={(e) => handleArchiveProject(e, project)}
                          className="p-3 rounded-2xl transition-all hover:scale-110"
                          style={{
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "var(--accent-amber)",
                          }}
                          title="Archive"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, project)}
                          className="p-3 rounded-2xl transition-all hover:scale-110"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#EF4444",
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                        Created
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-6 h-6 group-hover:translate-x-2 transition-transform"
                      style={{ color: "var(--brand)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && projectToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Project"
          description={`Are you sure you want to delete "${projectToDelete.name}"? This will permanently delete all ${projectToDelete.tool_count} assets. This action cannot be undone.`}
          confirmLabel="Delete Project"
          confirmVariant="danger"
        />
      )}
    </DashboardLayout>
  );
}
