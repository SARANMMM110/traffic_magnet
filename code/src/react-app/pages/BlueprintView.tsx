import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { ArrowLeft, Loader2, Check, Download, Code2, RefreshCw } from "lucide-react";
import { useToast } from "@/react-app/components/Toast";
import { VISUAL_THEMES, normalizeVisualThemeId } from "@/react-app/lib/visualThemes";

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

interface Project {
  id: number;
  name: string;
  niche: string;
}

type BuildStep = "analyzing" | "logic" | "styling" | "embed" | "done";

export default function BlueprintView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tool, setTool] = useState<Tool | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelTab, setPanelTab] = useState<"blueprint" | "variations" | "landing">("blueprint");
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [buildStep, setBuildStep] = useState<BuildStep | null>(null);
  const [buildResult, setBuildResult] = useState<{ action: "standalone" | "embed"; html: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingLanding, setGeneratingLanding] = useState(false);
  const [landingPageHtml, setLandingPageHtml] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => {
    loadTool();
  }, [id]);

  useEffect(() => {
    if (!tool?.blueprint) return;
    try {
      const bp = JSON.parse(tool.blueprint);
      setSelectedTheme(normalizeVisualThemeId(bp.visual_theme ?? bp.theme));
    } catch {
      /* ignore */
    }
  }, [tool?.blueprint]);

  const loadTool = async () => {
    try {
      const response = await fetch(`/api/tools/${id}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setTool(data.tool);
        setLandingPageHtml(data.tool.landing_page_html);
        
        // Load project info
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
    console.log("🔥 buildTool called", { tool: !!tool, buildStep, action });
    
    if (!tool) {
      console.log("❌ BLOCKED: tool is null");
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
    if (tool?.project_id != null) {
      navigate(`/projects/${tool.project_id}`);
    } else {
      navigate("/magnets");
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
      setTool((prev: Tool | null) => (prev ? { ...prev, blueprint: next } : null));
    } finally {
      setSavingTheme(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!tool) {
    return null;
  }

  // Parse blueprint - handle both JSON format and legacy text format
  let blueprint: any = {};
  try {
    // Try JSON parse first (new format)
    if (tool.blueprint) {
      blueprint = JSON.parse(tool.blueprint);
    }
  } catch (e) {
    // Fall back to parsing legacy text format
    if (tool.blueprint) {
      const text = tool.blueprint as string;
      const lines = text.split('\n');
      
      blueprint = {};
      let currentField = '';
      let currentValue = '';
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          // Save previous field if exists
          if (currentField) {
            const key = currentField.toLowerCase().replace(/\s+/g, '_');
            blueprint[key] = currentValue.trim();
          }
          
          // Start new field
          currentField = line.substring(0, colonIndex).trim();
          currentValue = line.substring(colonIndex + 1).trim();
        } else if (line.trim()) {
          // Continuation of previous field
          currentValue += ' ' + line.trim();
        }
      }
      
      // Save last field
      if (currentField) {
        const key = currentField.toLowerCase().replace(/\s+/g, '_');
        blueprint[key] = currentValue.trim();
      }
      
      // Parse comma-separated values into arrays
      if (blueprint.target_keywords && typeof blueprint.target_keywords === 'string') {
        blueprint.target_keywords = blueprint.target_keywords.split(',').map((k: string) => k.trim());
      }
      if (blueprint.inputs_required && typeof blueprint.inputs_required === 'string') {
        blueprint.inputs_required = blueprint.inputs_required.split(',').map((k: string) => k.trim());
      }
      if (blueprint.internal_linking_suggestions && typeof blueprint.internal_linking_suggestions === 'string') {
        blueprint.internal_links = blueprint.internal_linking_suggestions.split(',').map((k: string) => k.trim());
      }
    }
  }

  const purpose = blueprint.purpose || tool.description || "";
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
  const output = blueprint.output_type || "";
  const calculationLogic = blueprint.calculation_logic || "";
  const monetization = blueprint.monetization_strategy || "";
  const linking = Array.isArray(blueprint.internal_links) ? blueprint.internal_links.join("\n") : (blueprint.internal_linking_suggestions || "");
  const cta = blueprint.call_to_action || blueprint.cta_text || "";
  const features = Array.isArray(blueprint.features) ? blueprint.features : [];
  const inputs = Array.isArray(inputFields) 
    ? inputFields.map((f: any) => typeof f === 'string' ? f : (f.label || "")).join(", ")
    : "";

  return (
    <DashboardLayout>
      <div className="page-shell max-w-5xl">
        {/* Header */}
        <div className="surface-panel mb-6 p-6">
          <button
            onClick={() => navigate("/magnets")}
            className="mb-4 flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--brand)]"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to my projects
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {tool.category} {project && `· ${project.name}`}
              </p>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {tool.name}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {tool.description}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                background: `${tool.overall_score >= 80 ? '#10B981' : tool.overall_score >= 60 ? '#3B82F6' : '#F59E0B'}20`,
                color: tool.overall_score >= 80 ? '#10B981' : tool.overall_score >= 60 ? '#3B82F6' : '#F59E0B',
              }}
            >
              Score: {tool.overall_score}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-pill mb-6 flex w-fit flex-wrap gap-2">
          <button
            onClick={() => setPanelTab("blueprint")}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: panelTab === "blueprint" ? "white" : "transparent",
              color: panelTab === "blueprint" ? "var(--brand)" : "var(--text-muted)",
            }}
          >
            Blueprint
          </button>
          <button
            onClick={() => setPanelTab("variations")}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: panelTab === "variations" ? "white" : "transparent",
              color: panelTab === "variations" ? "var(--brand)" : "var(--text-muted)",
            }}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Variations
            </span>
          </button>
          <button
            onClick={() => setPanelTab("landing")}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: panelTab === "landing" ? "white" : "transparent",
              color: panelTab === "landing" ? "var(--brand)" : "var(--text-muted)",
            }}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Landing Page
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="premium-card p-8">
          {panelTab === "blueprint" && tool.blueprint && (
            <div className="space-y-6">
              <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-overlay)] p-5">
                {/* Visual theme (stored on blueprint) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      VISUAL THEME
                    </h4>
                    {savingTheme && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--brand)" }} aria-hidden />}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    <strong>
                      {VISUAL_THEMES.find((t) => t.id === normalizeVisualThemeId(blueprint.visual_theme ?? blueprint.theme))?.name ??
                        "Modern"}
                    </strong>
                    <span style={{ color: "var(--text-muted)" }}>
                      {" "}
                      — used when you build a standalone page or embed widget. Change it below; it saves to your blueprint
                      automatically.
                    </span>
                  </p>
                </div>

                {/* Theme Selector */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
                    THEME — PROFESSIONAL STYLES
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {VISUAL_THEMES.map((theme) => (
                      <div
                        key={theme.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedTheme(theme.id);
                            void persistVisualTheme(theme.id);
                          }
                        }}
                        onClick={() => {
                          setSelectedTheme(theme.id);
                          void persistVisualTheme(theme.id);
                        }}
                        className={`relative rounded-xl p-3 cursor-pointer transition-all border-2 ${
                          selectedTheme === theme.id ? "border-[var(--brand)] shadow-sm" : "border-transparent hover:border-[var(--border)]"
                        }`}
                        style={{ background: "var(--surface)" }}
                      >
                        {selectedTheme === theme.id && (
                          <div
                            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
                            style={{ background: "var(--brand)" }}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                          </div>
                        )}
                        <div className="mb-2 h-12 w-full rounded-lg" style={{ background: theme.swatch }} />
                        <p className="mb-0.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {theme.name}
                        </p>
                        <p className="text-[10px] leading-snug" style={{ color: "var(--text-muted)" }}>
                          {theme.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Build Options */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    BUILD THIS TOOL AS...
                  </h4>

                  {!buildResult ? (
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          buildTool("standalone");
                        }}
                        disabled={buildStep !== null}
                        className="premium-card group rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--brand)] shadow-sm transition-all group-hover:bg-[var(--brand-soft)]">
                            <Download className="h-5 w-5" />
                          </span>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            Standalone Page
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Single .html file — upload via FTP to your website as its own page
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          buildTool("embed");
                        }}
                        disabled={buildStep !== null}
                        className="premium-card group rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--brand)] shadow-sm transition-all group-hover:bg-[var(--brand-soft)]">
                            <Code2 className="h-5 w-5" />
                          </span>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            Embeddable Widget
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Paste into WordPress posts, articles, or any existing page
                        </p>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className="rounded-lg px-4 py-3 text-center"
                        style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}
                      >
                        {buildResult.action === "standalone" ? "Standalone page ready!" : "Embeddable widget ready!"}
                      </div>

                      {buildResult.action === "standalone" ? (
                        <button
                          type="button"
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
                          className="btn-primary w-full rounded-2xl py-3 font-semibold"
                        >
                          Download .html File
                        </button>
                      ) : (
                        <button
                          type="button"
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
                          className="btn-primary w-full rounded-2xl py-3 font-semibold"
                        >
                          {copied ? "Copied!" : "</> Copy Embed Code"}
                        </button>
                      )}

                      <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        {buildResult.action === "standalone"
                          ? "Upload via FTP — works as a standalone page on any web host"
                          : 'Paste this into a WordPress "Custom HTML" block or any page editor'}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const bundle = `# ${tool.name}\n\n\`\`\`html\n${buildResult.html}\n\`\`\`\n\n\`\`\`json\n${tool.blueprint}\n\`\`\``;
                          navigator.clipboard.writeText(bundle).then(() => {
                              showToast({ title: "Content wrapper copied!", type: "success" });
                            }).catch(() => {
                              showToast({ title: "Failed to copy", type: "error" });
                            });
                        }}
                        className="btn-secondary w-full rounded-2xl py-3 font-semibold"
                      >
                        Copy All for Content Wrapper
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setBuildResult(null)}
                          className="text-sm hover:underline"
                          style={{ color: "var(--text-muted)" }}
                        >
                          ← Build a different format
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    PURPOSE
                  </h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                  {purpose}
                </p>
              </div>

              {strategySections.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {section.title}
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                    {section.value}
                  </p>
                </div>
              ))}

              {audiencePainPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      AUDIENCE PAIN POINTS
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {audiencePainPoints.map((point: string, i: number) => (
                      <div key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text-primary)" }}>
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#10B981" }} />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    TARGET KEYWORDS
                  </h4>
                </div>
                {keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-xs"
                        style={{
                          background: "var(--bg-overlay)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                )}
              </div>

              {/* Inputs Required */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    INPUTS REQUIRED
                  </h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                  {inputs || "Not specified"}
                </p>
              </div>

              {/* Output Type */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    OUTPUT TYPE
                  </h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                  {output || "Not specified"}
                </p>
              </div>

              {/* Business Logic */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    BUSINESS LOGIC
                  </h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                  {calculationLogic || "Not specified"}
                </p>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      FEATURES
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {features.map((feature: string, i: number) => (
                      <div key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text-primary)" }}>
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#10B981" }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monetization Strategy */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    MONETIZATION STRATEGY
                  </h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                  {monetization || "Not specified"}
                </p>
              </div>

              {monetizationRoadmap.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      MONETIZATION ROADMAP
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {monetizationRoadmap.map((item: string, i: number) => (
                      <div key={i} className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {i + 1}. {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eeatStructure.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      EEAT STRUCTURE
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {eeatStructure.map((item: string, i: number) => (
                      <div key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text-primary)" }}>
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#10B981" }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Linking Suggestions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    INTERNAL LINKING SUGGESTIONS
                  </h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                  {linking || "Not specified"}
                </p>
              </div>

              {/* Call to Action */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    CALL TO ACTION
                  </h4>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#F97316" }}>
                  {cta || "Not specified"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={copyBlueprint}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    background: "var(--bg-overlay)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Copy Blueprint
                </button>
                <button
                  onClick={regenerateBlueprint}
                  disabled={buildStep !== null}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--bg-overlay)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {buildStep === "analyzing" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Regenerating...
                    </span>
                  ) : (
                    "Regenerate"
                  )}
                </button>
              </div>

              {/* Build Status */}
              {buildStep && (
                <div className="w-full px-6 py-4 rounded-2xl font-bold text-white transition-all" style={{ background: buildStep === "done" ? "#10B981" : "linear-gradient(135deg, #635BFF, #4F46E5)", boxShadow: buildStep === "done" ? "0 12px 28px #10B98130" : "0 12px 28px var(--brand-glow)" }}>
                  {buildStep === "logic" && (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building business logic...
                    </span>
                  )}
                  {buildStep === "styling" && (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Applying {VISUAL_THEMES.find((t) => t.id === selectedTheme)?.name} theme...
                    </span>
                  )}
                  {buildStep === "embed" && (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Preparing embed code...
                    </span>
                  )}
                  {buildStep === "done" && (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Business Asset Built Successfully!
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {panelTab === "blueprint" && !tool.blueprint && (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                No blueprint generated yet.
              </p>
              <button
                onClick={generateBlueprint}
                disabled={buildStep !== null}
                className="btn-primary rounded-2xl px-6 py-3 font-semibold disabled:opacity-50"
              >
                {buildStep === "analyzing" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Blueprint...
                  </span>
                ) : (
                  "Generate Blueprint"
                )}
              </button>
            </div>
          )}

          {panelTab === "variations" && (
            <div className="premium-card overflow-hidden rounded-3xl p-0">
              <div
                className="p-5"
                style={{
                  background:
                    "radial-gradient(circle at 16% 0%, rgba(109, 93, 251, 0.14), transparent 34%), radial-gradient(circle at 92% 18%, rgba(37, 99, 235, 0.1), transparent 30%), rgba(255,255,255,0.9)",
                }}
              >
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white text-[var(--brand)] shadow-sm">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand)] shadow-sm">
                      AI strategy lab
                    </div>
                    <h3 className="text-lg font-bold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
                      Premium Strategy Variations
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Create audience-specific monetization angles, traffic strategies, and conversion CTAs from the full project workspace.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["Audience Angle", "Compare creators, agencies, businesses, and buyer-intent segments."],
                    ["Revenue Model", "Test lead generation, affiliate, SaaS, consulting, and product paths."],
                    ["Traffic Strategy", "Preview organic search, authority content, and conversion journeys."],
                    ["Blueprint Upgrade", "Apply the strongest generated strategy as the active blueprint."],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/projects/${tool?.project_id}`)}
                  className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
                >
                  Open AI Strategy Configurator
                </button>
              </div>
            </div>
          )}

          {panelTab === "landing" && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Landing Page Generator
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Generate a production-ready SaaS landing page with a premium hero, interactive business asset, trust sections, monetization roadmap, FAQ, conversion CTAs, and polished footer.
                </p>
              </div>

              {/* Generate Button */}
              {!landingPageHtml && !generatingLanding && (
                <button
                  onClick={generateLandingPageHandler}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Landing Page
                </button>
              )}

              {/* Generating Status */}
              {generatingLanding && (
                <div className="w-full px-6 py-8 rounded-xl text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "var(--brand)" }} />
                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Generating Your Landing Page
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    This may take 30-60 seconds. Creating a polished conversion page with strategic business logic...
                  </p>
                </div>
              )}

              {/* Success & Actions */}
              {landingPageHtml && !generatingLanding && (
                <>
                  <div className="px-4 py-3 rounded-lg text-center font-medium" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                    Landing page generated successfully!
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={downloadLandingPage}
                      className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download HTML file
                    </button>
                    <button
                      type="button"
                      onClick={copyLandingPageHTML}
                      className="btn-secondary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold"
                    >
                      <Code2 className="w-4 h-4" />
                      Copy code
                    </button>
                    <button
                      type="button"
                      onClick={goBackFromLanding}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all hover:brightness-95"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                        background: "var(--bg-overlay)",
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={regenerateLandingPage}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
                      style={{
                        background: "var(--brand)",
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
