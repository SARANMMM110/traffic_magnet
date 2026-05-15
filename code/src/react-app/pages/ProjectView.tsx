import { useState, useEffect, type ReactNode } from "react";
import { useParams, useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { cn } from "@/react-app/lib/utils";
import { useToast } from "@/react-app/components/Toast";
import {
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle,
  Code2,
  Search,
  Download,
  FileText,
  DollarSign,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Link2,
  Plus,
  SearchCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";
import { VISUAL_THEMES, normalizeVisualThemeId } from "@/react-app/lib/visualThemes";

interface Project {
  id: number;
  name: string;
  niche: string;
  goal: string | null;
  audience: string | null;
  created_at: string;
}

interface Tool {
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

function parseToolBlueprintJson(raw: string): Record<string, unknown> {
  let blueprint: Record<string, unknown> = {};
  try {
    blueprint = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const lines = raw.split("\n");
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
    const tk = blueprint.target_keywords;
    if (typeof tk === "string") {
      blueprint.target_keywords = tk.split(",").map((k: string) => k.trim());
    }
    const ir = blueprint.inputs_required;
    if (typeof ir === "string") {
      blueprint.inputs_required = ir.split(",").map((k: string) => k.trim());
    }
    const ils = blueprint.internal_linking_suggestions;
    if (typeof ils === "string") {
      blueprint.internal_links = ils.split(",").map((k: string) => k.trim());
    }
  }
  return blueprint;
}

function ManuscriptHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-500/85">
      {children}
    </h4>
  );
}

function ManuscriptBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-l-2 border-cyan-600/35 pl-4">
      <ManuscriptHeading>{title}</ManuscriptHeading>
      <div className="text-sm leading-relaxed text-zinc-300">{children}</div>
    </section>
  );
}

function ManuscriptDot() {
  return <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-500/90" aria-hidden />;
}

