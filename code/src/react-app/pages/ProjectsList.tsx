import { Link } from "react-router";
import { Card } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { ConfirmModal } from "@/react-app/components/ConfirmModal";
import { useEffect, useState } from "react";
import { Plus, Search, FolderOpen, ArrowRight, Calendar, Archive, Trash2 } from "lucide-react";

interface Project {
  id: number;
  name: string;
  niche: string;
  goal: string;
  audience: string;
  tool_count: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectsList() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    fetch("/api/projects", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects);
        setFilteredProjects(data.projects);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load projects:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.niche.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleArchiveProject = async (e: React.MouseEvent, project: Project) => {
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
        loadProjects();
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
        loadProjects();
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

  return (
    <DashboardLayout>
      <div className="page-shell max-w-7xl space-y-8">
        {/* Header */}
        <div className="surface-panel flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="section-eyebrow">Workspace</div>
            <h1 className="text-4xl font-bold">My Projects</h1>
            <p className="text-muted-foreground">
              Manage all your traffic tool projects
            </p>
          </div>
          <Link to="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects by name or niche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try a different search term"
                : "Create your first project to get started building traffic tools"}
            </p>
            {!searchTerm && (
              <Link to="/projects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <Card className="p-6 space-y-4 transition-all h-full relative">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {hoveredProject === project.id && (
                          <>
                            <button
                              onClick={(e) => handleArchiveProject(e, project)}
                              className="p-1.5 rounded-md hover:bg-amber-500/20 transition-all"
                              title="Archive project"
                            >
                              <Archive className="w-4 h-4 text-amber-500" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, project)}
                              className="p-1.5 rounded-md hover:bg-red-500/20 transition-all"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="inline-block rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                      {project.niche}
                    </div>
                  </div>

                  {project.goal && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.goal}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(project.updated_at)}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {project.tool_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">tools</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && filteredProjects.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredProjects.length} of {projects.length}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </p>
        )}

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
