import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, X } from "lucide-react";
import {
  BlueprintDossierContent,
  type BlueprintDossierProject,
  type BlueprintDossierTool,
} from "@/react-app/pages/BlueprintDossier";

export interface BlueprintPanelTool {
  id: number;
  project_id: number;
  name: string;
  description: string;
  category: string;
  blueprint: string | null;
  landing_page_html?: string | null;
}

interface BlueprintDetailPanelProps {
  tool: BlueprintPanelTool | null;
  open: boolean;
  onClose: () => void;
  onBlueprintUpdated?: (toolId: number, blueprintJson: string) => void;
}

export default function BlueprintDetailPanel({
  tool: panelTool,
  open,
  onClose,
  onBlueprintUpdated,
}: BlueprintDetailPanelProps) {
  const navigate = useNavigate();
  const [tool, setTool] = useState<BlueprintDossierTool | null>(null);
  const [project, setProject] = useState<BlueprintDossierProject | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !panelTool) {
      setTool(null);
      setProject(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tools/${panelTool.id}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        if (cancelled) return;
        setTool(data.tool);
        const projectRes = await fetch(`/api/projects/${data.tool.project_id}`, { credentials: "include" });
        if (projectRes.ok && !cancelled) {
          const projectData = await projectRes.json();
          setProject(projectData.project);
        }
      } catch (error) {
        console.error("Failed to load blueprint:", error);
        if (!cancelled) onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, panelTool?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !panelTool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close blueprint"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blueprint-modal-title"
        className="relative z-10 flex max-h-[min(90vh,860px)] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/80 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="blueprint-modal-title" className="sr-only">
          {panelTool.name} blueprint
        </h2>

        {loading || !tool ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="text-sm text-slate-500">Loading blueprint…</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <BlueprintDossierContent
              tool={tool}
              project={project}
              presentation="modal"
              embedded
              onClose={onClose}
              onNavigate={navigate}
              onToolUpdate={(updated) => {
                setTool(updated);
                if (updated.blueprint) {
                  onBlueprintUpdated?.(updated.id, updated.blueprint);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
