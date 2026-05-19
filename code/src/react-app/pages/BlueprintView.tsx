import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Loader2 } from "lucide-react";
import {
  BlueprintDossierContent,
  type BlueprintDossierProject,
  type BlueprintDossierTool,
} from "@/react-app/pages/BlueprintDossier";

export default function BlueprintView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<BlueprintDossierTool | null>(null);
  const [project, setProject] = useState<BlueprintDossierProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTool();
  }, [id]);

  const loadTool = async () => {
    try {
      const response = await fetch(`/api/tools/${id}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setTool(data.tool);
        const projectRes = await fetch(`/api/projects/${data.tool.project_id}`, { credentials: "include" });
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData.project);
        }
      } else {
        navigate("/magnets");
      }
    } catch (error) {
      console.error("Failed to load tool:", error);
      navigate("/magnets");
    } finally {
      setLoading(false);
    }
  };

  const dossierShell = {
    shellClassName:
      "bg-[#d6d3d1] bg-[linear-gradient(165deg,rgb(214,211,209)_0%,rgb(245,242,239)_42%,rgb(200,195,190)_100%)]",
    mainClassName: "bg-transparent",
    innerClassName: "min-h-full p-0 lg:p-0",
  } as const;

  if (loading) {
    return (
      <DashboardLayout {...dossierShell}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[#d6d3d1] px-6 py-16">
          <div className="h-px w-32 animate-pulse bg-stone-900/40" aria-hidden />
          <Loader2 className="h-8 w-8 animate-spin text-stone-800" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-600">Retrieving instrument…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!tool) {
    return null;
  }

  return (
    <DashboardLayout {...dossierShell}>
      <BlueprintDossierContent
        tool={tool}
        project={project}
        onToolUpdate={setTool}
        onNavigate={navigate}
      />
    </DashboardLayout>
  );
}
