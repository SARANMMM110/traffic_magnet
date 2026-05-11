import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { NICHE_TEMPLATES } from "@/react-app/data/niches";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Link2,
  Mail,
  TrendingUp,
  MessageCircle,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

const getNicheColor = (index: number): string => {
  const colors = [
    "#A855F7", "#F97316", "#3B82F6", "#10B981", "#EC4899", "#6366F1",
    "#059669", "#8B5CF6", "#F59E0B", "#F43F5E", "#14B8A6", "#64748B",
    "#F97316", "#EF4444", "#84CC16", "#06B6D4",
  ];
  return colors[index % colors.length];
};

const GOALS = [
  {
    value: "backlinks",
    icon: Link2,
    label: "Drive Backlinks",
    description: "Get other websites to link to yours",
  },
  {
    value: "leads",
    icon: Mail,
    label: "Generate Leads",
    description: "Capture email addresses and contacts",
  },
  {
    value: "traffic",
    icon: TrendingUp,
    label: "Increase Traffic",
    description: "Maximize organic search visitors",
  },
  {
    value: "engagement",
    icon: MessageCircle,
    label: "Improve Engagement",
    description: "Keep visitors on your site longer",
  },
];

export default function NewProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [expandedNiche, setExpandedNiche] = useState<number | null>(null);
  
  // Check if we came from niche selector
  const locationState = location.state as { niche?: string; subTopic?: string } | null;
  const initialNiche = locationState?.subTopic 
    ? `${locationState.niche} - ${locationState.subTopic}`
    : locationState?.niche || "";
  
  const [niche, setNiche] = useState(initialNiche);
  const [projectName, setProjectName] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [usage, setUsage] = useState({ projects: 0, limit: 3 });
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keysRes, usageRes] = await Promise.all([
        fetch("/api/settings/keys", { credentials: "include" }),
        fetch("/api/usage", { credentials: "include" }),
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setHasApiKey(!!(keysData.openai_key || keysData.anthropic_key));
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage({ projects: usageData.projects, limit: usageData.limit });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleNicheClick = (index: number) => {
    setExpandedNiche(expandedNiche === index ? null : index);
  };

  const handleSubTopicClick = (subTopic: string, nicheTemplate: any) => {
    setNiche(subTopic);
    setExpandedNiche(null);
    setGalleryOpen(false);
    
    // Auto-populate project name
    setProjectName(`${subTopic} Traffic Magnets`);
    
    // Auto-suggest goal based on niche characteristics
    let suggestedGoal = "traffic"; // default
    if (nicheTemplate.profitable) {
      suggestedGoal = "leads";
    } else if (nicheTemplate.trending) {
      suggestedGoal = "engagement";
    }
    // Special cases
    if (nicheTemplate.title.includes("SEO") || nicheTemplate.title.includes("Link")) {
      suggestedGoal = "backlinks";
    }
    setGoal(suggestedGoal);
    
    // Auto-suggest audience based on niche
    const audienceMap: { [key: string]: string } = {
      "SEO Agency": "SEO professionals, digital marketing agencies, website owners",
      "Affiliate Marketing": "affiliate marketers, content creators, online publishers",
      "SaaS Product": "SaaS founders, product managers, startup teams",
      "Real Estate": "real estate investors, property buyers, agents and brokers",
      "Health & Fitness": "fitness enthusiasts, personal trainers, health-conscious individuals",
      "B2B / Lead Gen": "B2B marketers, sales teams, business development professionals",
      "Finance & Investing": "investors, financial advisors, personal finance enthusiasts",
      "E-Learning / EdTech": "educators, course creators, students and learners",
      "E-Commerce": "online store owners, dropshippers, e-commerce entrepreneurs",
      "Pet Care": "pet owners, veterinarians, pet care professionals",
      "Personal Finance": "individuals managing personal budgets, debt-free seekers",
      "Legal / Immigration": "immigrants, visa applicants, legal professionals",
      "Home Improvement": "homeowners, contractors, DIY enthusiasts",
      "Relationships": "couples, singles seeking compatibility insights",
      "Food & Nutrition": "health-conscious eaters, recipe enthusiasts, nutritionists",
      "Travel & Expat": "travelers, digital nomads, expats and relocators",
    };
    
    setAudience(audienceMap[nicheTemplate.title] || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!niche.trim() || !hasApiKey) return;

    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          niche: niche.trim(),
          name: projectName.trim() || `${niche.trim()} Project`,
          goal: goal || null,
          audience: audience.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast({
          type: "success",
          title: "Project created!",
          message: "AI is now discovering traffic magnet ideas...",
        });
        
        // Trigger AI discovery and wait for completion
        const discoverResponse = await fetch(`/api/projects/${data.id}/discover`, {
          method: "POST",
          credentials: "include",
        });

        if (!discoverResponse.ok) {
          const error = await discoverResponse.json().catch(() => ({}));
          const errorMessage = error.error || error.details || "Could not discover tools";
          console.error("Discovery error:", error);
          showToast({
            type: "error",
            title: "Discovery failed",
            message: errorMessage,
          });
          setLoading(false);
          return;
        }

        const discoverData = await discoverResponse.json();
        showToast({
          type: "success",
          title: "Discovery complete!",
          message: `Generated ${discoverData.toolCount || 0} traffic magnets`,
        });
        
        // Wait a bit to ensure database writes complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        navigate('/dashboard');
      } else {
        const error = await response.json();
        showToast({
          type: "error",
          title: "Creation failed",
          message: error.error || "Could not create project",
        });
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAtLimit = usage.projects >= usage.limit;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[720px] mx-auto">
        {/* Header */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 mb-4 text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Create Traffic Magnet Project
        </h1>
        <p className="text-base mb-8" style={{ color: "var(--text-muted)" }}>
          Tell us your niche and we'll discover your best traffic magnet opportunities.
        </p>

        {/* Hint if coming from niche selector */}
        {locationState?.niche && (
          <div
            className="mb-6 p-4 rounded-xl flex items-start gap-3"
            style={{
              background: "rgba(124, 92, 252, 0.1)",
              border: "1px solid rgba(124, 92, 252, 0.3)",
            }}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Selected: {locationState.niche} {locationState.subTopic && `→ ${locationState.subTopic}`}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                You can edit the niche below or continue with this selection.
              </p>
            </div>
          </div>
        )}

        {/* Niche Template Gallery */}
        <div className="mb-8">
          <button
            onClick={() => setGalleryOpen(!galleryOpen)}
            className="w-full flex items-center justify-between p-4 rounded-xl transition-all mb-4"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--brand)" }} />
              Start from a template
              <span className="ml-3" style={{ color: "var(--text-muted)" }}>
                16 niches
              </span>
            </span>
            {galleryOpen ? (
              <ChevronUp className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            )}
          </button>

          {galleryOpen && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {NICHE_TEMPLATES.map((template, index) => (
                  <div key={template.id} className="space-y-2">
                    <button
                      onClick={() => handleNicheClick(template.id)}
                      className="w-full glass-card p-4 text-left hover:scale-105 transition-all"
                    >
                      <div className="text-2xl mb-2">{template.emoji}</div>
                      <h3
                        className="font-semibold mb-1 text-sm"
                        style={{ color: getNicheColor(index) }}
                      >
                        {template.title}
                      </h3>
                      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                        {template.description}
                      </p>
                      <p className="text-xs" style={{ color: getNicheColor(index) }}>
                        ↓ {template.subTopics.length} sub-topics
                      </p>
                    </button>

                    {expandedNiche === template.id && (
                      <div className="space-y-1 animate-fade-in-up">
                        {template.subTopics.map((subTopic, subIndex) => (
                          <button
                            key={subIndex}
                            onClick={() => handleSubTopicClick(subTopic, template)}
                            className="w-full px-3 py-2 rounded-lg text-left text-sm transition-all hover:brightness-110"
                            style={{
                              background: `${getNicheColor(index)}20`,
                              color: getNicheColor(index),
                            }}
                          >
                            {subTopic}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-center text-sm italic" style={{ color: "var(--text-muted)" }}>
                Click a niche to expand sub-topics, or write your own below.
              </p>
            </div>
          )}
        </div>

        {/* Project Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          {/* Niche */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Niche <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value.slice(0, 120))}
              placeholder="e.g. Email marketing, Fitness coaching, SaaS tools..."
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              required
            />
            <div className="flex justify-end">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {niche.length}/120
              </span>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Project Name (optional)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Email Marketing Traffic Assets"
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
            />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Auto-generated from your niche if left blank
            </p>
          </div>

          {/* Primary Goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Primary Goal (optional)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: goal ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <span>
                  {goal
                    ? GOALS.find((g) => g.value === goal)?.label
                    : "Select a goal..."}
                </span>
                <ChevronDown className="w-5 h-5" />
              </button>

              {goalDropdownOpen && (
                <div
                  className="absolute z-10 w-full mt-2 rounded-xl overflow-hidden"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  {GOALS.map((goalOption) => {
                    const Icon = goalOption.icon;
                    return (
                      <button
                        key={goalOption.value}
                        type="button"
                        onClick={() => {
                          setGoal(goalOption.value);
                          setGoalDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-start gap-3 hover:brightness-110 transition-all"
                        style={{
                          background:
                            goal === goalOption.value ? "var(--brand-glow)" : "transparent",
                        }}
                      >
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--brand)" }} />
                        <div>
                          <p className="font-medium text-white text-sm">
                            {goalOption.label}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {goalOption.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Target Audience (optional)
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Small business owners, freelancers, SaaS founders..."
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Error Banner */}
          {isAtLimit && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">
                  ⊗ You have used all your Traffic Magnets. Upgrade your plan to create more
                  projects.
                </p>
                <Link
                  to="/settings"
                  className="text-sm font-medium mt-1 inline-block hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  Upgrade Plan →
                </Link>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!hasApiKey ? (
            <Link to="/settings" className="block">
              <button
                type="button"
                className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                }}
              >
                ⚠ Add API Key in Settings First
              </button>
            </Link>
          ) : (
            <button
              type="submit"
              disabled={loading || isAtLimit || !niche.trim()}
              className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                boxShadow: "0 0 20px var(--brand-glow)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your niche...
                </span>
              ) : (
                "⚡ Discover Traffic Magnets"
              )}
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="mt-16 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Our Other Apps</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>AI Agent Factory <span style={{ color: "var(--accent-amber)" }}>(Coming Soon!)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Free SEO Tools</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>AI Bot Checker</li>
                <li>Traffic Magnets Opportunity Finder</li>
                <li>TM Keyword Intelligence</li>
                <li>Rank New Websites Fast!</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Free Traffic Tools</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>HookViral</li>
                <li>AI Writing Studio</li>
                <li>VidOptima</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Free Marketing Tools</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>HookViral</li>
                <li>AI Writing Studio</li>
                <li>VidOptima</li>
                <li>Hormozi Landing Page Pro</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              ⚡ Magnet Lab App by VibeLabs © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
