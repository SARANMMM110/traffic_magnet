import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/react-app/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  Check,
  Download,
  Code2,
  RefreshCw,
  Sparkles,
  Palette,
  LayoutTemplate,
} from "lucide-react";
import { useToast } from "@/react-app/components/Toast";
import { VISUAL_THEMES, normalizeVisualThemeId } from "@/react-app/lib/visualThemes";
import BlueprintDossierModal from "@/react-app/pages/BlueprintDossierModal";

export interface BlueprintDossierTool {
  id: number;
  project_id: number;
  name: string;
  description: string;
  category: string;
  keywords: string;
  traffic_score: number;
  backlink_score: number;
  monetization_score: number;
  overall_score: number;
  reasoning: string;
  blueprint: string | null;
  html_content: string | null;
  landing_page_html: string | null;
  created_at: string;
}

export interface BlueprintDossierProject {
  id: number;
  name: string;
  niche: string;
}

type BuildStep = "analyzing" | "logic" | "styling" | "embed" | "done";

/** Editorial manuscript block â€” not a dashboard â€œspec cardâ€. */
function DossierSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-stone-900/15 pt-10 first:border-t-0 first:pt-0">
      <h2 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-stone-900">{title}</h2>
      <div className="border-l-[3px] border-amber-900/55 pl-6 text-[15px] leading-[1.75] text-stone-800">{children}</div>
    </section>
  );
}

export function formatBlueprintHeading(raw: string): string {
  const trimmed = raw.trim();
  if (/^EEAT\b/i.test(trimmed)) {
    const rest = trimmed.replace(/^EEAT\s+/i, "");
    return rest ? `EEAT Â· ${formatBlueprintHeading(rest)}` : "EEAT";
  }
  return trimmed
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseToolBlueprint(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const text = raw;
    const lines = text.split("\n");
    const blueprint: Record<string, unknown> = {};
    let currentField = "";
    let currentValue = "";
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex !== -1) {
        if (currentField) {
          const key = currentField.toLowerCase().replace(/\s+/g, "_");
          blueprint[key] = currentValue.trim();
        }
        currentField = line.substring(0, colonIndex).trim();
        currentValue = line.substring(colonIndex + 1).trim();
      } else if (line.trim()) {
        currentValue += ` ${line.trim()}`;
      }
    }
    if (currentField) {
      const key = currentField.toLowerCase().replace(/\s+/g, "_");
      blueprint[key] = currentValue.trim();
    }
    if (blueprint.target_keywords && typeof blueprint.target_keywords === "string") {
      blueprint.target_keywords = blueprint.target_keywords.split(",").map((k: string) => k.trim());
    }
    if (blueprint.inputs_required && typeof blueprint.inputs_required === "string") {
      blueprint.inputs_required = blueprint.inputs_required.split(",").map((k: string) => k.trim());
    }
    if (blueprint.internal_linking_suggestions && typeof blueprint.internal_linking_suggestions === "string") {
      blueprint.internal_links = blueprint.internal_linking_suggestions.split(",").map((k: string) => k.trim());
    }
    return blueprint;
  }
}

interface BlueprintDossierContentProps {
  tool: BlueprintDossierTool;
  project: BlueprintDossierProject | null;
  onToolUpdate: (tool: BlueprintDossierTool) => void;
  onNavigate: (path: string) => void;
  embedded?: boolean;
  onClose?: () => void;
  presentation?: "dossier" | "modal";
}

