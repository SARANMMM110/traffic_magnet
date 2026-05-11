import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { ConfirmModal } from "@/react-app/components/ConfirmModal";
import {
  Layers,
  BarChart,
  Compass,
  Sparkles,
  Plus,
  Search,
  ChevronRight,
  Rocket,
  Archive,
  Trash2,
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

interface Recommendation {
  name: string;
  description: string;
  score: number;
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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
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

  const handleGetRecommendations = async () => {
    setLoadingRecs(true);
    // Simulate AI recommendations
    setTimeout(() => {
      setRecommendations([
        {
          name: "ROI Calculator",
          description: "Help visitors calculate return on investment",
          score: 92,
        },
        {
          name: "Keyword Density Checker",
          description: "Analyze keyword usage in content",
          score: 88,
        },
        {
          name: "Meta Tag Generator",
          description: "Create optimized meta tags for SEO",
          score: 85,
        },
      ]);
      setLoadingRecs(false);
    }, 2000);
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

  const animateNumber = (target: number) => {
    return target; // In a real app, you'd use a counter animation library
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124, 92, 252, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Gradient Mesh Background */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #7C5CFC 0%, #3B82F6 50%, transparent 100%)",
            }}
          />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                Welcome back, {user?.google_user_data.name || "there"}! 👋
              </h1>
              <p className="text-lg" style={{ color: "var(--text-muted)" }}>
                Build high-traffic, link-magnet tools for any niche in minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 space-y-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124, 92, 252, 0.15)" }}
            >
              <Layers className="w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                {loading ? "..." : animateNumber(stats?.projectCount || 0)}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Projects
              </p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(16, 185, 129, 0.15)" }}
            >
              <BarChart className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
            </div>
            <div>
              <p className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                {loading ? "..." : animateNumber(stats?.toolCount || 0)}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Assets Generated
              </p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59, 130, 246, 0.15)" }}
            >
              <Compass className="w-5 h-5" style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <p className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                {loading ? "..." : animateNumber(projects.length > 0 ? new Set(projects.map(p => p.niche)).size : 0)}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Niches Explored
              </p>
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(245, 158, 11, 0.2)" }}
              >
                <Sparkles className="w-5 h-5" style={{ color: "var(--accent-amber)" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>AI Recommended Tools</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Based on your project niches & goals
                </p>
              </div>
            </div>
            {recommendations.length === 0 && (
              <button
                onClick={handleGetRecommendations}
                disabled={loadingRecs || projects.length === 0}
                className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--accent-amber), #D97706)",
                }}
              >
                {loadingRecs ? "⚡ Thinking..." : "⚡ Get Suggestions"}
              </button>
            )}
          </div>

          {recommendations.length === 0 && !loadingRecs && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {projects.length === 0
                ? "Create your first project to get AI-powered tool suggestions tailored to your niche."
                : "Click 'Get Suggestions' to get AI-powered tool ideas tailored to your existing projects."}
            </p>
          )}

          {loadingRecs && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-card p-4 animate-pulse"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="h-4 bg-gray-600 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="glass-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold" style={{ color: "var(--text-primary)" }}>{rec.name}</h4>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: "rgba(124, 92, 252, 0.15)",
                        color: "var(--brand)",
                      }}
                    >
                      {rec.score}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {rec.description}
                  </p>
                  <button
                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
                    style={{ background: "var(--brand)", color: "white" }}
                  >
                    Build →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xs font-bold tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}
            >
              YOUR PROJECTS
            </h2>
            <Link to="/projects/new">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "var(--brand)" }}
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or niche..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
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

          {/* Project List */}
          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: "var(--text-secondary)" }}>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(124, 92, 252, 0.15)" }}
              >
                <Rocket className="w-10 h-10" style={{ color: "var(--brand)" }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {projects.length === 0
                  ? "Your first project is one click away"
                  : "No projects match your search"}
              </h3>
              <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                {projects.length === 0
                  ? "Create a project to start building traffic-magnet tools"
                  : "Try adjusting your filters"}
              </p>
              {projects.length === 0 && (
                <Link to="/projects/new">
                  <button
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                    style={{
                      background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                      boxShadow: "0 0 20px var(--brand-glow)",
                    }}
                  >
                    + Create Your First Project
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="w-full glass-card p-5 flex items-center gap-4 hover:scale-[1.01] transition-all group relative"
                  style={{
                    borderColor: hoveredProject === project.id ? "var(--brand)" : "var(--border)",
                    boxShadow: hoveredProject === project.id ? "0 0 20px var(--brand-glow)" : "none",
                  }}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                      style={{ background: getProjectColor(index) }}
                    >
                      {getProjectInitial(project.name)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{project.name}</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {project.niche}
                        </p>
                        {project.goal && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: `${GOAL_COLORS[project.goal]}20`,
                              color: GOAL_COLORS[project.goal],
                            }}
                          >
                            {GOAL_LABELS[project.goal]}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {project.tool_count} {project.tool_count === 1 ? "asset" : "assets"}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hoveredProject === project.id && (
                      <>
                        <button
                          onClick={(e) => handleArchiveProject(e, project)}
                          className="p-2 rounded-lg transition-all hover:brightness-110"
                          style={{
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "var(--accent-amber)",
                          }}
                          title="Archive project"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, project)}
                          className="p-2 rounded-lg transition-all hover:brightness-110"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#EF4444",
                          }}
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    <ChevronRight
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && projectToDelete && (
          <ConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setProjectToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Project"
            description={`Are you sure you want to delete "${projectToDelete.name}"? This will permanently delete all ${projectToDelete.tool_count} tools in this project. This action cannot be undone.`}
            confirmLabel="Delete Project"
            confirmVariant="danger"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
