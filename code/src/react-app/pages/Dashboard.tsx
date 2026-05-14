import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { ConfirmModal } from "@/react-app/components/ConfirmModal";
import DashboardIntelWorkspace from "@/react-app/components/dashboard/DashboardIntelWorkspace";
import DashboardProjectsRail from "@/react-app/components/dashboard/DashboardProjectsRail";
import type { DashboardProject, DashboardStats } from "@/react-app/components/dashboard/dashboardTypes";

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<DashboardProject | null>(null);

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

  const handleArchiveProject = async (e: React.MouseEvent, project: DashboardProject) => {
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

  const handleDeleteClick = (e: React.MouseEvent, project: DashboardProject) => {
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

  const nicheCount = projects.length > 0 ? new Set(projects.map((p) => p.niche)).size : 0;

  const getProjectColor = (index: number) => {
    const colors = ["#6366f1", "#0ea5e9", "#22c55e", "#f97316", "#e11d48", "#a855f7"];
    return colors[index % colors.length];
  };

  const getProjectInitial = (name: string) => name.charAt(0).toUpperCase();

  const userName = user?.google_user_data?.name?.split(" ")[0] || "Operator";

  return (
    <DashboardLayout>
      <div className="font-tm relative -mx-6 -mt-6 min-h-0 px-6 pb-16 pt-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[min(40vh,420px)] max-w-[1200px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1200px] space-y-10">
          <DashboardIntelWorkspace
            userName={userName}
            stats={stats}
            loading={loading}
            nicheCount={nicheCount}
          />

          <DashboardProjectsRail
            projects={projects}
            filteredProjects={filteredProjects}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            goalFilter={goalFilter}
            setGoalFilter={setGoalFilter}
            hoveredProject={hoveredProject}
            setHoveredProject={setHoveredProject}
            getProjectColor={getProjectColor}
            getProjectInitial={getProjectInitial}
            onArchive={handleArchiveProject}
            onDeleteClick={handleDeleteClick}
          />
        </div>
      </div>

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
