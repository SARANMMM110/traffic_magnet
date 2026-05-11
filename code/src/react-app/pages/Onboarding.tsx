import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Check, Key, Eye, EyeOff, ExternalLink, Sparkles, Target, Bolt, TrendingUp, Copy } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Provider = "openai" | "anthropic" | null;

const NICHE_TEMPLATES = [
  { emoji: "🔍", name: "SEO Agency", value: "SEO agency" },
  { emoji: "💰", name: "Affiliate Marketing", value: "affiliate marketing" },
  { emoji: "💼", name: "SaaS Product", value: "SaaS product" },
  { emoji: "💪", name: "Health & Fitness", value: "health and fitness" },
  { emoji: "📊", name: "Personal Finance", value: "personal finance" },
  { emoji: "🛒", name: "E-Commerce", value: "e-commerce" },
];

const GOALS = [
  { value: "backlinks", label: "Drive Backlinks" },
  { value: "leads", label: "Generate Leads" },
  { value: "traffic", label: "Increase Traffic" },
  { value: "engagement", label: "Improve Engagement" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Step 1 state
  const [provider, setProvider] = useState<Provider>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  
  // Step 3 state
  const [niche, setNiche] = useState("");
  const [projectName, setProjectName] = useState("");
  const [goal, setGoal] = useState("traffic");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Step 4 state
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Step 5 state
  const [buildingTool, setBuildingTool] = useState(false);
  const [builtTool, setBuiltTool] = useState<any>(null);
  
  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const response = await fetch("/api/settings/keys", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setHasApiKey(!!(data.openai_key || data.anthropic_key));
      }
    } catch (error) {
      console.error("Failed to check API key:", error);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    
    setSavingKey(true);
    try {
      const response = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          openai_key: provider === "openai" ? apiKey : null,
          anthropic_key: provider === "anthropic" ? apiKey : null,
        }),
      });

      if (response.ok) {
        setHasApiKey(true);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Failed to save key:", error);
    } finally {
      setSavingKey(false);
    }
  };

  const handleCreateProject = async () => {
    if (!niche.trim()) return;
    
    setCreatingProject(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          niche: niche.trim(),
          name: projectName.trim() || `${niche.trim()} Project`,
          goal: goal || null,
          audience: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjectId(data.id);
        setCurrentStep(4);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!projectId) return;
    
    setGeneratingIdeas(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/discover`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIdeas(data.tools.slice(0, 3));
        setGeneratingIdeas(false);
      }
    } catch (error) {
      console.error("Failed to generate ideas:", error);
      setGeneratingIdeas(false);
    }
  };

  const handleBuildTool = async () => {
    if (!ideas[0]) return;
    
    setBuildingTool(true);
    try {
      // Generate blueprint
      await fetch(`/api/tools/${ideas[0].id}/blueprint`, {
        method: "POST",
        credentials: "include",
      });

      // Generate HTML
      const htmlResponse = await fetch(`/api/tools/${ideas[0].id}/html`, {
        method: "POST",
        credentials: "include",
      });

      if (htmlResponse.ok) {
        const toolData = await htmlResponse.json();
        setBuiltTool(toolData);
        setCurrentStep(6);
      }
    } catch (error) {
      console.error("Failed to build tool:", error);
    } finally {
      setBuildingTool(false);
    }
  };

  const getEmbedCode = () => {
    if (!builtTool) return "";
    return `<iframe src="https://yourdomain.com/tools/${builtTool.id}.html" width="100%" height="500" frameborder="0"></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Progress Bar */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto px-8 py-6">
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Step {currentStep} of 6
          </p>
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step < currentStep
                        ? "border-transparent"
                        : step === currentStep
                        ? "border-4 animate-pulse"
                        : ""
                    }`}
                    style={{
                      background: step <= currentStep ? "var(--brand)" : "var(--bg-elevated)",
                      borderColor: step === currentStep ? "var(--brand-glow)" : "var(--border)",
                    }}
                  >
                    {step < currentStep ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span
                        className="text-sm font-bold"
                        style={{ color: step <= currentStep ? "white" : "var(--text-muted)" }}
                      >
                        {step}
                      </span>
                    )}
                  </div>
                </div>
                {step < 6 && (
                  <div
                    className="flex-1 h-0.5 mx-2"
                    style={{ background: step < currentStep ? "var(--brand)" : "var(--border)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[620px] mx-auto px-4 py-12">
        {/* Step 1: Add API Key */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl relative"
                style={{ background: "rgba(124, 92, 252, 0.15)" }}
              >
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-50"
                  style={{ background: "var(--brand)" }}
                />
                <Key className="w-10 h-10 relative z-10" style={{ color: "var(--brand)" }} />
              </div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Power up your account
              </h1>
              <p className="text-base max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                Magnet Lab uses AI to generate tool ideas and build working HTML tools. You need your
                own OpenAI or Anthropic API key — it takes 2 minutes and costs almost nothing to
                generate a tool.
              </p>
            </div>

            {/* Provider Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setProvider("openai")}
                className="glass-card p-6 text-left transition-all"
                style={{
                  borderColor: provider === "openai" ? "var(--brand)" : "var(--glass-border)",
                  background: provider === "openai" ? "var(--brand-glow)" : "var(--glass-bg)",
                }}
              >
                <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center bg-black">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  OpenAI
                </h3>
                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  GPT-4o
                </p>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "var(--accent-green)", color: "white" }}
                >
                  Most popular
                </span>
              </button>

              <button
                onClick={() => setProvider("anthropic")}
                className="glass-card p-6 text-left transition-all"
                style={{
                  borderColor: provider === "anthropic" ? "var(--brand)" : "var(--glass-border)",
                  background: provider === "anthropic" ? "var(--brand-glow)" : "var(--glass-bg)",
                }}
              >
                <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
                  <span className="text-white font-bold">A</span>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Anthropic
                </h3>
                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Claude 3.5
                </p>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                >
                  Alternative
                </span>
              </button>
            </div>

            {/* API Key Input */}
            {provider && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Paste your API key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
                      className="w-full px-4 py-3 pr-12 rounded-xl transition-all"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Keys are encrypted and stored only for your account
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={
                      provider === "openai"
                        ? "https://platform.openai.com/api-keys"
                        : "https://console.anthropic.com"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                    style={{ color: "var(--brand)" }}
                  >
                    Get {provider === "openai" ? "OpenAI" : "Anthropic"} Key
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim() || savingKey}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                    boxShadow: "0 0 20px var(--brand-glow)",
                  }}
                >
                  {savingKey ? "Saving..." : "Save Key & Continue →"}
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-sm hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                I'll add this later
              </button>
            </div>
          </div>
        )}

        {/* Step 2: How It Works */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Here's how Magnet Lab works
              </h1>
              <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                You're about to build a traffic machine. Here's the 3-step loop:
              </p>
            </div>

            {/* Flow Diagram */}
            <div className="space-y-4">
              <div className="glass-card p-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124, 92, 252, 0.15)" }}
                >
                  <Target className="w-6 h-6" style={{ color: "var(--brand)" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  🎯 Pick a Niche
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Tell us your market — SEO, fitness, finance, etc.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-px h-8" style={{ background: "var(--border)" }} />
              </div>

              <div className="glass-card p-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(245, 158, 11, 0.15)" }}
                >
                  <Bolt className="w-6 h-6" style={{ color: "var(--accent-amber)" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  ⚡ AI Finds Opportunities
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  AI scans your niche for tool ideas nobody has built yet
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-px h-8" style={{ background: "var(--border)" }} />
              </div>

              <div className="glass-card p-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0, 208, 132, 0.15)" }}
                >
                  <TrendingUp className="w-6 h-6" style={{ color: "var(--accent-green)" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  🔨 Build & Deploy
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  AI writes the HTML. You embed it. Google sends traffic.
                </p>
              </div>
            </div>

            {/* Pro Tip */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                <strong>💡 Pro tip:</strong> You don't win one big keyword. You win dozens of small
                ones. Each tool targets a specific search. They stack. Traffic compounds every month.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep(3)}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                boxShadow: "0 0 20px var(--brand-glow)",
              }}
            >
              Got it, let's build →
            </button>
          </div>
        )}

        {/* Step 3: Create First Project */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Start with a niche
              </h1>
              <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                A project groups all your tool ideas for one topic or market.
              </p>
            </div>

            {/* Niche Templates */}
            <div className="grid grid-cols-2 gap-3">
              {NICHE_TEMPLATES.map((template, i) => (
                <button
                  key={i}
                  onClick={() => setNiche(template.value)}
                  className="glass-card p-4 text-left hover:scale-105 transition-all"
                >
                  <div className="text-2xl mb-2">{template.emoji}</div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {template.name}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Niche Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Or describe your own niche...
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., Email marketing for SaaS"
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Project name (auto-generated if blank)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={niche ? `${niche} Project` : "My Project"}
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Goal Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateProject}
              disabled={!niche.trim() || creatingProject}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                boxShadow: "0 0 20px var(--brand-glow)",
              }}
            >
              {creatingProject ? "Creating..." : "Create Project →"}
            </button>
          </div>
        )}

        {/* Step 4: Generate Ideas */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Let AI find your best opportunities
              </h1>
              <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                We'll scan your niche and return the top tool ideas ranked by traffic potential.
              </p>
            </div>

            {/* Project Summary */}
            <div className="glass-card p-6 space-y-2">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Project
              </p>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {projectName || `${niche} Project`}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Niche: {niche}
              </p>
            </div>

            {!hasApiKey && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  ⚠️ Add your API key in Step 1 to unlock AI generation
                </p>
              </div>
            )}

            {hasApiKey && ideas.length === 0 && (
              <button
                onClick={handleGenerateIdeas}
                disabled={generatingIdeas}
                className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                  boxShadow: "0 0 20px var(--brand-glow)",
                }}
              >
                {generatingIdeas ? "⚡ Analyzing your niche..." : "⚡ Generate My Tool Ideas"}
              </button>
            )}

            {ideas.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Top 3 ideas:
                </p>
                {ideas.map((idea, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {idea.name}
                      </h4>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: "rgba(124, 92, 252, 0.15)",
                          color: "var(--brand)",
                        }}
                      >
                        {idea.score}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {idea.category}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => setCurrentStep(5)}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                    boxShadow: "0 0 20px var(--brand-glow)",
                  }}
                >
                  See All Ideas →
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                I'll explore projects manually
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Build First Tool */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Build your first real tool
              </h1>
              <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                Pick one idea and AI will write a complete working HTML calculator or tool.
              </p>
            </div>

            {ideas[0] && (
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      {ideas[0].name}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                      {ideas[0].category}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      background: "rgba(124, 92, 252, 0.15)",
                      color: "var(--brand)",
                    }}
                  >
                    Score: {ideas[0].score}
                  </span>
                </div>
                <div
                  className="p-4 rounded-lg"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                    Why this works:
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    High search volume with low competition. Perfect for ranking quickly and
                    attracting backlinks.
                  </p>
                </div>
              </div>
            )}

            {!buildingTool && !builtTool && (
              <button
                onClick={handleBuildTool}
                className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                  boxShadow: "0 0 20px var(--brand-glow)",
                }}
              >
                🔨 Build This Tool
              </button>
            )}

            {buildingTool && (
              <div className="text-center space-y-3">
                <div className="inline-block w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Writing the calculator logic... Adding mobile styling... Generating embed code...
                </p>
              </div>
            )}

            {builtTool && (
              <div className="space-y-4">
                <div
                  className="rounded-xl p-6 text-center space-y-3"
                  style={{ background: "rgba(0, 208, 132, 0.1)", border: "1px solid rgba(0, 208, 132, 0.3)" }}
                >
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--accent-green)" }}>
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    Tool built successfully!
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(6)}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                    boxShadow: "0 0 20px var(--brand-glow)",
                  }}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Deploy */}
        {currentStep === 6 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Your tool is ready. Put it on your site.
              </h1>
              <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                Copy the embed code below and paste it anywhere on your website.
              </p>
            </div>

            {/* Embed Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Embed Code
                </label>
                <button
                  onClick={copyEmbedCode}
                  className="flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <div
                className="p-4 rounded-xl font-mono text-xs overflow-x-auto"
                style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
              >
                <pre>{getEmbedCode()}</pre>
              </div>
            </div>

            {/* Deployment Tabs */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Quick deploy guides:
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    WordPress
                  </p>
                  <ol className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                    <li>1. Edit your page or post</li>
                    <li>2. Add a "Custom HTML" block</li>
                    <li>3. Paste the embed code</li>
                  </ol>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Plain HTML
                  </p>
                  <ol className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                    <li>1. Open your HTML file</li>
                    <li>2. Paste the iframe code where you want it</li>
                    <li>3. Save and upload</li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                boxShadow: "0 0 20px var(--brand-glow)",
              }}
            >
              🎉 Go to My Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
