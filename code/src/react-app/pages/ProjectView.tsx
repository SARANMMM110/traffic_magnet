import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
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
      <div className="page-shell max-w-7xl">
        {/* Header */}
        <div className="surface-panel mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-secondary p-2 rounded-2xl transition-all"
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
            className="btn-secondary flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-pill mb-6 flex w-fit flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab("categories")}
            className="rounded-xl px-4 py-3 font-semibold text-sm transition-all relative"
            style={{
              background: activeTab === "categories" ? "white" : "transparent",
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
          </button>
          <button
            onClick={() => setActiveTab("blueprint")}
            className="rounded-xl px-4 py-3 font-semibold text-sm transition-all relative"
            style={{
              background: activeTab === "blueprint" ? "white" : "transparent",
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
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className="rounded-xl px-4 py-3 font-semibold text-sm transition-all relative"
            style={{
              background: activeTab === "export" ? "white" : "transparent",
              color: activeTab === "export" ? "var(--brand)" : "var(--text-secondary)",
            }}
          >
            Export
          </button>
        </div>

        {/* Filters Bar */}
        {activeTab === "categories" && (
          <>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
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
                  className="input-premium w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>

              <select
                value={filterGoal}
                onChange={(e) => setFilterGoal(e.target.value)}
                className="input-premium px-4 py-3 text-sm"
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
                  className="premium-check"
                  style={{ accentColor: "var(--brand)" }}
                />
                <span style={{ color: "var(--text-secondary)" }}>Archived</span>
              </label>

              <Link to="/projects/new">
                <button
                  className="btn-primary flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
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
                  Generating your Ai Auto Traffic assets...
                </h3>
                <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                  AI is discovering 12 premium business asset ideas for this opportunity category
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
                        className="premium-card p-5 text-left transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="icon-tile h-12 w-12 flex-shrink-0"
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
                                    Link score: <strong>{getRatingLabel(tool.backlink_score)}</strong>
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
              Assets with generated strategy blueprints ({blueprintCount})
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
              <div className="tab-pill mt-5 flex gap-1">
                <button
                  onClick={() => {
                    setPanelTab("blueprint");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    panelTab === "blueprint"
                      ? "bg-white text-[var(--brand)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Blueprint
                </button>
                <button
                  onClick={() => {
                    setPanelTab("variations");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    panelTab === "variations"
                      ? "bg-white text-[var(--brand)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Variations
                </button>
                <button
                  onClick={() => {
                    setPanelTab("landing");
                    setBuildMode(null);
                    setBuildStep(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    panelTab === "landing"
                      ? "bg-white text-[var(--brand)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Code2 className="h-4 w-4" />
                  Landing Page
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
                    const strategySections = [
                      { title: "Market Opportunity", value: blueprint.market_opportunity },
                      { title: "SEO Opportunity", value: blueprint.seo_opportunity },
                      { title: "Traffic Acquisition Strategy", value: blueprint.traffic_acquisition_strategy },
                      { title: "Conversion Psychology", value: blueprint.conversion_psychology },
                      { title: "Authority Positioning", value: blueprint.authority_positioning },
                      { title: "Competitor Advantage", value: blueprint.competitor_advantage },
                    ].filter((section) => section.value);
                    const audiencePainPoints = Array.isArray(blueprint.audience_pain_points) ? blueprint.audience_pain_points : [];
                    const monetizationRoadmap = Array.isArray(blueprint.monetization_roadmap) ? blueprint.monetization_roadmap : [];
                    const eeatStructure = Array.isArray(blueprint.eeat_structure) ? blueprint.eeat_structure : [];
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

                        {strategySections.map((section) => (
                          <div key={section.title}>
                            <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                              {section.title}
                            </h4>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {section.value}
                            </p>
                          </div>
                        ))}

                        {audiencePainPoints.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                              Audience Pain Points
                            </h4>
                            <div className="space-y-1">
                              {audiencePainPoints.map((point: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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

                        {/* Business Logic */}
                        <div>
                          <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            Business Logic
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
                                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                  <span>{feature}</span>
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

                        {monetizationRoadmap.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                              Monetization Roadmap
                            </h4>
                            <div className="space-y-1">
                              {monetizationRoadmap.map((item: string, i: number) => (
                                <div key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                  {i + 1}. {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {eeatStructure.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                              EEAT Structure
                            </h4>
                            <div className="space-y-1">
                              {eeatStructure.map((item: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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

                  <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-overlay)] p-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Visual theme
                      </h4>
                      {savingPanelTheme && (
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--brand)" }} aria-hidden />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {VISUAL_THEMES.find((t) => t.id === panelToolTheme)?.name ?? "Modern"}
                      </strong>
                      <span style={{ color: "var(--text-muted)" }}>
                        {" "}
                        — drives colors in generated standalone HTML and embed widget. Saves to your blueprint.
                      </span>
                    </p>
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
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
                            className={`relative cursor-pointer rounded-xl border-2 p-2.5 transition-all ${
                              panelToolTheme === theme.id
                                ? "border-[var(--brand)] shadow-sm"
                                : "border-transparent hover:border-[var(--border)]"
                            }`}
                            style={{ background: "var(--surface)" }}
                          >
                            {panelToolTheme === theme.id && (
                              <div
                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                                style={{ background: "var(--brand)" }}
                              >
                                <Check className="h-3 w-3" aria-hidden />
                              </div>
                            )}
                            <div className="mb-2 h-10 w-full rounded-lg" style={{ background: theme.swatch }} />
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
                  </div>

                  {/* Build Options - Always Visible */}
                  <div className="pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                    <h4 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                      Build this tool as…
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => buildTool("standalone")}
                        disabled={buildStep !== null}
                        className="premium-card group rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--brand)] shadow-sm transition-all group-hover:bg-[var(--brand-soft)]">
                          <Download className="h-5 w-5" />
                        </div>
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
                        className="premium-card group rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--brand)] shadow-sm transition-all group-hover:bg-[var(--brand-soft)]">
                          <Code2 className="h-5 w-5" />
                        </div>
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
                      className="btn-secondary rounded-2xl px-4 py-2.5 font-medium"
                    >
                      Copy Blueprint
                    </button>
                    <button
                      onClick={generateBlueprint}
                      disabled={buildStep !== null}
                      className="btn-primary rounded-2xl px-4 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Regenerate
                    </button>
                  </div>

                  {/* Build Status */}
                  {buildStep && (
                    <div className="pt-6 w-full px-6 py-4 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2" style={{ background: buildStep === "done" ? "#10B981" : "linear-gradient(135deg, #635BFF, #4F46E5)", boxShadow: "0 12px 28px var(--brand-glow)", borderTop: "1px solid var(--border)" }}>
                      {buildStep !== "done" && <Loader2 className="w-5 h-5 animate-spin" />}
                      {buildStep === "analyzing" && "Regenerating blueprint..."}
                      {buildStep === "logic" && "Building business logic..."}
                      {buildStep === "styling" &&
                        `Applying ${VISUAL_THEMES.find((t) => t.id === panelToolTheme)?.name ?? "Modern"} theme...`}
                      {buildStep === "embed" && "Preparing embed code..."}
                      {buildStep === "done" && (buildMode === "standalone" ? "Standalone page ready!" : "Embeddable widget ready!")}
                    </div>
                  )}

                  {/* Download/Copy Actions - Shown after successful build */}
                  {selectedTool.html_content && !buildStep && buildMode !== null && (
                    <div className="pt-6 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                      {/* Success Message */}
                      <div className="px-4 py-3 rounded-2xl text-center font-medium" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                        Business asset built successfully!
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
                <div className="space-y-5">
                  <div
                    className="rounded-[22px] border border-[var(--border)] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
                    style={{ background: "var(--bg-soft, #f3f4f6)" }}
                  >
                    <p
                      className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: "var(--text-muted)" }}
                    >
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
                            <h4 className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                              {variation.title}
                            </h4>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div
                                className="mb-2 flex items-center gap-1.5 text-xs font-medium"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <Users className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                Audience
                              </div>
                              <div className="relative">
                                <select
                                  value={variation.audience}
                                  onChange={(e) => variation.setAudience(e.target.value)}
                                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 pr-9 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-[var(--brand)]/25"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {audienceOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                                  style={{ color: "var(--text-muted)" }}
                                  aria-hidden
                                />
                              </div>
                            </div>

                            <div>
                              <div
                                className="mb-2 flex items-center gap-1.5 text-xs font-medium"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <DollarSign className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                Monetization
                              </div>
                              <div className="relative">
                                <select
                                  value={variation.monetization}
                                  onChange={(e) => variation.setMonetization(e.target.value)}
                                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 pr-9 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-[var(--brand)]/25"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {monetizationOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                                  style={{ color: "var(--text-muted)" }}
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
                      className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                      style={{ backgroundColor: "#ff6b21" }}
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
                    <div className="premium-card rounded-[28px] p-5">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--brand)" }}>
                            AI comparison
                          </p>
                          <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                            Choose the strongest business angle
                          </h3>
                        </div>
                        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold shadow-sm" style={{ color: "var(--text-muted)" }}>
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
                              className="overflow-hidden rounded-[24px] border bg-white/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                              style={{ borderColor: isExpanded ? setup.ring : "var(--border)" }}
                            >
                              <button
                                onClick={() => setExpandedVariation(isExpanded ? null : index)}
                                className="w-full p-4 text-left transition-all hover:bg-[var(--bg-soft)]"
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
                                        <span className="rounded-full bg-[var(--bg-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                          {setup.monetization}
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                        {setup.title}: {variation.title || "Monetization Strategy"}
                                      </h4>
                                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        {variation.summary || variation.purpose || "AI-generated strategy blueprint tailored to this audience and monetization path."}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
                                </div>
                              </button>

                              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                                {[
                                  ["Traffic", "SEO-led"],
                                  ["Capture", "Lead-first"],
                                  ["Revenue", "Offer-fit"],
                                ].map(([label, value]) => (
                                  <div key={label} className="rounded-2xl bg-[var(--bg-soft)] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                                    <p className="mt-1 text-xs font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                                  </div>
                                ))}
                              </div>

                              {isExpanded && (
                                <div className="space-y-4 border-t border-[var(--border)] px-4 pb-4 pt-4">
                                  <div className="rounded-2xl bg-[var(--bg-soft)] p-4">
                                    <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
                                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                                      Strategy purpose
                                    </h5>
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                      {variation.purpose || "Not specified"}
                                    </p>
                                  </div>

                                  {keywords.length > 0 && (
                                    <div>
                                      <h5 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                        Search opportunities
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {keywords.map((keyword: string, idx: number) => (
                                          <span key={idx} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                                            {keyword}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                        <DollarSign className="h-4 w-4" style={{ color: setup.accent }} />
                                        Monetization
                                      </h5>
                                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                        {variation.monetization_strategy || "Not specified"}
                                      </p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                        <Target className="h-4 w-4" style={{ color: setup.accent }} />
                                        Conversion CTA
                                      </h5>
                                      <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                                        {variation.cta_text || variation.call_to_action || "Not specified"}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => useThisBlueprint(index)}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                                    style={{ background: `linear-gradient(135deg, ${setup.accent}, #111827)` }}
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
                <>
                  <div className="premium-card space-y-6 rounded-3xl p-5">
                    {/* Header */}
                    <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--brand)] shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                        Landing Page Generator
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        Generate a complete, production-ready SaaS landing page with premium hero, interactive business asset, metrics, trust sections, monetization roadmap, FAQ, conversion CTAs, and polished footer.
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
                          This may take 30-60 seconds. Creating a polished conversion page with strategic business logic...
                        </p>
                      </div>
                    )}

                    {/* Success & Actions */}
                    {landingPageHtml && !generatingLanding && (
                      <>
                        <div className="px-4 py-3 rounded-2xl text-center font-medium" style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D" }}>
                          Landing page built successfully!
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={downloadLandingPage}
                              className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold"
                            >
                              <Download className="w-4 h-4" />
                              Download HTML file
                            </button>
                            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                              Upload via FTP — works as a standalone page on any web host
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={copyLandingPageCode}
                            className="btn-secondary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold"
                          >
                            <Code2 className="w-4 h-4" />
                            Copy code
                          </button>
                          <button
                            type="button"
                            onClick={goBackFromLandingPanel}
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
                              background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                              boxShadow: "0 0 20px var(--brand-glow)",
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate
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
                    className="btn-primary w-full rounded-2xl px-6 py-4 font-semibold disabled:opacity-50"
                  >
                    {buildStep === "analyzing" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
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
