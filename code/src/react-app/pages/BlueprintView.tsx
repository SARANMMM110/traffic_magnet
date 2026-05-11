import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { ArrowLeft, Loader2, Check, Download } from "lucide-react";
import { useToast } from "@/react-app/components/Toast";

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

  useEffect(() => {
    loadTool();
  }, [id]);

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
        body: JSON.stringify({ action }),
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
        throw new Error("Failed to build tool");
      }
    } catch (error) {
      console.error("Tool building failed:", error);
      showToast({ title: "Failed to build tool. Please try again.", type: "error" });
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

  const generateLandingPageHandler = async () => {
    if (!tool) return;
    
    setGeneratingLanding(true);
    setLandingPageHtml(null);
    
    try {
      const response = await fetch(`/api/tools/${tool.id}/landing-page`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate landing page");
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

  const regenerateLandingPage = async () => {
    setLandingPageHtml(null);
    await generateLandingPageHandler();
  };

  const themes = [
    { id: "modern", name: "Modern", desc: "Clean, minimalist with bold accents", color: "#1F2937" },
    { id: "ocean", name: "Ocean", desc: "Cool blues with professional feel", color: "#0EA5E9" },
    { id: "forest", name: "Forest", desc: "Natural greens, earthy and trusted", color: "#10B981" },
    { id: "sunset", name: "Sunset", desc: "Warm, energetic with vibrant gradient", color: "#F97316" },
    { id: "purple", name: "Purple", desc: "Premium, creative, sophisticated", color: "#A855F7" },
    { id: "slate", name: "Slate", desc: "Professional grayscale with neutral accent", color: "#475569" },
  ];

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
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/magnets")}
            className="flex items-center gap-2 mb-4 text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Magnets
          </button>

          <div className="flex items-start justify-between">
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
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPanelTab("blueprint")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: panelTab === "blueprint" ? "var(--text-primary)" : "transparent",
              color: panelTab === "blueprint" ? "white" : "var(--text-muted)",
            }}
          >
            Blueprint
          </button>
          <button
            onClick={() => setPanelTab("variations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: panelTab === "variations" ? "var(--text-primary)" : "transparent",
              color: panelTab === "variations" ? "white" : "var(--text-muted)",
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: panelTab === "landing" ? "var(--text-primary)" : "transparent",
              color: panelTab === "landing" ? "white" : "var(--text-muted)",
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
        <div className="glass-card p-8">
          {panelTab === "blueprint" && tool.blueprint && (
            <div className="space-y-6">
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

              {/* Calculation Logic */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    CALCULATION LOGIC
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
                        <span style={{ color: "#10B981" }}>•</span>
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

              {/* Theme Selector */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
                  THEME — PROFESSIONAL STYLES
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`relative p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedTheme === theme.id ? "border-orange-500" : "border-transparent"
                      }`}
                      style={{ background: "var(--bg-overlay)" }}
                    >
                      {selectedTheme === theme.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className="w-full h-12 rounded mb-2"
                        style={{ background: theme.color }}
                      />
                      <p className="font-semibold text-xs mb-0.5" style={{ color: "var(--text-primary)" }}>
                        {theme.name}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
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
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("🔵 Standalone button clicked", { buildStep, tool: !!tool });
                        buildTool("standalone");
                      }}
                      disabled={buildStep !== null}
                      className="p-3 rounded-lg text-left transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "var(--bg-overlay)", border: "2px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5" style={{ color: "#F97316" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Standalone Page</p>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Single .html file — upload via FTP to your website as its own page
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("🟢 Embed button clicked", { buildStep, tool: !!tool });
                        buildTool("embed");
                      }}
                      disabled={buildStep !== null}
                      className="p-3 rounded-lg text-left transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "var(--bg-overlay)", border: "2px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5" style={{ color: "#F97316" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Embeddable Widget</p>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Paste into WordPress posts, articles, or any existing page
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Success Banner */}
                    <div className="text-center py-3 px-4 rounded-lg" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                      {buildResult.action === "standalone" ? "✅ Standalone page ready!" : "✅ Embeddable widget ready!"}
                    </div>

                    {/* Primary Action Button */}
                    {buildResult.action === "standalone" ? (
                      <button
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
                        className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                        style={{ background: "#1A1A1A" }}
                      >
                        ⬇ Download .html File
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(buildResult.html).then(() => {
                            setCopied(true);
                            showToast({ title: "Copied to clipboard!", type: "success" });
                            setTimeout(() => setCopied(false), 2000);
                          }).catch(() => {
                            showToast({ title: "Failed to copy", type: "error" });
                          });
                        }}
                        className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                        style={{ background: "#1A1A1A" }}
                      >
                        {copied ? "Copied!" : "</> Copy Embed Code"}
                      </button>
                    )}

                    {/* Helper Text */}
                    <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                      {buildResult.action === "standalone" 
                        ? "Upload via FTP — works as a standalone page on any web host"
                        : 'Paste this into a WordPress "Custom HTML" block or any page editor'
                      }
                    </p>

                    {/* Secondary Purple Button */}
                    <button
                      onClick={() => {
                        const bundle = `# ${tool.name}\n\n\`\`\`html\n${buildResult.html}\n\`\`\`\n\n\`\`\`json\n${tool.blueprint}\n\`\`\``;
                        navigator.clipboard.writeText(bundle).then(() => {
                          showToast({ title: "Content wrapper copied!", type: "success" });
                        }).catch(() => {
                          showToast({ title: "Failed to copy", type: "error" });
                        });
                      }}
                      className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                      style={{ background: "#7C5CFC" }}
                    >
                      📋 Copy All for Content Wrapper
                    </button>

                    {/* Back Link */}
                    <div className="text-center">
                      <button
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
                <div className="w-full px-6 py-4 rounded-xl font-bold text-white transition-all" style={{ background: buildStep === "done" ? "#10B981" : "linear-gradient(135deg, #7C5CFC, #5A3FD4)", boxShadow: buildStep === "done" ? "0 0 25px #10B98140" : "0 0 20px var(--brand-glow)" }}>
                  {buildStep === "logic" && (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building calculation logic...
                    </span>
                  )}
                  {buildStep === "styling" && (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Applying {themes.find((t) => t.id === selectedTheme)?.name} theme...
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
                      Tool Built Successfully!
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
                className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                }}
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
            <div className="text-center py-12">
              <p style={{ color: "var(--text-muted)" }}>
                Variations feature coming soon
              </p>
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
                  Generate a complete, production-ready landing page with 8 sections: Hero, Working Tool, Benefits, How It Works, Results, Testimonials, FAQ, and Final CTA. The tool will be fully functional with working calculation logic.
                </p>
              </div>

              {/* Generate Button */}
              {!landingPageHtml && !generatingLanding && (
                <button
                  onClick={generateLandingPageHandler}
                  className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all hover:brightness-110 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                    boxShadow: "0 0 20px var(--brand-glow)",
                  }}
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
                    This may take 30-60 seconds. Creating 8 sections with working calculator logic...
                  </p>
                </div>
              )}

              {/* Success & Actions */}
              {landingPageHtml && !generatingLanding && (
                <>
                  <div className="px-4 py-3 rounded-lg text-center font-medium" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                    ✓ Landing page generated successfully!
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Your landing page includes:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <div>• Hero Section</div>
                      <div>• Working Calculator Tool</div>
                      <div>• Benefits Section</div>
                      <div>• How It Works</div>
                      <div>• Results/Value Prop</div>
                      <div>• Testimonials</div>
                      <div>• FAQ Section</div>
                      <div>• Final CTA</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={downloadLandingPage}
                      className="px-4 py-2.5 rounded-lg font-medium border transition-all hover:brightness-95 flex items-center justify-center gap-2"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                        background: "var(--bg-overlay)",
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={copyLandingPageHTML}
                      className="px-4 py-2.5 rounded-lg font-medium border transition-all hover:brightness-95 flex items-center justify-center gap-2"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                        background: "var(--bg-overlay)",
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy HTML
                    </button>
                    <button
                      onClick={regenerateLandingPage}
                      className="px-4 py-2.5 rounded-lg font-medium transition-all hover:brightness-110 flex items-center justify-center gap-2"
                      style={{
                        background: "var(--brand)",
                        color: "white",
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </button>
                  </div>

                  {/* Preview Info */}
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      💡 Next Steps
                    </p>
                    <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                      <li>1. Download the HTML file</li>
                      <li>2. Upload to your website via FTP or hosting panel</li>
                      <li>3. Customize colors, fonts, and content as needed</li>
                      <li>4. Update testimonials and FAQ with real content</li>
                    </ul>
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
