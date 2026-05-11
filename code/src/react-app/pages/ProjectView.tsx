import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import {
  ArrowLeft,
  Search,
  Download,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";

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

type BuildStep = "analyzing" | "logic" | "styling" | "embed" | "done";

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
        console.log("[Blueprint] Raw API response:", typeof data.blueprint);
        
        // Parse blueprint string into object
        let blueprintObj;
        try {
          blueprintObj = typeof data.blueprint === 'string' 
            ? JSON.parse(data.blueprint) 
            : data.blueprint;
          console.log("[Blueprint] Parsed object keys:", Object.keys(blueprintObj));
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
        body: JSON.stringify({ action }),
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
        throw new Error("Failed to build tool");
      }
    } catch (error) {
      console.error("Tool building failed:", error);
      showToast({ title: "Failed to build tool. Please try again.", type: "error" });
      setBuildStep(null);
      setBuildMode(null);
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
    if (name.toLowerCase().includes("calculator")) return "🧮";
    if (name.toLowerCase().includes("keyword")) return "📝";
    if (name.toLowerCase().includes("backlink")) return "📊";
    if (name.toLowerCase().includes("roi")) return "💰";
    if (name.toLowerCase().includes("content")) return "📄";
    if (name.toLowerCase().includes("seo")) return "🔍";
    return "⚡";
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p style={{ color: "var(--text-primary)" }}>Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {project.name}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {project.niche} · {tools.length} assets
              </p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-gray-50"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6" style={{ borderBottom: "2px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("categories")}
            className="px-4 py-3 font-semibold text-sm transition-all relative"
            style={{
              color: activeTab === "categories" ? "var(--brand)" : "var(--text-secondary)",
            }}
          >
            Categories
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: activeTab === "categories" ? "var(--brand)" : "var(--bg-elevated)",
                color: activeTab === "categories" ? "white" : "var(--text-muted)",
              }}
            >
              {categories.length}
            </span>
            {activeTab === "categories" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: "var(--brand)" }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("blueprint")}
            className="px-4 py-3 font-semibold text-sm transition-all relative"
            style={{
              color: activeTab === "blueprint" ? "var(--brand)" : "var(--text-secondary)",
            }}
          >
            Asset Blueprint
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: activeTab === "blueprint" ? "var(--brand)" : "var(--bg-elevated)",
                color: activeTab === "blueprint" ? "white" : "var(--text-muted)",
              }}
            >
              {blueprintCount}
            </span>
            {activeTab === "blueprint" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: "var(--brand)" }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className="px-4 py-3 font-semibold text-sm transition-all relative"
            style={{
              color: activeTab === "export" ? "var(--brand)" : "var(--text-secondary)",
            }}
          >
            Export
            {activeTab === "export" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: "var(--brand)" }}
              />
            )}
          </button>
        </div>

        {/* Filters Bar */}
        {activeTab === "categories" && (
          <>
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
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <select
                value={filterGoal}
                onChange={(e) => setFilterGoal(e.target.value)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">All Goals</option>
                <option value="backlinks">Backlinks</option>
                <option value="leads">Leads</option>
                <option value="traffic">Traffic</option>
                <option value="engagement">Engagement</option>
              </select>

              <label className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: "var(--brand)" }}
                />
                <span style={{ color: "var(--text-secondary)" }}>Archived</span>
              </label>

              <Link to="/projects/new">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: "var(--brand)" }}
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </Link>
            </div>

            {/* Empty State */}
            {tools.length === 0 && (
              <div className="text-center py-20">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(124, 92, 252, 0.15)" }}
                >
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--brand)" }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Generating your traffic magnets...
                </h3>
                <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                  AI is discovering 12 tool ideas for your niche
                </p>
              </div>
            )}

            {/* Category Groups */}
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h2
                    className="text-lg font-bold mb-4"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {category}
                    <span className="ml-3 text-base font-normal" style={{ color: "var(--text-muted)" }}>
                      {groupedByCategory[category].length}
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {groupedByCategory[category].map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => openBuildPanel(tool)}
                        className="glass-card p-5 text-left hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: "var(--bg-elevated)" }}
                          >
                            {getToolIcon(tool.name)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                                {tool.name}
                              </h3>
                              <ChevronRight
                                className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: "var(--text-muted)" }}
                              />
                            </div>

                            <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                              {tool.description}
                            </p>

                            <div className="flex items-center gap-4 flex-wrap">
                              {/* Score Badge */}
                              <div
                                className="px-3 py-1 rounded-full text-sm font-bold"
                                style={{
                                  background: `${getScoreColor(tool.overall_score)}20`,
                                  color: getScoreColor(tool.overall_score),
                                }}
                              >
                                {tool.overall_score} /100
                              </div>

                              {/* Metrics */}
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: getScoreColor(tool.traffic_score) }}
                                  />
                                  <span style={{ color: "var(--text-secondary)" }}>
                                    Traffic: <strong>{getRatingLabel(tool.traffic_score)}</strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: getScoreColor(tool.backlink_score) }}
                                  />
                                  <span style={{ color: "var(--text-secondary)" }}>
                                    Link Magnet: <strong>{getRatingLabel(tool.backlink_score)}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 mt-3 text-xs">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: getScoreColor(tool.monetization_score) }}
                              />
                              <span style={{ color: "var(--text-secondary)" }}>
                                Monetization: <strong>{getRatingLabel(tool.monetization_score)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Category Tag */}
                        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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

        {/* Blueprint Tab */}
        {activeTab === "blueprint" && (
          <div className="space-y-4">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Tools with generated blueprints ({blueprintCount})
            </p>
            <div className="space-y-6">
              {tools.filter(t => t.blueprint).map((tool) => {
                // Parse blueprint - handle both JSON format and legacy text format
                let blueprint: any = {};
                try {
                  // Try JSON parse first (new format)
                  blueprint = JSON.parse(tool.blueprint as string);
                } catch (e) {
                  // Fall back to parsing legacy text format
                  // Format: "Field Name: value\nAnother Field: value"
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
                  
                  // Parse comma-separated keywords into array
                  if (blueprint.target_keywords && typeof blueprint.target_keywords === 'string') {
                    blueprint.target_keywords = blueprint.target_keywords.split(',').map((k: string) => k.trim());
                  }
                }
                
                const purpose = blueprint.purpose || tool.description || "";
                const monetization = blueprint.monetization_strategy || "";
                const cta = blueprint.call_to_action || blueprint.cta_text || "";
                const keywords = Array.isArray(blueprint.target_keywords) ? blueprint.target_keywords : [];

                return (
                  <div key={tool.id} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                          {tool.name}
                        </h3>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                          {tool.category}
                        </p>
                      </div>
                      <button
                        onClick={() => openBuildPanel(tool)}
                        className="px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-orange-50"
                        style={{ 
                          borderColor: "#F97316",
                          color: "#F97316",
                        }}
                      >
                        View Full Blueprint
                      </button>
                    </div>

                    <div className="grid gap-6">
                      {/* Purpose */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                          PURPOSE
                        </h4>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                          {purpose}
                        </p>
                      </div>

                      {/* Keywords */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                          KEYWORDS
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {keywords.length > 0 ? (
                            keywords.map((keyword: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 rounded-lg text-sm border"
                                style={{ 
                                  borderColor: "var(--border)",
                                  color: "var(--text-primary)",
                                  background: "var(--bg-elevated)"
                                }}
                              >
                                {keyword}
                              </span>
                            ))
                          ) : tool.keywords ? (
                            tool.keywords.split(",").map((keyword, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 rounded-lg text-sm border"
                                style={{ 
                                  borderColor: "var(--border)",
                                  color: "var(--text-primary)",
                                  background: "var(--bg-elevated)"
                                }}
                              >
                                {keyword.trim()}
                              </span>
                            ))
                          ) : null}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Monetization */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                            MONETIZATION
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                            {monetization}
                          </p>
                        </div>

                        {/* Call to Action */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                            CALL TO ACTION
                          </h4>
                          <p className="text-sm font-semibold" style={{ color: "#F97316" }}>
                            {cta}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === "export" && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Export Project Data
            </h3>
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>
              Download all your tools and their metrics
            </p>
            <button
              onClick={exportCSV}
              className="px-6 py-3 rounded-lg font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              <Download className="w-5 h-5 inline mr-2" />
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
            className="fixed top-0 right-0 h-full w-[480px] z-50 overflow-y-auto shadow-2xl animate-slide-in-right"
            style={{ background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)" }}
          >
            {/* Panel Header */}
            <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{selectedTool.category}</p>
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{selectedTool.name}</h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{selectedTool.description}</p>
                </div>
                <button
                  onClick={() => {
                    setPanelOpen(false);
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className="p-2 rounded-lg transition-all hover:bg-white/10"
                >
                  <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setPanelTab("blueprint");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    panelTab === "blueprint" ? "text-white" : ""
                  }`}
                  style={{
                    background: panelTab === "blueprint" ? "var(--text-primary)" : "transparent",
                    color: panelTab === "blueprint" ? "white" : "var(--text-muted)",
                  }}
                >
                  Blueprint
                </button>
                <button
                  onClick={() => {
                    setPanelTab("variations");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
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
                  onClick={() => {
                    setPanelTab("landing");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
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
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6">
              {panelTab === "blueprint" && selectedTool.blueprint && (
                <>
                  {(() => {
                    let blueprint: any = {};
                    
                    try {
                      // Try JSON parse first (new format)
                      blueprint = JSON.parse(selectedTool.blueprint);
                    } catch (e) {
                      // Fall back to parsing legacy text format
                      const text = selectedTool.blueprint as string;
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

                    const purpose = blueprint.purpose || selectedTool.description || "";
                    const keywords = Array.isArray(blueprint.target_keywords) ? blueprint.target_keywords : [];
                    const inputFields = Array.isArray(blueprint.inputs_required) ? blueprint.inputs_required : [];
                    const output = blueprint.output_type || "";
                    const calculationLogic = blueprint.calculation_logic || "";
                    const monetization = blueprint.monetization_strategy || "";
                    const internalLinks = Array.isArray(blueprint.internal_links) ? blueprint.internal_links : [];
                    const cta = blueprint.call_to_action || blueprint.cta_text || "";
                    const features = Array.isArray(blueprint.features) ? blueprint.features : [];

                    return (
                      <>
                        {/* Purpose */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Purpose
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {purpose}
                          </p>
                        </div>

                        {/* Target Keywords */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Target Keywords
                          </h4>
                          {keywords.length > 0 ? (
                            <div className="space-y-1">
                              {keywords.map((keyword: string, i: number) => (
                                <div key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                  {keyword}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>

                        {/* Inputs Required */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Inputs Required
                          </h4>
                          {inputFields.length > 0 ? (
                            <div className="space-y-1">
                              {inputFields.map((field: any, i: number) => {
                                const label = typeof field === 'string' ? field : (field.label || field);
                                return (
                                  <div key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {label}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>

                        {/* Output Type */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Output Type
                          </h4>
                          {output ? (
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {output}
                            </p>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>

                        {/* Calculation Logic */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Calculation Logic
                          </h4>
                          {calculationLogic ? (
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                              {calculationLogic}
                            </p>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>

                        {/* Features */}
                        {features.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                              Features
                            </h4>
                            <div className="space-y-1">
                              {features.map((feature: string, i: number) => (
                                <div key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                  • {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Monetization Strategy */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Monetization Strategy
                          </h4>
                          {monetization ? (
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {monetization}
                            </p>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>

                        {/* Internal Linking */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Internal Linking Suggestions
                          </h4>
                          {internalLinks.length > 0 ? (
                            <div className="space-y-1">
                              {internalLinks.map((link: string, i: number) => (
                                <div key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                  {link}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>

                        {/* Call to Action */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Call to Action
                          </h4>
                          {cta ? (
                            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                              {cta}
                            </p>
                          ) : (
                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not specified</p>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {/* Build Options - Always Visible */}
                  <div className="pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                    <h4 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                      Build this tool as…
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => buildTool("standalone")}
                        disabled={buildStep !== null}
                        className="p-3 rounded-lg border text-left transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: "var(--border)", background: "var(--bg-overlay)" }}
                      >
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                          Standalone Page
                        </p>
                        <p className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
                          Single .html file — upload via FTP to your website as its own page
                        </p>
                      </button>
                      <button
                        onClick={() => buildTool("embed")}
                        disabled={buildStep !== null}
                        className="p-3 rounded-lg border text-left transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: "var(--border)", background: "var(--bg-overlay)" }}
                      >
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                          Embeddable Widget
                        </p>
                        <p className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
                          Paste into WordPress posts, articles, or any existing page
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons - Always Visible */}
                  <div className="grid grid-cols-2 gap-3 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTool.blueprint || "");
                        showToast({
                          type: "success",
                          title: "Copied!",
                          message: "Blueprint copied to clipboard",
                        });
                      }}
                      className="px-4 py-2.5 rounded-lg font-medium border transition-all hover:bg-gray-50"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                        background: "var(--bg-overlay)",
                      }}
                    >
                      Copy Blueprint
                    </button>
                    <button
                      onClick={generateBlueprint}
                      disabled={buildStep !== null}
                      className="px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                      style={{
                        background: "var(--brand)",
                        color: "white",
                      }}
                    >
                      Regenerate
                    </button>
                  </div>

                  {/* Build Status */}
                  {buildStep && (
                    <div className="pt-6 w-full px-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2" style={{ background: buildStep === "done" ? "#10B981" : "linear-gradient(135deg, #7C5CFC, #5A3FD4)", boxShadow: "0 0 20px var(--brand-glow)", borderTop: "1px solid var(--border)" }}>
                      {buildStep !== "done" && <Loader2 className="w-5 h-5 animate-spin" />}
                      {buildStep === "analyzing" && "Regenerating blueprint..."}
                      {buildStep === "logic" && "Building calculation logic..."}
                      {buildStep === "styling" && "Applying theme..."}
                      {buildStep === "embed" && "Preparing embed code..."}
                      {buildStep === "done" && `✓ ${buildMode === "standalone" ? "Standalone page ready!" : "Embeddable widget ready!"}`}
                    </div>
                  )}

                  {/* Download/Copy Actions - Shown after successful build */}
                  {selectedTool.html_content && !buildStep && buildMode !== null && (
                    <div className="pt-6 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                      {/* Success Message */}
                      <div className="px-4 py-3 rounded-lg text-center font-medium" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                        ✓ Tool built successfully!
                      </div>

                      {/* Download/Copy Button based on mode */}
                      {buildMode === "standalone" ? (
                        <div className="space-y-2">
                          <button
                            onClick={downloadTool}
                            className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ background: "#111827" }}
                          >
                            <Download className="w-4 h-4" />
                            Download .html File
                          </button>
                          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                            Upload via FTP — works as a standalone page on any web host
                          </p>
                        </div>
                      ) : buildMode === "embed" ? (
                        <div className="space-y-2">
                          <button
                            onClick={copyEmbedCode}
                            className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ background: "#111827" }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Embed Code
                          </button>
                          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                            Paste into WordPress, blog posts, or any page with custom HTML
                          </p>
                        </div>
                      ) : null}

                      {/* Copy All for Content Wrapper */}
                      <button
                        onClick={copyAllForContentWrapper}
                        className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)" }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Copy All for Content Wrapper
                      </button>

                      {/* Build Different Format Link */}
                      <button
                        onClick={() => setBuildMode(null)}
                        className="w-full px-4 py-2 text-sm transition-all hover:opacity-70 flex items-center justify-center gap-2"
                        style={{ color: "var(--text-muted)", background: "transparent" }}
                      >
                        ← Build a different format
                      </button>
                    </div>
                  )}
                </>
              )}

              {panelTab === "variations" && (
                <>
                  {/* Configure Variations Card */}
                  <div 
                    className="rounded-lg"
                    style={{ 
                      background: "#F9FAFB",
                      border: "1px solid #E5E7EB",
                      padding: "16px"
                    }}
                  >
                    <h3 
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#6B7280", marginBottom: "12px" }}
                    >
                      CONFIGURE VARIATIONS
                    </h3>

                    <div className="grid grid-cols-2" style={{ gap: "20px" }}>
                      {/* Variation A */}
                      <div>
                        <div className="flex items-center gap-1.5" style={{ marginBottom: "12px" }}>
                          <span 
                            className="rounded flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              background: "#7C5CFC",
                              width: "20px",
                              height: "20px"
                            }}
                          >
                            A
                          </span>
                          <h4 className="font-semibold" style={{ color: "#111827", fontSize: "13px" }}>
                            Variation A
                          </h4>
                        </div>

                        <div style={{ marginBottom: "10px" }}>
                          <label 
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: "#6B7280", marginBottom: "4px" }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Audience
                          </label>
                          <select
                            value={audienceA}
                            onChange={(e) => setAudienceA(e.target.value)}
                            className="w-full text-sm rounded border focus:outline-none focus:ring-1 focus:ring-purple-400"
                            style={{ 
                              borderColor: "#D1D5DB",
                              color: "#111827",
                              background: "white",
                              padding: "6px 10px",
                              fontSize: "13px"
                            }}
                          >
                            <option value="General / Broad">General / Broad</option>
                            <option value="Small Business Owners">Small Business Owners</option>
                            <option value="Freelancers & Solopreneurs">Freelancers & Solopreneurs</option>
                            <option value="Enterprise / B2B">Enterprise / B2B</option>
                            <option value="Students & Beginners">Students & Beginners</option>
                            <option value="E-commerce Sellers">E-commerce Sellers</option>
                            <option value="Marketing Professionals">Marketing Professionals</option>
                            <option value="Real Estate Investors">Real Estate Investors</option>
                          </select>
                        </div>

                        <div>
                          <label 
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: "#6B7280", marginBottom: "4px" }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Monetization
                          </label>
                          <select
                            value={monetizationA}
                            onChange={(e) => setMonetizationA(e.target.value)}
                            className="w-full text-sm rounded border focus:outline-none focus:ring-1 focus:ring-purple-400"
                            style={{ 
                              borderColor: "#D1D5DB",
                              color: "#111827",
                              background: "white",
                              padding: "6px 10px",
                              fontSize: "13px"
                            }}
                          >
                            <option value="Lead Generation (email capture)">Lead Generation (email capture)</option>
                            <option value="Affiliate Links">Affiliate Links</option>
                            <option value="SaaS / Tool Subscription">SaaS / Tool Subscription</option>
                            <option value="Consulting / Agency Lead Gen">Consulting / Agency Lead Gen</option>
                            <option value="Digital Product Sales">Digital Product Sales</option>
                            <option value="Display Ads / Programmatic">Display Ads / Programmatic</option>
                            <option value="Direct Product / Service Upsell">Direct Product / Service Upsell</option>
                          </select>
                        </div>
                      </div>

                      {/* Variation B */}
                      <div>
                        <div className="flex items-center gap-1.5" style={{ marginBottom: "12px" }}>
                          <span 
                            className="rounded flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              background: "#3B82F6",
                              width: "20px",
                              height: "20px"
                            }}
                          >
                            B
                          </span>
                          <h4 className="font-semibold" style={{ color: "#111827", fontSize: "13px" }}>
                            Variation B
                          </h4>
                        </div>

                        <div style={{ marginBottom: "10px" }}>
                          <label 
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: "#6B7280", marginBottom: "4px" }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Audience
                          </label>
                          <select
                            value={audienceB}
                            onChange={(e) => setAudienceB(e.target.value)}
                            className="w-full text-sm rounded border focus:outline-none focus:ring-1 focus:ring-purple-400"
                            style={{ 
                              borderColor: "#D1D5DB",
                              color: "#111827",
                              background: "white",
                              padding: "6px 10px",
                              fontSize: "13px"
                            }}
                          >
                            <option value="General / Broad">General / Broad</option>
                            <option value="Small Business Owners">Small Business Owners</option>
                            <option value="Freelancers & Solopreneurs">Freelancers & Solopreneurs</option>
                            <option value="Enterprise / B2B">Enterprise / B2B</option>
                            <option value="Students & Beginners">Students & Beginners</option>
                            <option value="E-commerce Sellers">E-commerce Sellers</option>
                            <option value="Marketing Professionals">Marketing Professionals</option>
                            <option value="Real Estate Investors">Real Estate Investors</option>
                          </select>
                        </div>

                        <div>
                          <label 
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: "#6B7280", marginBottom: "4px" }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Monetization
                          </label>
                          <select
                            value={monetizationB}
                            onChange={(e) => setMonetizationB(e.target.value)}
                            className="w-full text-sm rounded border focus:outline-none focus:ring-1 focus:ring-purple-400"
                            style={{ 
                              borderColor: "#D1D5DB",
                              color: "#111827",
                              background: "white",
                              padding: "6px 10px",
                              fontSize: "13px"
                            }}
                          >
                            <option value="Lead Generation (email capture)">Lead Generation (email capture)</option>
                            <option value="Affiliate Links">Affiliate Links</option>
                            <option value="SaaS / Tool Subscription">SaaS / Tool Subscription</option>
                            <option value="Consulting / Agency Lead Gen">Consulting / Agency Lead Gen</option>
                            <option value="Digital Product Sales">Digital Product Sales</option>
                            <option value="Display Ads / Programmatic">Display Ads / Programmatic</option>
                            <option value="Direct Product / Service Upsell">Direct Product / Service Upsell</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={generateVariations}
                      disabled={generatingVariations}
                      className="w-full rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center gap-2"
                      style={{
                        background: "#F97316",
                        marginTop: "16px",
                        padding: "10px 16px",
                        fontSize: "14px"
                      }}
                    >
                      {generatingVariations ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Variations...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate 2 Blueprint Variations
                        </>
                      )}
                    </button>
                  </div>

                  {/* Variations Display - Accordion Layout */}
                  {variations && variations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-base font-bold mb-4" style={{ color: "#111827" }}>
                        Compare & Choose
                      </h3>
                      
                      <div className="space-y-3">
                        {/* Variation A */}
                        <div 
                          className="rounded-lg border transition-all"
                          style={{ 
                            background: "white",
                            borderColor: expandedVariation === 0 ? "#7C5CFC" : "#E5E7EB",
                            overflow: "hidden"
                          }}
                        >
                          {/* Accordion Header */}
                          <button
                            onClick={() => setExpandedVariation(expandedVariation === 0 ? null : 0)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <span 
                                className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                style={{ background: "#7C5CFC" }}
                              >
                                A
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm" style={{ color: "#111827" }}>
                                  Variation A: {variations[0].audience}
                                </h4>
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B7280" }}>
                                  {variations[0].summary}
                                </p>
                              </div>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${expandedVariation === 0 ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {/* Accordion Content */}
                          {expandedVariation === 0 && (
                            <div className="px-4 pb-4 pt-2 space-y-4 border-t" style={{ borderColor: "#F3F4F6" }}>
                              {/* Purpose */}
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                                  Purpose
                                </h5>
                                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                                  {variations[0].purpose}
                                </p>
                              </div>

                              {/* Keywords */}
                              {variations[0].target_keywords && variations[0].target_keywords.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                                    Keywords
                                  </h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {variations[0].target_keywords.map((keyword: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2.5 py-1 rounded text-xs font-medium"
                                        style={{ background: "#F3F4F6", color: "#374151" }}
                                      >
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Monetization */}
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                                  Monetization
                                </h5>
                                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                                  {variations[0].monetization_strategy}
                                </p>
                              </div>

                              {/* CTA */}
                              <div className="p-3 rounded" style={{ background: "#FFF7ED", border: "1px solid #FDBA74" }}>
                                <h5 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9A3412" }}>
                                  CTA
                                </h5>
                                <p className="text-sm font-semibold" style={{ color: "#EA580C" }}>
                                  {variations[0].cta_text}
                                </p>
                              </div>

                              {/* Use This Blueprint Button */}
                              <button
                                onClick={() => useThisBlueprint(0)}
                                className="w-full px-4 py-2.5 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: "#111827" }}
                              >
                                Use This Blueprint
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Variation B */}
                        <div 
                          className="rounded-lg border transition-all"
                          style={{ 
                            background: "white",
                            borderColor: expandedVariation === 1 ? "#3B82F6" : "#E5E7EB",
                            overflow: "hidden"
                          }}
                        >
                          {/* Accordion Header */}
                          <button
                            onClick={() => setExpandedVariation(expandedVariation === 1 ? null : 1)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <span 
                                className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                style={{ background: "#3B82F6" }}
                              >
                                B
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm" style={{ color: "#111827" }}>
                                  Variation B: {variations[1].audience}
                                </h4>
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B7280" }}>
                                  {variations[1].summary}
                                </p>
                              </div>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${expandedVariation === 1 ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {/* Accordion Content */}
                          {expandedVariation === 1 && (
                            <div className="px-4 pb-4 pt-2 space-y-4 border-t" style={{ borderColor: "#F3F4F6" }}>
                              {/* Purpose */}
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                                  Purpose
                                </h5>
                                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                                  {variations[1].purpose}
                                </p>
                              </div>

                              {/* Keywords */}
                              {variations[1].target_keywords && variations[1].target_keywords.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                                    Keywords
                                  </h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {variations[1].target_keywords.map((keyword: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2.5 py-1 rounded text-xs font-medium"
                                        style={{ background: "#F3F4F6", color: "#374151" }}
                                      >
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Monetization */}
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>
                                  Monetization
                                </h5>
                                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                                  {variations[1].monetization_strategy}
                                </p>
                              </div>

                              {/* CTA */}
                              <div className="p-3 rounded" style={{ background: "#FFF7ED", border: "1px solid #FDBA74" }}>
                                <h5 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9A3412" }}>
                                  CTA
                                </h5>
                                <p className="text-sm font-semibold" style={{ color: "#EA580C" }}>
                                  {variations[1].cta_text}
                                </p>
                              </div>

                              {/* Use This Blueprint Button */}
                              <button
                                onClick={() => useThisBlueprint(1)}
                                className="w-full px-4 py-2.5 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: "#111827" }}
                              >
                                Use This Blueprint
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {panelTab === "landing" && (
                <>
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
                        {/* Success Message */}
                        <div className="px-4 py-3 rounded-lg text-center font-medium" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                          ✓ Tool built successfully!
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                          {/* Download Button */}
                          <div className="space-y-2">
                            <button
                              onClick={downloadLandingPage}
                              className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                              style={{
                                background: "#111827",
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Download .html File
                            </button>
                            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                              Upload via FTP — works as a standalone page on any web host
                            </p>
                          </div>
                          
                          {/* Copy All for Content Wrapper */}
                          <button
                            onClick={copyAllForContentWrapper}
                            className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 flex items-center justify-center gap-2"
                            style={{
                              background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Copy All for Content Wrapper
                          </button>

                          {/* Build Different Format Link */}
                          <button
                            onClick={regenerateLandingPage}
                            className="w-full px-4 py-2 text-sm transition-all hover:opacity-70 flex items-center justify-center gap-2"
                            style={{
                              color: "var(--text-muted)",
                              background: "transparent",
                            }}
                          >
                            ← Build a different format
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {!selectedTool.blueprint && (
                <div className="text-center py-8">
                  <button
                    onClick={generateBlueprint}
                    disabled={buildStep === "analyzing"}
                    className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                      boxShadow: "0 0 20px var(--brand-glow)",
                    }}
                  >
                    {buildStep === "analyzing" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      "📋 Generate Blueprint"
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