function BlueprintManuscriptPanelBody({ selectedTool }: { selectedTool: Tool }) {
  const raw = selectedTool.blueprint;
  if (!raw) return null;
  const blueprint = parseToolBlueprintJson(raw);
  const purpose = (blueprint.purpose as string) || selectedTool.description || "";
  const strategySections = [
    { title: "Market opportunity", value: blueprint.market_opportunity as string | undefined },
    { title: "SEO opportunity", value: blueprint.seo_opportunity as string | undefined },
    { title: "Traffic acquisition strategy", value: blueprint.traffic_acquisition_strategy as string | undefined },
    { title: "Conversion psychology", value: blueprint.conversion_psychology as string | undefined },
    { title: "Authority positioning", value: blueprint.authority_positioning as string | undefined },
    { title: "Competitor advantage", value: blueprint.competitor_advantage as string | undefined },
  ].filter((s) => Boolean(s.value));
  const audiencePainPoints = Array.isArray(blueprint.audience_pain_points)
    ? (blueprint.audience_pain_points as string[])
    : [];
  const monetizationRoadmap = Array.isArray(blueprint.monetization_roadmap)
    ? (blueprint.monetization_roadmap as string[])
    : [];
  const eeatStructure = Array.isArray(blueprint.eeat_structure) ? (blueprint.eeat_structure as string[]) : [];
  const keywords = Array.isArray(blueprint.target_keywords) ? (blueprint.target_keywords as string[]) : [];
  const inputFields = Array.isArray(blueprint.inputs_required) ? blueprint.inputs_required : [];
  const output = (blueprint.output_type as string) || "";
  const calculationLogic = (blueprint.calculation_logic as string) || "";
  const monetization = (blueprint.monetization_strategy as string) || "";
  const internalLinks = Array.isArray(blueprint.internal_links) ? (blueprint.internal_links as string[]) : [];
  const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
  const features = Array.isArray(blueprint.features) ? (blueprint.features as string[]) : [];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-zinc-700/80 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">Manuscript summary</p>
        <Link
          to={`/blueprints/${selectedTool.id}`}
          className="inline-flex items-center gap-2 rounded border border-cyan-700/45 bg-cyan-950/35 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-500 hover:bg-cyan-950/55"
        >
          Open full dossier
        </Link>
      </div>

      <ManuscriptBlock title="Purpose">
        <p>{purpose}</p>
      </ManuscriptBlock>

      {strategySections.map((section) => (
        <ManuscriptBlock key={section.title} title={section.title}>
          <p>{section.value}</p>
        </ManuscriptBlock>
      ))}

      {audiencePainPoints.length > 0 && (
        <section className="border-l-2 border-cyan-600/35 pl-4">
          <ManuscriptHeading>Audience pain points</ManuscriptHeading>
          <ul className="space-y-2">
            {audiencePainPoints.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <ManuscriptDot />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-l-2 border-cyan-600/35 pl-4">
        <ManuscriptHeading>Target keywords</ManuscriptHeading>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword: string, i: number) => (
              <span
                key={i}
                className="border border-dashed border-zinc-600 bg-zinc-900/60 px-2 py-1 font-mono text-xs text-zinc-300"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-zinc-600">Not specified</p>
        )}
      </section>

      <section className="border-l-2 border-cyan-600/35 pl-4">
        <ManuscriptHeading>Inputs required</ManuscriptHeading>
        {inputFields.length > 0 ? (
          <ul className="space-y-1.5">
            {inputFields.map((field: unknown, i: number) => {
              const label = typeof field === "string" ? field : String((field as { label?: string }).label ?? field);
              return (
                <li key={i} className="font-mono text-xs text-zinc-400">
                  {label}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm italic text-zinc-600">Not specified</p>
        )}
      </section>

      <ManuscriptBlock title="Output type">
        {output ? <p>{output}</p> : <p className="italic text-zinc-600">Not specified</p>}
      </ManuscriptBlock>

      <ManuscriptBlock title="Business logic">
        {calculationLogic ? (
          <p className="whitespace-pre-line">{calculationLogic}</p>
        ) : (
          <p className="italic text-zinc-600">Not specified</p>
        )}
      </ManuscriptBlock>

      {features.length > 0 && (
        <section className="border-l-2 border-cyan-600/35 pl-4">
          <ManuscriptHeading>Features</ManuscriptHeading>
          <ul className="space-y-2">
            {features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <ManuscriptDot />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ManuscriptBlock title="Monetization strategy">
        {monetization ? <p>{monetization}</p> : <p className="italic text-zinc-600">Not specified</p>}
      </ManuscriptBlock>

      {monetizationRoadmap.length > 0 && (
        <section className="border-l-2 border-cyan-600/35 pl-4">
          <ManuscriptHeading>Monetization roadmap</ManuscriptHeading>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-zinc-300">
            {monetizationRoadmap.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </section>
      )}

      {eeatStructure.length > 0 && (
        <section className="border-l-2 border-cyan-600/35 pl-4">
          <ManuscriptHeading>EEAT structure</ManuscriptHeading>
          <ul className="space-y-2">
            {eeatStructure.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <ManuscriptDot />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-l-2 border-cyan-600/35 pl-4">
        <ManuscriptHeading>Internal linking suggestions</ManuscriptHeading>
        {internalLinks.length > 0 ? (
          <ul className="space-y-1.5">
            {internalLinks.map((link: string, i: number) => (
              <li key={i} className="break-all font-mono text-xs text-zinc-400">
                {link}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-zinc-600">Not specified</p>
        )}
      </section>

      <ManuscriptBlock title="Call to action">
        {cta ? <p className="font-medium text-zinc-200">{cta}</p> : <p className="italic text-zinc-600">Not specified</p>}
      </ManuscriptBlock>
    </div>
  );
}

type BuildStep = "analyzing" | "logic" | "styling" | "embed" | "done";

/** Warm editorial shell for the project workspace (distinct from default dashboard chrome). */
const PROJECT_WORKBENCH_SHELL = {
  shellClassName:
    "bg-[#d6d3d1] bg-[linear-gradient(165deg,rgb(214,211,209)_0%,rgb(245,242,239)_42%,rgb(200,195,190)_100%)]",
  mainClassName: "bg-transparent",
  innerClassName: "min-h-full p-5 sm:p-8 lg:p-10",
} as const;

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"categories" | "blueprint" | "export">("categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [buildStep, setBuildStep] = useState<BuildStep | null>(null);

  const [panelTab, setPanelTab] = useState<"blueprint" | "variations" | "landing">("blueprint");
  
  // Variations state
  // Variation A
  const [audienceA, setAudienceA] = useState("General / Broad");
  const [monetizationA, setMonetizationA] = useState("Lead Generation (email capture)");
  
  // Variation B
  const [audienceB, setAudienceB] = useState("Small Business Owners");
  const [monetizationB, setMonetizationB] = useState("Affiliate Links");
  
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [variations, setVariations] = useState<any[] | null>(null);
  const [expandedVariation, setExpandedVariation] = useState<number | null>(null);

  // Landing page state
  const [generatingLanding, setGeneratingLanding] = useState(false);
  const [landingPageHtml, setLandingPageHtml] = useState<string | null>(null);

  // Build mode state
  const [buildMode, setBuildMode] = useState<"standalone" | "embed" | null>(null);
  const [panelToolTheme, setPanelToolTheme] = useState("modern");
  const [savingPanelTheme, setSavingPanelTheme] = useState(false);

  useEffect(() => {
    loadProject();
    
    // Check for tab and toolId query parameters
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'blueprint' || tab === 'export') {
      setActiveTab(tab as "blueprint" | "export");
    }
  }, [id]);

  // Handle opening specific tool from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('toolId');
    
    if (toolId && tools.length > 0) {
      const tool = tools.find(t => t.id === parseInt(toolId));
      if (tool) {
        openBuildPanel(tool);
      }
    }
  }, [tools]);

  useEffect(() => {
    if (!selectedTool?.blueprint) return;
    try {
      const bp = JSON.parse(selectedTool.blueprint);
      setPanelToolTheme(normalizeVisualThemeId(bp.visual_theme ?? bp.theme));
    } catch {
      setPanelToolTheme("modern");
    }
  }, [selectedTool?.id, selectedTool?.blueprint]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setTools(data.tools || []);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };



  const openBuildPanel = (tool: Tool) => {
    setSelectedTool(tool);
    setPanelOpen(true);
    setBuildStep(null);
    setBuildMode(null); // Reset to show clean default state
    setLandingPageHtml(tool.landing_page_html);
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

  const generateBlueprint = async () => {
    if (!selectedTool) return;

    const isRegeneration = Boolean(selectedTool.blueprint);
    setBuildStep("analyzing");
    try {
      const endpoint = isRegeneration
        ? `/api/tools/${selectedTool.id}/blueprint/regenerate`
        : `/api/tools/${selectedTool.id}/blueprint`;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        try {
          if (typeof data.blueprint === "string") {
            JSON.parse(data.blueprint);
          }
        } catch (e) {
          console.error("[Blueprint] Failed to parse:", e);
          throw new Error("Invalid blueprint format");
        }
        
        setBuildStep(null);
        showToast({
          type: "success",
          title: isRegeneration ? "Blueprint regenerated!" : "Blueprint generated!",
          message: isRegeneration ? "Your tool blueprint has been updated" : "Your tool blueprint is ready",
        });
        // Store as string to match database format
        setSelectedTool({ ...selectedTool, blueprint: data.blueprint });
        await loadProject();
      } else {
        throw new Error(await readApiError(response, "Blueprint generation failed"));
      }
    } catch (error) {
      console.error("Failed to generate blueprint:", error);
      showToast({
        type: "error",
        title: isRegeneration ? "Blueprint regeneration failed" : "Blueprint failed",
        message: error instanceof Error ? error.message : "Could not generate blueprint",
      });
      setBuildStep(null);
    }
  };

  const buildTool = async (action: "standalone" | "embed") => {
    if (!selectedTool) return;
    
    setBuildStep("logic");
    setBuildMode(action); // Track which mode was built
    try {
      const response = await fetch(`/api/tools/${selectedTool.id}/html`, {
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
        setSelectedTool({ ...selectedTool, html_content: data.html });
        setBuildStep("done");
        
        // Show success toast
        if (action === "standalone") {
          showToast({ 
            title: "Standalone page ready!", 
            message: "Your HTML file is ready to download",
            type: "success" 
          });
        } else {
          showToast({ 
            title: "Embed code ready!", 
            message: "Your widget code is ready to copy",
            type: "success" 
          });
        }
        
        // Reset buildStep after brief delay to show download/copy options
        setTimeout(() => {
          setBuildStep(null);
        }, 1500);
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
      setBuildMode(null);
    }
  };

  const persistPanelToolTheme = async (themeId: string) => {
    if (!selectedTool?.blueprint) return;
    setSavingPanelTheme(true);
    try {
      let bp: Record<string, unknown>;
      try {
        bp = JSON.parse(selectedTool.blueprint);
      } catch {
        showToast({ title: "Could not read blueprint to save theme", type: "error" });
        return;
      }
      bp.visual_theme = themeId;
      const next = JSON.stringify(bp);
      const res = await fetch(`/api/tools/${selectedTool.id}/blueprint/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint: next }),
      });
      if (!res.ok) {
        showToast({ title: "Failed to save theme", type: "error" });
        return;
      }
      const toolId = selectedTool.id;
      setSelectedTool((prev) => (prev ? { ...prev, blueprint: next } : null));
      setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, blueprint: next } : t)));
    } finally {
      setSavingPanelTheme(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#3B82F6";
    if (score >= 40) return "#F59E0B";
    return "#6B7280";
  };

  const getRatingLabel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  };

  const getToolIcon = (name: string) => {
    const iconClass = "h-5 w-5";
    if (name.toLowerCase().includes("calculator")) return <Calculator className={iconClass} />;
    if (name.toLowerCase().includes("keyword")) return <SearchCheck className={iconClass} />;
    if (name.toLowerCase().includes("backlink")) return <Link2 className={iconClass} />;
    if (name.toLowerCase().includes("roi")) return <TrendingUp className={iconClass} />;
    if (name.toLowerCase().includes("content")) return <FileText className={iconClass} />;
    if (name.toLowerCase().includes("seo")) return <Search className={iconClass} />;
    return <Code2 className={iconClass} />;
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedByCategory = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const categories = Object.keys(groupedByCategory);
  const blueprintCount = tools.filter(t => t.blueprint).length;

  const exportCSV = () => {
    const headers = ["Name", "Category", "Description", "Overall Score", "Traffic Score", "Backlink Score", "Monetization Score"];
    const rows = tools.map(t => [
      t.name,
      t.category,
      t.description,
      t.overall_score,
      t.traffic_score,
      t.backlink_score,
      t.monetization_score
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name || "project"}-tools.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "Exported!", message: "CSV file downloaded" });
  };

  const generateVariations = async () => {
    if (!selectedTool) return;
    
    setGeneratingVariations(true);
    setVariations(null);
    
    try {
      const response = await fetch(`/api/tools/${selectedTool.id}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          variationA: {
            audience: audienceA,
            monetization: monetizationA,
          },
          variationB: {
            audience: audienceB,
            monetization: monetizationB,
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate variations");
      }
      
      const data = await response.json();
      setVariations([data.variationA, data.variationB]);
      
      showToast({
        type: "success",
        title: "Variations Generated!",
        message: "2 blueprint variations created successfully",
      });
    } catch (error) {
      console.error("Error generating variations:", error);
      showToast({
        type: "error",
        title: "Generation Failed",
        message: error instanceof Error ? error.message : "Could not generate variations. Please try again.",
      });
    } finally {
      setGeneratingVariations(false);
    }
  };

  const useThisBlueprint = async (variationIndex: number) => {
    if (!selectedTool || !variations) return;
    
    const selectedVariation = variations[variationIndex];
    
    try {
      // Convert the variation to JSON string for storage
      const blueprintJson = JSON.stringify(selectedVariation);
      
      // Update the tool's blueprint in the database
      const response = await fetch(`/api/tools/${selectedTool.id}/blueprint/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blueprint: blueprintJson }),
      });
      
      if (!response.ok) throw new Error("Failed to apply blueprint");
      
      // Update local state
      const updatedTool = { ...selectedTool, blueprint: blueprintJson };
      setSelectedTool(updatedTool);
      
      // Update tools list
      setTools(tools.map(t => t.id === selectedTool.id ? updatedTool : t));
      
      // Switch to blueprint tab to show the result
      setPanelTab("blueprint");
      
      showToast({
        type: "success",
        title: "Blueprint Applied Successfully",
        message: `Variation ${variationIndex === 0 ? 'A' : 'B'} is now your active blueprint`,
      });
      
      // Clear variations to reset the UI
      setVariations(null);
      
    } catch (error) {
      console.error("Error applying blueprint:", error);
      showToast({
        type: "error",
        title: "Failed to Apply Blueprint",
        message: "Could not update the blueprint. Please try again.",
      });
    }
  };

  const generateLandingPageHandler = async () => {
    if (!selectedTool) return;
    
    setGeneratingLanding(true);
    setLandingPageHtml(null);
    
    try {
      const response = await fetch(`/api/tools/${selectedTool.id}/landing-page`, {
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
      
      // Update the selected tool with the new landing page HTML
      setSelectedTool({ ...selectedTool, landing_page_html: data.html });
      
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

  const downloadTool = () => {
    if (!selectedTool?.html_content) return;
    
    const blob = new Blob([selectedTool.html_content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTool.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: "success",
      title: "Downloaded!",
      message: "Standalone HTML file saved"
    });
  };

  const copyEmbedCode = () => {
    if (!selectedTool?.html_content) return;
    
    navigator.clipboard.writeText(selectedTool.html_content);
    showToast({
      type: "success",
      title: "Copied!",
      message: "Embed code copied to clipboard"
    });
  };

  const downloadLandingPage = () => {
    if (!landingPageHtml) return;
    
    const blob = new Blob([landingPageHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTool?.name.toLowerCase().replace(/\s+/g, "-")}-landing-page.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: "success",
      title: "Downloaded!",
      message: "Landing page HTML file saved"
    });
  };

  const copyLandingPageCode = () => {
    if (!landingPageHtml) return;
    navigator.clipboard.writeText(landingPageHtml);
    showToast({
      type: "success",
      title: "Copied!",
      message: "Landing page HTML copied to clipboard",
    });
  };

  const goBackFromLandingPanel = () => {
    setPanelTab("blueprint");
  };

  const copyAllForContentWrapper = async () => {
    // Determine which HTML content to use
    const htmlContent = selectedTool?.html_content || landingPageHtml;
    
    if (!selectedTool || !htmlContent) {
      showToast({
        type: "error",
        title: "Not ready",
        message: "Please build the tool first (standalone, embed, or landing page)",
      });
      return;
    }

    // Parse blueprint to extract data
    let blueprintData: any = {};
    let blueprintText = '';
    
    try {
      // Try to parse as JSON first
      blueprintData = typeof selectedTool.blueprint === 'string' 
        ? JSON.parse(selectedTool.blueprint)
        : selectedTool.blueprint;
      
      // Extract purpose for blueprint field
      blueprintText = blueprintData.purpose || selectedTool.description || '';
    } catch (e) {
      // If not JSON, try text format parsing
      const bp = selectedTool.blueprint || '';
      const lines = bp.split('\n');
      const purposeMatch = lines.find(l => l.toLowerCase().startsWith('purpose:'));
      blueprintText = purposeMatch ? purposeMatch.replace(/^purpose:\s*/i, '').trim() : selectedTool.description || '';
      
      // Try to extract other fields from text format
      const keywordsMatch = lines.find(l => l.toLowerCase().startsWith('keywords:'));
      const ctaMatch = lines.find(l => l.toLowerCase().startsWith('cta:'));
      
      blueprintData = {
        title: selectedTool.name,
        purpose: blueprintText,
        target_keywords: keywordsMatch ? keywordsMatch.replace(/^keywords:\s*/i, '').split(',').map(k => k.trim()) : [],
        cta_text: ctaMatch ? ctaMatch.replace(/^cta:\s*/i, '').trim() : null,
      };
    }

    // Extract primary keyword
    const primaryKeyword = blueprintData.target_keywords && blueprintData.target_keywords.length > 0 
      ? blueprintData.target_keywords[0] 
      : selectedTool.name.toLowerCase().replace(/\s+/g, ' ');

    // Determine format based on source
    let format = 'standalone';
    if (landingPageHtml && htmlContent === landingPageHtml) {
      format = 'landing_page';
    } else if (buildMode) {
      format = buildMode;
    }

    // Build structured payload matching Content Wrapper format
    const bundle = `TOOL_NAME:
${selectedTool.name}

CATEGORY:
${selectedTool.category || 'Tools'}

TARGET_KEYWORD:
${primaryKeyword}

NICHE:
${selectedTool.category ? selectedTool.category.toLowerCase() : 'general tools'}

BLUEPRINT:
${blueprintText}

EMBED_CODE:
${htmlContent}

CTA:
${blueprintData.cta_text || `Start using the ${selectedTool.name} today`}

FORMAT:
${format}`;

    try {
      await navigator.clipboard.writeText(bundle);
      showToast({
        type: "success",
        title: "Copied for Content Wrapper!",
        message: "Paste into Content Wrapper to auto-fill all fields",
      });
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      showToast({
        type: "error",
        title: "Failed to copy",
        message: "Please try again or check browser permissions",
      });
    }
  };

  const regenerateLandingPage = async () => {
    setLandingPageHtml(null);
    await generateLandingPageHandler();
  };

  const audienceOptions = [
    "General / Broad",
    "Small Business Owners",
    "Freelancers & Solopreneurs",
    "Enterprise / B2B",
    "Students & Beginners",
    "E-commerce Sellers",
    "Marketing Professionals",
    "Real Estate Investors",
  ];

  const monetizationOptions = [
    "Lead Generation (email capture)",
    "Affiliate Links",
    "SaaS / Tool Subscription",
    "Consulting / Agency Lead Gen",
    "Digital Product Sales",
    "Display Ads / Programmatic",
    "Direct Product / Service Upsell",
  ];

  const variationSetups = [
    {
      id: "A",
      title: "Variation A",
      audience: audienceA,
      monetization: monetizationA,
      setAudience: setAudienceA,
      setMonetization: setMonetizationA,
      accent: "#6D5DFB",
      soft: "rgba(109, 93, 251, 0.1)",
      ring: "rgba(109, 93, 251, 0.28)",
    },
    {
      id: "B",
      title: "Variation B",
      audience: audienceB,
      monetization: monetizationB,
      setAudience: setAudienceB,
      setMonetization: setMonetizationB,
      accent: "#38BDF8",
      soft: "rgba(56, 189, 248, 0.12)",
      ring: "rgba(56, 189, 248, 0.28)",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout {...PROJECT_WORKBENCH_SHELL}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-24 bg-stone-800/25" aria-hidden />
            <Loader2 className="h-8 w-8 animate-spin text-stone-700" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-600">Opening project…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout {...PROJECT_WORKBENCH_SHELL}>
        <div className="rounded-sm border border-stone-800/15 bg-[#f5f2ef]/90 p-8 shadow-sm">
          <p className="font-serif text-lg text-stone-800">Project not found</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-teal-900 underline decoration-teal-900/30 underline-offset-4 hover:text-teal-950"
          >
            ← Return to desk
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout {...PROJECT_WORKBENCH_SHELL}>
      <div className="relative mx-auto w-full max-w-5xl">
        <div
          className="pointer-events-none absolute -left-4 top-0 hidden h-72 w-72 rounded-full bg-teal-900/[0.04] blur-3xl md:block"
          aria-hidden
        />

        <header className="relative mb-10 border-b border-stone-900/10 pb-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="mt-1 shrink-0 rounded-sm border border-stone-800/20 bg-[#ebe8e4]/80 p-2.5 text-stone-700 shadow-sm transition-colors hover:border-stone-800/40 hover:bg-[#f5f2ef]"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.38em] text-stone-600">
                  Project workbench
                </p>
                <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
                  {project.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
                  <span className="text-stone-800">{project.niche}</span>
                  <span className="mx-2 text-stone-400">·</span>
                  <span>{tools.length} instruments on file</span>
                  {project.goal ? (
                    <>
                      <span className="mx-2 text-stone-400">·</span>
                      <span className="italic text-stone-600">Goal: {project.goal}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-sm border border-stone-800/25 bg-stone-900 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5f2ef] shadow-md transition-colors hover:bg-stone-800 lg:self-auto"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <nav
            className="mt-10 flex flex-wrap border border-stone-800/15 bg-[#ebe8e4]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
            aria-label="Project sections"
          >
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={cn(
                "relative flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 border-stone-800/15 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors sm:flex-1 sm:border-r",
                activeTab === "categories"
                  ? "bg-[#faf8f5] text-stone-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[3px] after:bg-teal-800 after:content-[''] sm:after:left-4 sm:after:right-4"
                  : "text-stone-600 hover:bg-[#f2efe9] hover:text-stone-900",
              )}
            >
              Categories
              <span className="rounded-sm border border-stone-800/15 bg-stone-100/80 px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-stone-700">
                {categories.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("blueprint")}
              className={cn(
                "relative flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 border-stone-800/15 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors sm:flex-1 sm:border-r",
                activeTab === "blueprint"
                  ? "bg-[#faf8f5] text-stone-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[3px] after:bg-teal-800 after:content-[''] sm:after:left-4 sm:after:right-4"
                  : "text-stone-600 hover:bg-[#f2efe9] hover:text-stone-900",
              )}
            >
              Blueprints
              <span className="rounded-sm border border-stone-800/15 bg-stone-100/80 px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-stone-700">
                {blueprintCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={cn(
                "relative flex min-h-[3.25rem] flex-[1.2] items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors sm:flex-none sm:px-8",
                activeTab === "export"
                  ? "bg-[#faf8f5] text-stone-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[3px] after:bg-teal-800 after:content-[''] sm:after:left-6 sm:after:right-6"
                  : "text-stone-600 hover:bg-[#f2efe9] hover:text-stone-900",
              )}
            >
              Ledger export
            </button>
          </nav>
        </header>

        {/* Categories */}
        {activeTab === "categories" && (
          <>
            <div className="mb-8 rounded-sm border border-stone-800/15 bg-[#faf8f5]/90 p-4 shadow-sm">
              <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-stone-500">
                Catalogue filters
              </p>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search instruments…"
                    className="w-full rounded-sm border border-stone-800/20 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-800/35 focus:outline-none focus:ring-1 focus:ring-teal-800/20"
                  />
                </div>

                <select
                  value={filterGoal}
                  onChange={(e) => setFilterGoal(e.target.value)}
                  className="rounded-sm border border-stone-800/20 bg-white/80 px-3 py-2.5 text-sm text-stone-800 focus:border-teal-800/35 focus:outline-none focus:ring-1 focus:ring-teal-800/20 md:min-w-[11rem]"
                >
                  <option value="all">All Goals</option>
                  <option value="backlinks">Backlinks</option>
                  <option value="leads">Leads</option>
                  <option value="traffic">Traffic</option>
                  <option value="engagement">Engagement</option>
                </select>

                <label className="flex cursor-pointer items-center gap-2 px-2 py-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-sm border-stone-600 text-teal-900 focus:ring-teal-800/30"
                  />
                  Archived
                </label>

                <Link to="/projects/new" className="md:ml-auto">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-stone-800/25 bg-stone-900 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5f2ef] shadow-sm transition-colors hover:bg-stone-800 md:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    New project
                  </button>
                </Link>
              </div>
            </div>

            {tools.length === 0 && (
              <div className="rounded-sm border border-dashed border-stone-800/25 bg-[#f5f2ef]/60 py-20 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-stone-800/15 bg-[#ebe8e4]">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-900/70" aria-hidden />
                </div>
                <h3 className="font-serif text-2xl text-stone-900">Generating instruments…</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
                  Discovery is running for this project. Refresh shortly, or return to your desk.
                </p>
              </div>
            )}

            <div className="space-y-10">
              {categories.map((category) => (
                <div key={category}>
                  <h2 className="mb-5 flex items-baseline gap-3 font-serif text-xl font-semibold text-stone-900">
                    {category}
                    <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-stone-500">
                      {groupedByCategory[category].length} on file
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {groupedByCategory[category].map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => openBuildPanel(tool)}
                        className="group rounded-sm border border-stone-800/15 bg-[#faf8f5] p-5 text-left shadow-sm transition-all hover:border-stone-800/35 hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="icon-tile h-12 w-12 shrink-0">{getToolIcon(tool.name)}</div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <h3 className="font-serif text-base font-semibold text-stone-900">{tool.name}</h3>
                              <ChevronRight className="h-5 w-5 shrink-0 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>

                            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-stone-600">{tool.description}</p>

                            <div className="flex flex-wrap items-center gap-4">
                              <div
                                className="rounded-sm border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums"
                                style={{
                                  borderColor: `${getScoreColor(tool.overall_score)}55`,
                                  background: `${getScoreColor(tool.overall_score)}12`,
                                  color: getScoreColor(tool.overall_score),
                                }}
                              >
                                {tool.overall_score} /100
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: getScoreColor(tool.traffic_score) }}
                                  />
                                  <span>
                                    Traffic:{" "}
                                    <strong className="text-stone-800">{getRatingLabel(tool.traffic_score)}</strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: getScoreColor(tool.backlink_score) }}
                                  />
                                  <span>
                                    Link score:{" "}
                                    <strong className="text-stone-800">{getRatingLabel(tool.backlink_score)}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600">
                              <div
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: getScoreColor(tool.monetization_score) }}
                              />
                              <span>
                                Monetization:{" "}
                                <strong className="text-stone-800">{getRatingLabel(tool.monetization_score)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-stone-800/10 pt-3">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                            {category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Blueprints — paper folios */}
        {activeTab === "blueprint" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-stone-800/20 pb-6">
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-stone-600">
                  Folio index
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-900">Strategy blueprints</h2>
                <p className="mt-1 text-sm text-stone-600">
                  {blueprintCount} folio{blueprintCount === 1 ? "" : "s"} with completed strategy manuscripts.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              {tools
                .filter((t) => t.blueprint)
                .map((tool) => {
                  const blueprint = parseToolBlueprintJson(tool.blueprint as string);
                  const purpose = (blueprint.purpose as string) || tool.description || "";
                  const monetization = (blueprint.monetization_strategy as string) || "";
                  const cta = (blueprint.call_to_action as string) || (blueprint.cta_text as string) || "";
                  const keywords = Array.isArray(blueprint.target_keywords)
                    ? (blueprint.target_keywords as string[])
                    : [];

                  return (
                    <article
                      key={tool.id}
                      className="rounded-sm border border-stone-800/20 bg-[#faf8f5] p-6 shadow-[0_2px_0_rgba(41,37,36,0.06),inset_0_1px_0_rgba(255,255,255,0.65)]"
                    >
                      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-900/80">
                            {tool.category}
                          </p>
                          <h3 className="mt-2 font-serif text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                            {tool.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/blueprints/${tool.id}`}
                            className="inline-flex items-center justify-center rounded-sm border border-teal-900/35 bg-teal-950/[0.06] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-teal-950 transition-colors hover:border-teal-900/55 hover:bg-teal-950/10"
                          >
                            Open dossier
                          </Link>
                          <button
                            type="button"
                            onClick={() => openBuildPanel(tool)}
                            className="rounded-sm border border-stone-800/25 bg-stone-900 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#f5f2ef] transition-colors hover:bg-stone-800"
                          >
                            Build &amp; ship
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-6 border-t border-dashed border-stone-800/20 pt-6">
                        <div className="border-l-2 border-teal-800/45 pl-4">
                          <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                            Purpose
                          </h4>
                          <p className="text-sm leading-relaxed text-stone-800">{purpose}</p>
                        </div>

                        <div className="border-l-2 border-teal-800/45 pl-4">
                          <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                            Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {keywords.length > 0
                              ? keywords.map((keyword: string, i: number) => (
                                  <span
                                    key={i}
                                    className="border border-dashed border-stone-500/40 bg-[#f3f0eb] px-2.5 py-1 font-mono text-xs text-stone-800"
                                  >
                                    {keyword}
                                  </span>
                                ))
                              : tool.keywords
                                ? tool.keywords.split(",").map((keyword, i) => (
                                    <span
                                      key={i}
                                      className="border border-dashed border-stone-500/40 bg-[#f3f0eb] px-2.5 py-1 font-mono text-xs text-stone-800"
                                    >
                                      {keyword.trim()}
                                    </span>
                                  ))
                                : null}
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="border-l-2 border-teal-800/45 pl-4">
                            <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                              Monetization
                            </h4>
                            <p className="text-sm leading-relaxed text-stone-800">{monetization}</p>
                          </div>
                          <div className="border-l-2 border-teal-800/45 pl-4">
                            <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                              Call to action
                            </h4>
                            <p className="text-sm font-medium leading-relaxed text-stone-900">{cta}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              {blueprintCount === 0 && (
                <div className="rounded-sm border border-dashed border-stone-800/25 bg-[#faf8f5]/70 px-6 py-14 text-center">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-stone-600">
                    Empty folio
                  </p>
                  <p className="mt-3 font-serif text-xl text-stone-900">No blueprints filed yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
                    Open an instrument from Categories and generate a blueprint to see it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ledger export */}
        {activeTab === "export" && (
          <div className="rounded-sm border border-stone-800/20 bg-[#faf8f5] px-8 py-14 text-center shadow-sm">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-stone-600">Ledger</p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-stone-900">Export project data</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
              Download every instrument row and score column as a single CSV.
            </p>
            <button
              type="button"
              onClick={exportCSV}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm border border-stone-800/25 bg-stone-900 px-8 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5f2ef] shadow-md transition-colors hover:bg-stone-800"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        )}
      </div>

      {/* Build Tool Side Panel */}
      {panelOpen && selectedTool && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setPanelOpen(false);
              setBuildMode(null);
              setBuildStep(null);
            }}
          />
          <div
            className="fixed top-0 right-0 z-50 h-full w-[min(100vw,520px)] max-w-[520px] overflow-y-auto border-l border-zinc-800 bg-zinc-950 text-zinc-200 shadow-2xl animate-slide-in-right"
          >
            {/* Panel Header */}
            <div className="border-b border-zinc-800 p-6">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/80">
                    {selectedTool.category}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{selectedTool.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{selectedTool.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className="shrink-0 rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-5 flex overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80">
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("blueprint");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                    panelTab === "blueprint"
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200",
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Blueprint
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("variations");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 border-x border-zinc-800 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                    panelTab === "variations"
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200",
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  Variations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("landing");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                    panelTab === "landing"
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200",
                  )}
                >
                  <Code2 className="h-4 w-4" />
                  Landing
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="space-y-6 p-6">
              {panelTab === "blueprint" && selectedTool.blueprint && (
                <>
                  <BlueprintManuscriptPanelBody selectedTool={selectedTool} />

                  <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Visual theme</h4>
                      {savingPanelTheme && (
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" aria-hidden />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      <strong className="text-zinc-100">
                        {VISUAL_THEMES.find((t) => t.id === panelToolTheme)?.name ?? "Modern"}
                      </strong>
                      <span className="text-zinc-500">
                        {" "}
                        — drives colors in generated standalone HTML and embed widget. Saves to your blueprint.
                      </span>
                    </p>
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Theme — professional styles
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {VISUAL_THEMES.map((theme) => (
                          <div
                            key={theme.id}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPanelToolTheme(theme.id);
                                void persistPanelToolTheme(theme.id);
                              }
                            }}
                            onClick={() => {
                              setPanelToolTheme(theme.id);
                              void persistPanelToolTheme(theme.id);
                            }}
                            className={cn(
                              "relative cursor-pointer rounded-xl border-2 bg-zinc-950/80 p-2.5 transition-all",
                              panelToolTheme === theme.id
                                ? "border-cyan-500 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                                : "border-transparent hover:border-zinc-600",
                            )}
                          >
                            {panelToolTheme === theme.id && (
                              <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-zinc-950 shadow-sm">
                                <Check className="h-3 w-3" aria-hidden />
                              </div>
                            )}
                            <div className="mb-2 h-10 w-full rounded-lg" style={{ background: theme.swatch }} />
                            <p className="mb-0.5 text-xs font-semibold text-zinc-100">{theme.name}</p>
                            <p className="text-[10px] leading-snug text-zinc-500">{theme.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Build Options - Always Visible */}
                  <div className="border-t border-dashed border-zinc-800 pt-6">
                    <h4 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Build this tool as…
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => buildTool("standalone")}
                        disabled={buildStep !== null}
                        className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-all hover:border-cyan-700/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-cyan-400 transition-colors group-hover:border-cyan-600/50">
                          <Download className="h-5 w-5" />
                        </div>
                        <p className="mb-1 text-sm font-semibold text-zinc-100">Standalone Page</p>
                        <p className="text-xs leading-tight text-zinc-500">
                          Single .html file — upload via FTP to your website as its own page
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => buildTool("embed")}
                        disabled={buildStep !== null}
                        className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-all hover:border-cyan-700/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-cyan-400 transition-colors group-hover:border-cyan-600/50">
                          <Code2 className="h-5 w-5" />
                        </div>
                        <p className="mb-1 text-sm font-semibold text-zinc-100">Embeddable Widget</p>
                        <p className="text-xs leading-tight text-zinc-500">
                          Paste into WordPress posts, articles, or any existing page
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons - Always Visible */}
                  <div className="grid grid-cols-2 gap-3 border-t border-dashed border-zinc-800 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTool.blueprint || "");
                        showToast({
                          type: "success",
                          title: "Copied!",
                          message: "Blueprint copied to clipboard",
                        });
                      }}
                      className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
                    >
                      Copy Blueprint
                    </button>
                    <button
                      type="button"
                      onClick={generateBlueprint}
                      disabled={buildStep !== null}
                      className="rounded-xl border border-cyan-700/50 bg-cyan-950/50 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-950/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  </div>

                  {/* Build Status */}
                  {buildStep && (
                    <div
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 px-6 py-4 font-mono text-xs font-semibold uppercase tracking-widest text-white",
                        buildStep === "done"
                          ? "border-emerald-800/80 bg-emerald-950/80 text-emerald-100"
                          : "bg-zinc-900 text-cyan-100",
                      )}
                    >
                      {buildStep !== "done" && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-cyan-400" />}
                      {buildStep === "analyzing" && "Regenerating blueprint…"}
                      {buildStep === "logic" && "Building business logic…"}
                      {buildStep === "styling" &&
                        `Applying ${VISUAL_THEMES.find((t) => t.id === panelToolTheme)?.name ?? "Modern"} theme…`}
                      {buildStep === "embed" && "Preparing embed code…"}
                      {buildStep === "done" &&
                        (buildMode === "standalone" ? "Standalone page ready." : "Embeddable widget ready.")}
                    </div>
                  )}

                  {/* Download/Copy Actions - Shown after successful build */}
                  {selectedTool.html_content && !buildStep && buildMode !== null && (
                    <div className="space-y-3 border-t border-dashed border-zinc-800 pt-6">
                      <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-center text-sm font-medium text-emerald-100">
                        Business asset built successfully.
                      </div>

                      {buildMode === "standalone" ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={downloadTool}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-white"
                          >
                            <Download className="h-4 w-4" />
                            Download .html File
                          </button>
                          <p className="text-center text-xs text-zinc-500">
                            Upload via FTP — works as a standalone page on any web host
                          </p>
                        </div>
                      ) : buildMode === "embed" ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={copyEmbedCode}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-white"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy Embed Code
                          </button>
                          <p className="text-center text-xs text-zinc-500">
                            Paste into WordPress, blog posts, or any page with custom HTML
                          </p>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={copyAllForContentWrapper}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-800/60 bg-cyan-950/50 px-4 py-3 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-950/80"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Copy All for Content Wrapper
                      </button>

                      <button
                        type="button"
                        onClick={() => setBuildMode(null)}
                        className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        ← Build a different format
                      </button>
                    </div>
                  )}
                </>
              )}

              {panelTab === "variations" && (
                <div className="space-y-5 text-zinc-200">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
                    <p className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Configure variations
                    </p>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
                      {variationSetups.map((variation) => (
                        <div key={variation.id} className="min-w-0 space-y-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                              style={{ backgroundColor: variation.accent }}
                              aria-hidden
                            >
                              {variation.id}
                            </div>
                            <h4 className="text-[15px] font-bold tracking-tight text-zinc-100">{variation.title}</h4>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                <Users className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                Audience
                              </div>
                              <div className="relative">
                                <select
                                  value={variation.audience}
                                  onChange={(e) => variation.setAudience(e.target.value)}
                                  className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 pr-9 text-sm font-medium text-zinc-100 outline-none transition-shadow focus:ring-2 focus:ring-cyan-500/30"
                                >
                                  {audienceOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 opacity-70"
                                  aria-hidden
                                />
                              </div>
                            </div>

                            <div>
                              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                <DollarSign className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                Monetization
                              </div>
                              <div className="relative">
                                <select
                                  value={variation.monetization}
                                  onChange={(e) => variation.setMonetization(e.target.value)}
                                  className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 pr-9 text-sm font-medium text-zinc-100 outline-none transition-shadow focus:ring-2 focus:ring-cyan-500/30"
                                >
                                  {monetizationOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 opacity-70"
                                  aria-hidden
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={generateVariations}
                      disabled={generatingVariations}
                      className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-800/60 bg-cyan-950/60 px-4 py-3.5 text-sm font-bold text-cyan-50 shadow-md transition-colors hover:bg-cyan-950/90 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {generatingVariations ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          Generating variations…
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 shrink-0 fill-white" strokeWidth={2.25} />
                          Generate 2 Blueprint Variations
                        </>
                      )}
                    </button>
                  </div>

                  {variations && variations.length > 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-500/90">
                            AI comparison
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-zinc-100">Choose the strongest business angle</h3>
                        </div>
                        <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-400">
                          Expand for full blueprint logic
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {variations.map((variation, index) => {
                          const setup = variationSetups[index] || variationSetups[0];
                          const isExpanded = expandedVariation === index;
                          const keywords = Array.isArray(variation.target_keywords) ? variation.target_keywords : [];
                          const audience = variation.audience || setup.audience;

                          return (
                            <div
                              key={index}
                              className={cn(
                                "overflow-hidden rounded-xl border bg-zinc-950/50 shadow-sm transition-all duration-300 hover:bg-zinc-950/80",
                                !isExpanded && "border-zinc-800",
                              )}
                              style={isExpanded ? { borderColor: setup.ring } : undefined}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedVariation(isExpanded ? null : index)}
                                className="w-full p-4 text-left transition-colors hover:bg-zinc-900/80"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex gap-3">
                                    <div
                                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-sm"
                                      style={{ background: `linear-gradient(135deg, ${setup.accent}, #111827)` }}
                                    >
                                      {setup.id}
                                    </div>
                                    <div>
                                      <div className="mb-2 flex flex-wrap gap-2">
                                        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: setup.soft, color: setup.accent }}>
                                          {audience}
                                        </span>
                                        <span className="rounded-full bg-zinc-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                          {setup.monetization}
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-bold text-zinc-100">
                                        {setup.title}: {variation.title || "Monetization Strategy"}
                                      </h4>
                                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                                        {variation.summary || variation.purpose || "AI-generated strategy blueprint tailored to this audience and monetization path."}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronDown
                                    className={cn(
                                      "mt-1 h-5 w-5 shrink-0 text-zinc-500 transition-transform",
                                      isExpanded && "rotate-180",
                                    )}
                                  />
                                </div>
                              </button>

                              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                                {[
                                  ["Traffic", "SEO-led"],
                                  ["Capture", "Lead-first"],
                                  ["Revenue", "Offer-fit"],
                                ].map(([label, value]) => (
                                  <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
                                    <p className="mt-1 text-xs font-bold text-zinc-200">{value}</p>
                                  </div>
                                ))}
                              </div>

                              {isExpanded && (
                                <div className="space-y-4 border-t border-zinc-800 px-4 pb-4 pt-4">
                                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                                    <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-200">
                                      <CheckCircle className="h-4 w-4 text-cyan-500" />
                                      Strategy purpose
                                    </h5>
                                    <p className="text-sm leading-relaxed text-zinc-400">
                                      {variation.purpose || "Not specified"}
                                    </p>
                                  </div>

                                  {keywords.length > 0 && (
                                    <div>
                                      <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                                        Search opportunities
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {keywords.map((keyword: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="rounded border border-dashed border-zinc-600 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300"
                                          >
                                            {keyword}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                                        <DollarSign className="h-4 w-4" style={{ color: setup.accent }} />
                                        Monetization
                                      </h5>
                                      <p className="text-sm leading-relaxed text-zinc-400">
                                        {variation.monetization_strategy || "Not specified"}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                                        <Target className="h-4 w-4" style={{ color: setup.accent }} />
                                        Conversion CTA
                                      </h5>
                                      <p className="text-sm font-semibold leading-relaxed text-zinc-100">
                                        {variation.cta_text || variation.call_to_action || "Not specified"}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => useThisBlueprint(index)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-950 shadow-lg transition-colors hover:bg-white"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Use This Strategy Blueprint
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {panelTab === "landing" && (
                <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-zinc-200">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-cyan-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-zinc-100">Landing Page Generator</h3>
                    <p className="text-sm leading-relaxed text-zinc-500">
                      Generate a complete, production-ready SaaS landing page with premium hero, interactive business asset, metrics, trust sections, monetization roadmap, FAQ, conversion CTAs, and polished footer.
                    </p>
                  </div>

                  {!landingPageHtml && !generatingLanding && (
                    <button
                      type="button"
                      onClick={generateLandingPageHandler}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-800/60 bg-cyan-950/60 px-6 py-4 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-950/90"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Landing Page
                    </button>
                  )}

                  {generatingLanding && (
                    <div className="w-full rounded-xl px-6 py-8 text-center">
                      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-400" />
                      <p className="mb-2 text-sm font-semibold text-zinc-100">Generating Your Landing Page</p>
                      <p className="text-xs text-zinc-500">
                        This may take 30-60 seconds. Creating a polished conversion page with strategic business logic...
                      </p>
                    </div>
                  )}

                  {landingPageHtml && !generatingLanding && (
                    <>
                      <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-center text-sm font-medium text-emerald-100">
                        Landing page built successfully.
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={downloadLandingPage}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-100 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-white"
                          >
                            <Download className="h-4 w-4" />
                            Download HTML file
                          </button>
                          <p className="text-center text-xs text-zinc-500">
                            Upload via FTP — works as a standalone page on any web host
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={copyLandingPageCode}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
                        >
                          <Code2 className="h-4 w-4" />
                          Copy code
                        </button>
                        <button
                          type="button"
                          onClick={goBackFromLandingPanel}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={regenerateLandingPage}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-800/60 bg-cyan-950/60 px-4 py-3 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-950/90"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!selectedTool.blueprint && (
                <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 py-10 text-center">
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                    No manuscript on file
                  </p>
                  <button
                    type="button"
                    onClick={generateBlueprint}
                    disabled={buildStep === "analyzing"}
                    className="mx-auto w-full max-w-sm rounded-xl border border-cyan-800/60 bg-cyan-950/50 px-6 py-4 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-950/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buildStep === "analyzing" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating…
                      </span>
                    ) : (
                      "Generate Blueprint"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}


    </DashboardLayout>
  );
}