export function BlueprintDossierContent({
  tool: toolProp,
  project,
  onToolUpdate,
  onNavigate,
  embedded = false,
  onClose,
  presentation = "dossier",
}: BlueprintDossierContentProps) {
  const { showToast } = useToast();
  const [tool, setToolState] = useState(toolProp);
  const [panelTab, setPanelTab] = useState<"blueprint" | "variations" | "landing">("blueprint");
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [buildStep, setBuildStep] = useState<BuildStep | null>(null);
  const [buildResult, setBuildResult] = useState<{ action: "standalone" | "embed"; html: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingLanding, setGeneratingLanding] = useState(false);
  const [landingPageHtml, setLandingPageHtml] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);

  const setTool = (next: BlueprintDossierTool | ((prev: BlueprintDossierTool) => BlueprintDossierTool)) => {
    setToolState((prev) => {
      const updated = typeof next === "function" ? next(prev) : next;
      onToolUpdate(updated);
      return updated;
    });
  };

  useEffect(() => {
    setToolState(toolProp);
    setLandingPageHtml(toolProp.landing_page_html);
  }, [toolProp.id, toolProp.blueprint, toolProp.landing_page_html, toolProp.html_content]);

  useEffect(() => {
    if (!tool?.blueprint) return;
    try {
      const bp = JSON.parse(tool.blueprint);
      setSelectedTheme(normalizeVisualThemeId(bp.visual_theme ?? bp.theme));
    } catch {
      /* ignore */
    }
  }, [tool?.blueprint]);

  const generateBlueprint = async () => {
    if (!tool) return;
    
    setBuildStep("analyzing");
    try {
      const response = await fetch(`/api/tools/${tool.id}/blueprint`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTool({ ...tool, blueprint: data.blueprint });
        setBuildStep("done");
        showToast({ title: "Blueprint generated successfully!", type: "success" });
        setTimeout(() => setBuildStep(null), 2000);
      } else {
        throw new Error("Failed to generate blueprint");
      }
    } catch (error) {
      console.error("Blueprint generation failed:", error);
      showToast({ title: "Failed to generate blueprint. Please try again.", type: "error" });
      setBuildStep(null);
    }
  };

  const buildTool = async (action: "standalone" | "embed") => {
    if (!tool) {
      return;
    }
    
    setBuildStep("logic");
    try {
      const response = await fetch(`/api/tools/${tool.id}/html`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          use_platform_engine: import.meta.env.VITE_USE_PLATFORM_RENDER === "true",
        }),
      });

      if (response.ok) {
        setBuildStep("styling");
        await new Promise((resolve) => setTimeout(resolve, 800));
        setBuildStep("embed");
        await new Promise((resolve) => setTimeout(resolve, 800));

        const data = await response.json();
        setTool({ ...tool, html_content: data.html });
        setBuildStep("done");
        setBuildResult({ action, html: data.html });
        showToast({ title: "Tool built successfully!", type: "success" });
        setTimeout(() => setBuildStep(null), 2000);
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || "Failed to build tool");
      }
    } catch (error) {
      console.error("Tool building failed:", error);
      showToast({
        title: "Failed to build tool",
        message: error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
      setBuildStep(null);
    }
  };

  const regenerateBlueprint = async () => {
    if (!tool) return;
    
    setBuildStep("analyzing");
    try {
      const response = await fetch(`/api/tools/${tool.id}/blueprint/regenerate`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTool({ ...tool, blueprint: data.blueprint });
        setBuildStep("done");
        showToast({ title: "Blueprint regenerated!", type: "success" });
        setTimeout(() => setBuildStep(null), 2000);
      } else {
        throw new Error("Failed to regenerate blueprint");
      }
    } catch (error) {
      console.error("Blueprint regeneration failed:", error);
      showToast({ title: "Failed to regenerate blueprint. Please try again.", type: "error" });
      setBuildStep(null);
    }
  };

  const copyBlueprint = () => {
    if (tool?.blueprint) {
      navigator.clipboard.writeText(tool.blueprint);
      showToast({ title: "Blueprint copied to clipboard!", type: "success" });
    }
  };

  const readApiError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      if (Array.isArray(data.details)) {
        return data.details.join(", ");
      }
      return data.message || data.error || fallback;
    } catch {
      return fallback;
    }
  };

  const generateLandingPageHandler = async () => {
    if (!tool) return;
    
    setGeneratingLanding(true);
    setLandingPageHtml(null);
    
    try {
      const response = await fetch(`/api/tools/${tool.id}/landing-page`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_platform_engine: import.meta.env.VITE_USE_PLATFORM_RENDER === "true",
        }),
      });
      
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to generate landing page"));
      }
      
      const data = await response.json();
      setLandingPageHtml(data.html);
      setTool({ ...tool, landing_page_html: data.html });
      
      showToast({
        type: "success",
        title: "Landing page generated!",
        message: "Your complete landing page is ready"
      });
    } catch (error) {
      console.error("Landing page generation error:", error);
      showToast({
        type: "error",
        title: "Failed to generate landing page",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setGeneratingLanding(false);
    }
  };

  const downloadLandingPage = () => {
    if (!landingPageHtml || !tool) return;
    
    const blob = new Blob([landingPageHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}-landing-page.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: "success",
      title: "Downloaded!",
      message: "Landing page HTML file saved"
    });
  };

  const copyLandingPageHTML = () => {
    if (!landingPageHtml) return;
    
    navigator.clipboard.writeText(landingPageHtml);
    showToast({
      type: "success",
      title: "Copied!",
      message: "Landing page HTML copied to clipboard"
    });
  };

  const goBackFromLanding = () => {
    if (embedded && onClose) {
      onClose();
      return;
    }
    if (tool?.project_id != null) {
      onNavigate(`/projects/${tool.project_id}`);
    } else {
      onNavigate("/magnets");
    }
  };

  const regenerateLandingPage = async () => {
    setLandingPageHtml(null);
    await generateLandingPageHandler();
  };

  const persistVisualTheme = async (themeId: string) => {
    if (!tool?.blueprint) return;
    setSavingTheme(true);
    try {
      let bp: Record<string, unknown>;
      try {
        bp = JSON.parse(tool.blueprint);
      } catch {
        showToast({ title: "Could not read blueprint to save theme", type: "error" });
        return;
      }
      bp.visual_theme = themeId;
      const next = JSON.stringify(bp);
      const res = await fetch(`/api/tools/${tool.id}/blueprint/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint: next }),
      });
      if (!res.ok) {
        showToast({ title: "Failed to save theme", type: "error" });
        return;
      }
      setTool((prev) => ({ ...prev, blueprint: next }));
    } finally {
      setSavingTheme(false);
    }
  };

  const blueprint = parseToolBlueprint(tool.blueprint);


  const purpose = (blueprint.purpose as string) || tool.description || "";
  const strategySections = [
    { title: "MARKET OPPORTUNITY", value: blueprint.market_opportunity },
    { title: "SEO OPPORTUNITY", value: blueprint.seo_opportunity },
    { title: "TRAFFIC ACQUISITION STRATEGY", value: blueprint.traffic_acquisition_strategy },
    { title: "CONVERSION PSYCHOLOGY", value: blueprint.conversion_psychology },
    { title: "AUTHORITY POSITIONING", value: blueprint.authority_positioning },
    { title: "COMPETITOR ADVANTAGE", value: blueprint.competitor_advantage },
  ].filter((section) => section.value);
  const audiencePainPoints = Array.isArray(blueprint.audience_pain_points) ? blueprint.audience_pain_points : [];
  const monetizationRoadmap = Array.isArray(blueprint.monetization_roadmap) ? blueprint.monetization_roadmap : [];
  const eeatStructure = Array.isArray(blueprint.eeat_structure) ? blueprint.eeat_structure : [];
  const keywords = Array.isArray(blueprint.target_keywords) ? blueprint.target_keywords : [];
  const inputFields = Array.isArray(blueprint.inputs_required) ? blueprint.inputs_required : [];
  const output = (blueprint.output_type as string) || "";
  const calculationLogic = (blueprint.calculation_logic as string) || "";
  const monetization = (blueprint.monetization_strategy as string) || "";
  const linking = Array.isArray(blueprint.internal_links)
    ? (blueprint.internal_links as string[]).join("\n")
    : ((blueprint.internal_linking_suggestions as string) || "");
  const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
  const features = Array.isArray(blueprint.features) ? blueprint.features : [];
  const inputs = Array.isArray(inputFields) 
    ? inputFields.map((f: any) => typeof f === 'string' ? f : (f.label || "")).join(", ")
    : "";

  const handleReturn = () => {
    if (embedded && onClose) {
      onClose();
      return;
    }
    onNavigate(tool.project_id != null ? `/projects/${tool.project_id}` : "/magnets");
  };

  if (presentation === "modal") {
    return (
      <BlueprintDossierModal
        tool={tool}
        project={project}
        blueprint={blueprint}
        tab={panelTab}
        onTabChange={setPanelTab}
        purpose={purpose}
        strategySections={strategySections}
        audiencePainPoints={audiencePainPoints as string[]}
        monetizationRoadmap={monetizationRoadmap as string[]}
        eeatStructure={eeatStructure as string[]}
        keywords={keywords as string[]}
        inputs={inputs}
        output={output}
        calculationLogic={calculationLogic}
        monetization={monetization}
        linking={linking}
        cta={cta}
        features={features as string[]}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        savingTheme={savingTheme}
        persistVisualTheme={persistVisualTheme}
        buildStep={buildStep}
        buildResult={buildResult}
        setBuildResult={setBuildResult}
        buildTool={buildTool}
        copied={copied}
        copyBlueprint={copyBlueprint}
        regenerateBlueprint={regenerateBlueprint}
        generateBlueprint={generateBlueprint}
        generatingLanding={generatingLanding}
        landingPageHtml={landingPageHtml}
        generateLandingPageHandler={generateLandingPageHandler}
        downloadLandingPage={downloadLandingPage}
        copyLandingPageHTML={copyLandingPageHTML}
        regenerateLandingPage={regenerateLandingPage}
        onClose={onClose}
        onNavigate={onNavigate}
        onToolUpdate={onToolUpdate}
        showToast={showToast}
      />
    );
  }

  return (
      <div
        className={cn(
          "relative border-t border-stone-900/10 bg-[#d6d3d1] bg-[linear-gradient(165deg,rgb(214,211,209)_0%,rgb(245,242,239)_42%,rgb(200,195,190)_100%)]",
          embedded ? "min-h-0" : "min-h-[calc(100vh-6rem)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />
        <div className={cn("relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-10", embedded ? "pb-8 pt-4" : "pb-24 pt-8 lg:pt-12")}>
          <Tabs
            value={panelTab}
            onValueChange={(v: string) => setPanelTab(v as "blueprint" | "variations" | "landing")}
            className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14"
          >
            <div className="flex shrink-0 flex-col gap-6 lg:sticky lg:top-6 lg:w-48">
              <button
                type="button"
                onClick={handleReturn}
                className="group inline-flex w-fit items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-stone-600 transition-colors hover:text-stone-950"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                Return
              </button>
              <TabsList
                variant="line"
                className="flex h-auto w-full flex-col items-stretch gap-2 rounded-none border-0 bg-transparent p-0"
              >
                <TabsTrigger
                  value="blueprint"
                  className="flex h-auto w-full flex-none justify-start rounded-none border-2 border-transparent px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 shadow-none ring-0 after:hidden data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-[#f2ede4] data-[state=inactive]:hover:border-stone-500 data-[state=inactive]:hover:bg-stone-300/50"
                >
                  Manuscript
                </TabsTrigger>
                <TabsTrigger
                  value="variations"
                  className="flex h-auto w-full flex-none justify-start rounded-none border-2 border-transparent px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 shadow-none ring-0 after:hidden data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-[#f2ede4] data-[state=inactive]:hover:border-stone-500 data-[state=inactive]:hover:bg-stone-300/50"
                >
                  Forks
                </TabsTrigger>
                <TabsTrigger
                  value="landing"
                  className="flex h-auto w-full flex-none justify-start rounded-none border-2 border-transparent px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 shadow-none ring-0 after:hidden data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-[#f2ede4] data-[state=inactive]:hover:border-stone-500 data-[state=inactive]:hover:bg-stone-300/50"
                >
                  Ledger
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-w-0 flex-1 space-y-8">
              <header className="space-y-4 border-b-2 border-stone-900 pb-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.38em] text-stone-500">Magnet instrument</p>
                <h1 className="text-balance font-['Georgia','Times_New_Roman',Times,serif] text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.06] tracking-tight text-stone-950">
                  {tool.name}
                </h1>
                <p className="max-w-2xl text-[15px] leading-relaxed text-stone-700">{tool.description}</p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-stone-600">
                  <span>{tool.category}</span>
                  {project && (
                    <>
                      <span className="text-stone-400">Â·</span>
                      <span>{project.name}</span>
                    </>
                  )}
                  <span className="mx-1 hidden text-stone-400 sm:inline">â”‚</span>
                  <span>
                    signal <span className="font-bold text-stone-900">{tool.overall_score}</span>
                  </span>
                  <span className="text-stone-400">Â·</span>
                  <span>reach {tool.traffic_score}</span>
                  <span className="text-stone-400">Â·</span>
                  <span>links {tool.backlink_score}</span>
                  <span className="text-stone-400">Â·</span>
                  <span>yield {tool.monetization_score}</span>
                </p>
              </header>

              <div className="border-2 border-stone-900 bg-[#f2ede4] shadow-[10px_10px_0_0_rgb(28,25,23)]">
                <TabsContent value="blueprint" className="m-0 flex flex-col p-6 text-sm outline-none sm:p-10">
                  {tool.blueprint ? (
            <div className="flex flex-col gap-0">
              <div className="-mx-6 border-y-2 border-[#f2ede4] bg-stone-900 px-6 py-8 text-[#ede8df] sm:-mx-10 sm:px-10">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200/90">
                      <Palette className="h-3.5 w-3.5" aria-hidden />
                      Fabrication
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
                      Active skin{" "}
                      <strong className="text-[#f4f0e8]">
                        {VISUAL_THEMES.find((t) =>
                          t.id === normalizeVisualThemeId(blueprint.visual_theme ?? blueprint.theme),
                        )?.name ??
                          "Modern"}
                      </strong>
                      . Exports inherit this palette for standalone HTML and embed snippets.
                    </p>
                  </div>
                  {savingTheme && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-200" aria-hidden />}
                </div>
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Swatches</p>
                <div className="mb-10 flex flex-wrap gap-2">
                  {VISUAL_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setSelectedTheme(theme.id);
                        void persistVisualTheme(theme.id);
                      }}
                      className={cn(
                        "group flex min-w-[5.5rem] flex-col border-2 px-2 pb-2 pt-1.5 text-left transition-colors",
                        selectedTheme === theme.id
                          ? "border-amber-300 bg-stone-800"
                          : "border-stone-700 bg-stone-950 hover:border-stone-500"
                      )}
                    >
                      <div
                        className="mb-1.5 h-8 w-full border border-stone-600"
                        style={{ background: theme.swatch }}
                        aria-hidden
                      />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-200">
                        {theme.name}
                      </span>
                      <span className="mt-0.5 line-clamp-2 font-mono text-[8px] leading-tight text-stone-600">{theme.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Dispatch</p>
                {!buildResult ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        buildTool("standalone");
                      }}
                      disabled={buildStep !== null}
                      className="border-2 border-[#f4f0e8]/25 bg-transparent px-4 py-5 text-left transition-colors hover:border-[#f4f0e8]/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="flex items-center gap-3">
                        <Download className="h-5 w-5 shrink-0 text-amber-200" aria-hidden />
                        <span>
                          <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4f0e8]">
                            Standalone
                          </span>
                          <span className="mt-1 block text-xs text-stone-500">Single .html â€” static host or FTP.</span>
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        buildTool("embed");
                      }}
                      disabled={buildStep !== null}
                      className="border-2 border-[#f4f0e8]/25 bg-transparent px-4 py-5 text-left transition-colors hover:border-[#f4f0e8]/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="flex items-center gap-3">
                        <Code2 className="h-5 w-5 shrink-0 text-amber-200" aria-hidden />
                        <span>
                          <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4f0e8]">
                            Embed
                          </span>
                          <span className="mt-1 block text-xs text-stone-500">Snippet for posts, builders, CMS HTML blocks.</span>
                        </span>
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="border border-dashed border-amber-200/40 bg-stone-950/80 px-4 py-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-amber-100">
                      {buildResult.action === "standalone" ? "Standalone artifact sealed" : "Embed fragment sealed"}
                    </p>
                    {buildResult.action === "standalone" ? (
                      <button
                        type="button"
                        className="w-full border-2 border-[#f4f0e8] bg-[#f4f0e8] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900 hover:bg-white"
                        onClick={() => {
                          const blob = new Blob([buildResult.html], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                          showToast({ title: "Downloaded!", type: "success" });
                        }}
                      >
                        Download .html
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="w-full border-2 border-[#f4f0e8] bg-[#f4f0e8] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900 hover:bg-white"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(buildResult.html)
                            .then(() => {
                              setCopied(true);
                              showToast({ title: "Copied to clipboard!", type: "success" });
                              setTimeout(() => setCopied(false), 2000);
                            })
                            .catch(() => {
                              showToast({ title: "Failed to copy", type: "error" });
                            });
                        }}
                      >
                        {copied ? "Copied" : "Copy embed"}
                      </button>
                    )}
                    <p className="text-center font-mono text-[10px] text-stone-500">
                      {buildResult.action === "standalone" ? "Host as a single file." : "Paste as raw HTML where allowed."}
                    </p>
                    <button
                      type="button"
                      className="w-full border-2 border-dashed border-stone-600 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:border-stone-400 hover:text-stone-200"
                      onClick={() => {
                        const bundle = `# ${tool.name}\n\n\`\`\`html\n${buildResult.html}\n\`\`\`\n\n\`\`\`json\n${tool.blueprint}\n\`\`\``;
                        navigator.clipboard
                          .writeText(bundle)
                          .then(() => {
                            showToast({ title: "Content wrapper copied!", type: "success" });
                          })
                          .catch(() => {
                            showToast({ title: "Failed to copy", type: "error" });
                          });
                      }}
                    >
                      Copy bundle (wrapper)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuildResult(null)}
                      className="w-full text-center font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 underline-offset-4 hover:text-amber-200 hover:underline"
                    >
                      Re-open dispatch
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-10 space-y-10">
                <DossierSection title="Purpose">
                  <p className="whitespace-pre-line text-stone-700">{purpose}</p>
                </DossierSection>

                {strategySections.map((section) => (
                  <DossierSection key={section.title} title={formatBlueprintHeading(section.title)}>
                    <p className="whitespace-pre-line text-stone-700">{section.value}</p>
                  </DossierSection>
                ))}

                {audiencePainPoints.length > 0 && (
                  <DossierSection title="Audience tension">
                    <ul className="space-y-3">
                      {audiencePainPoints.map((point: string, i: number) => (
                        <li key={i} className="flex gap-3 text-stone-700">
                          <span className="mt-2.5 h-1 w-6 shrink-0 bg-amber-900/70" aria-hidden />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </DossierSection>
                )}

                <DossierSection title="Lexicon (keywords)">
                  {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword: string, i: number) => (
                        <span
                          key={i}
                          className="border border-stone-900/80 bg-[#ebe4d8] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-stone-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-mono text-sm italic text-stone-500">Unspecified</p>
                  )}
                </DossierSection>

                <DossierSection title="Inputs required">
                  <p className="whitespace-pre-line text-stone-700">{inputs || "Unspecified"}</p>
                </DossierSection>

                <DossierSection title="Output type">
                  <p className="whitespace-pre-line text-stone-700">{output || "Unspecified"}</p>
                </DossierSection>

                <DossierSection title="Business logic">
                  <p className="whitespace-pre-line text-stone-700">{calculationLogic || "Unspecified"}</p>
                </DossierSection>

                {features.length > 0 && (
                  <DossierSection title="Features">
                    <ul className="space-y-3">
                      {features.map((feature: string, i: number) => (
                        <li key={i} className="flex gap-3 text-stone-700">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-900" aria-hidden />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </DossierSection>
                )}

                <DossierSection title="Monetization strategy">
                  <p className="whitespace-pre-line text-stone-700">{monetization || "Unspecified"}</p>
                </DossierSection>

                {monetizationRoadmap.length > 0 && (
                  <DossierSection title="Monetization roadmap">
                    <ol className="list-decimal space-y-2 pl-5 text-stone-700 marker:font-mono marker:text-xs marker:font-bold">
                      {monetizationRoadmap.map((item: string, i: number) => (
                        <li key={i} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </DossierSection>
                )}

                {eeatStructure.length > 0 && (
                  <DossierSection title="EEAT structure">
                    <ul className="space-y-3">
                      {eeatStructure.map((item: string, i: number) => (
                        <li key={i} className="flex gap-3 text-stone-700">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-900/80" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </DossierSection>
                )}

                <DossierSection title="Internal linking">
                  <p className="whitespace-pre-line text-stone-700">{linking || "Unspecified"}</p>
                </DossierSection>

                <div className="border-t-2 border-stone-900/15 pt-10">
                  <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-stone-500">Closing argument</p>
                  <blockquote className="border-l-4 border-amber-900 pl-6 font-['Georgia','Times_New_Roman',Times,serif] text-xl italic leading-snug text-stone-900">
                    {cta || "Unspecified"}
                  </blockquote>
                </div>

                <div className="flex flex-col gap-3 border-t border-dashed border-stone-900/25 pt-8 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyBlueprint}
                    className="flex-1 border-2 border-stone-900 bg-transparent py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-[#f2ede4]"
                  >
                    Copy manuscript
                  </button>
                  <button
                    type="button"
                    onClick={regenerateBlueprint}
                    disabled={buildStep !== null}
                    className="flex-1 border-2 border-stone-900 bg-stone-900 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#f2ede4] transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {buildStep === "analyzing" ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Revisingâ€¦
                      </span>
                    ) : (
                      "Regenerate"
                    )}
                  </button>
                </div>

                {buildStep && (
                  <div
                    className={cn(
                      "border-2 border-dashed px-4 py-4 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
                      buildStep === "done"
                        ? "border-emerald-800 bg-emerald-950/10 text-emerald-900"
                        : "border-stone-900 bg-stone-900 text-amber-100"
                    )}
                  >
                    {buildStep === "analyzing" && (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Drafting manuscriptâ€¦
                      </span>
                    )}
                    {buildStep === "logic" && (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Compiling logicâ€¦
                      </span>
                    )}
                    {buildStep === "styling" && (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Inking {VISUAL_THEMES.find((t) => t.id === selectedTheme)?.name ?? "theme"}â€¦
                      </span>
                    )}
                    {buildStep === "embed" && (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Binding embedâ€¦
                      </span>
                    )}
                    {buildStep === "done" && (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Check className="h-4 w-4 shrink-0" aria-hidden />
                        Pass complete
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 border-2 border-dashed border-stone-900/25 px-6 py-16 text-center">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-stone-500">Empty folio</p>
              <p className="font-['Georgia','Times_New_Roman',Times,serif] text-2xl text-stone-900">No manuscript on file</p>
              <p className="max-w-md text-sm leading-relaxed text-stone-600">
                Run a first pass to lock narrative, economics, and distribution anglesâ€”then export HTML or embed from the fabrication strip.
              </p>
              <button
                type="button"
                onClick={generateBlueprint}
                disabled={buildStep !== null}
                className="border-2 border-stone-900 bg-stone-900 px-10 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2ede4] transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {buildStep === "analyzing" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Composingâ€¦
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Compose manuscript
                  </span>
                )}
              </button>
            </div>
          )}
          </TabsContent>

          <TabsContent value="variations" className="m-0 flex flex-col gap-8 p-6 sm:p-10">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-stone-500">Forks</p>
              <h2 className="mt-2 font-['Georgia','Times_New_Roman',Times,serif] text-2xl text-stone-900 sm:text-3xl">
                Alternate angles live in the workspace
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
                Branch audiences, revenue models, acquisition plays, and blueprint upgrades in the project roomâ€”then fold the winning line back into this folio.
              </p>
            </div>
            <dl className="space-y-8 border-t border-stone-900/15 pt-8">
              {[
                ["Audience registers", "Creators, agencies, SMBs, enterpriseâ€”mapped as separate intent lanes."],
                ["Revenue chemistry", "Lead gen, affiliate, SaaS, servicesâ€”pressure-test before you ship."],
                ["Traffic geology", "Organic, authority content, partnershipsâ€”see which vein actually converts."],
                ["Blueprint succession", "Promote a stronger fork to overwrite the active manuscript."],
              ].map(([title, body]) => (
                <div key={title}>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-stone-900">{title}</dt>
                  <dd className="mt-2 border-l-2 border-amber-900/60 pl-4 text-sm leading-relaxed text-stone-700">{body}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              className="w-full border-2 border-stone-900 bg-stone-900 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2ede4] transition-colors hover:bg-stone-800"
              onClick={() => {
                const path = tool.project_id != null ? `/projects/${tool.project_id}` : "/magnets";
                if (embedded && onClose) onClose();
                onNavigate(path);
              }}
            >
              Enter workspace
            </button>
          </TabsContent>

          <TabsContent value="landing" className="m-0 flex flex-col gap-8 p-6 sm:p-10">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-stone-500">Ledger</p>
              <h2 className="mt-2 font-['Georgia','Times_New_Roman',Times,serif] text-2xl text-stone-900 sm:text-3xl">
                Landing as a bound document
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
                One long-form page: hero, interactive asset, proof, roadmap, FAQ, and conversion spineâ€”set in the same voice as this manuscript.
              </p>
            </div>

            {!landingPageHtml && !generatingLanding && (
              <button
                type="button"
                onClick={generateLandingPageHandler}
                className="w-full border-2 border-dashed border-stone-900/40 bg-stone-900/5 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:border-stone-900 hover:bg-stone-900/10"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <LayoutTemplate className="h-4 w-4" aria-hidden />
                  Generate ledger page
                </span>
              </button>
            )}

            {generatingLanding && (
              <div className="border-2 border-dashed border-stone-900/30 px-6 py-12 text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-stone-800" aria-hidden />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-stone-600">Typesettingâ€¦</p>
                <p className="mt-2 text-xs text-stone-600">Roughly half a minute while layout, copy, and modules align.</p>
              </div>
            )}

            {landingPageHtml && !generatingLanding && (
              <div className="space-y-4 border-t border-stone-900/15 pt-8">
                <p className="border border-stone-900/20 bg-[#ebe4d8] px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">
                  Ledger proof approved
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={downloadLandingPage}
                    className="border-2 border-stone-900 bg-stone-900 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#f2ede4] hover:bg-stone-800"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Download className="h-4 w-4" aria-hidden />
                      Download .html
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={copyLandingPageHTML}
                    className="border-2 border-stone-900 bg-transparent py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-900 hover:bg-stone-900/5"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Code2 className="h-4 w-4" aria-hidden />
                      Copy markup
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={goBackFromLanding}
                    className="border-2 border-dashed border-stone-900/35 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 hover:border-stone-900/60 sm:col-span-2"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Leave ledger
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={regenerateLandingPage}
                    className="border-2 border-stone-900 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-900 hover:bg-stone-900/5 sm:col-span-2"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Reset & regenerate
                    </span>
                  </button>
                </div>
              </div>
            )}
          </TabsContent>
                </div>
              </div>
          </Tabs>
        </div>
      </div>
    
  );
}
