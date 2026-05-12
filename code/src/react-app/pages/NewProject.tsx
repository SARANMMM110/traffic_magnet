import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import { NICHE_TEMPLATES } from "@/react-app/data/niches";
import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  Link2,
  Mail,
  MessageCircle,
  PawPrint,
  Plane,
  Scale,
  Search,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Utensils,
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

const NICHE_ICONS = [
  Search,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  Dumbbell,
  TrendingUp,
  BadgeDollarSign,
  GraduationCap,
  ShoppingBag,
  PawPrint,
  BadgeDollarSign,
  Scale,
  Home,
  HeartPulse,
  Utensils,
  Plane,
];

const getNicheIcon = (index: number) => NICHE_ICONS[index % NICHE_ICONS.length];

const SUBTOPIC_ICONS = [Search, Link2, Sparkles, Building2, ShoppingBag, TrendingUp];

const SUBTOPIC_DESCRIPTIONS: Record<string, string> = {
  "Technical SEO": "Site speed, crawl budget and Core Web Vitals tools.",
  "Link Building": "Backlink value, anchor text and outreach calculators.",
  "Content SEO": "Content gap analysis and keyword difficulty helpers.",
  "Local SEO": "Local rankings, citation score and map visibility tools.",
  "E-Commerce SEO": "Product schema, silo structure and category SEO tools.",
};

const getSubTopicDescription = (subTopic: string, nicheTitle: string) => {
  return SUBTOPIC_DESCRIPTIONS[subTopic] || `${subTopic} calculators, checkers and lead magnets for ${nicheTitle}.`;
};

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
  const expandedTemplate = NICHE_TEMPLATES.find((template) => template.id === expandedNiche);
  const expandedTemplateIndex = expandedTemplate
    ? NICHE_TEMPLATES.findIndex((template) => template.id === expandedTemplate.id)
    : -1;

  return (
    <DashboardLayout>
      <div className="page-shell max-w-[980px]">
        {/* Header */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 mb-5 text-sm font-semibold transition-colors hover:text-[var(--brand)]"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="surface-panel mb-8 p-8">
          <div className="section-eyebrow mb-3">Project Brief</div>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            Create a Traffic Magnet Project
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7" style={{ color: "var(--text-secondary)" }}>
            Define your market, audience, and growth goal. The AI will turn the brief into high-value tool opportunities.
          </p>
        </div>

        {/* Hint if coming from niche selector */}
        {locationState?.niche && (
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl p-4"
            style={{
              background: "var(--brand-soft)",
              border: "1px solid rgba(99, 91, 255, 0.18)",
            }}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Selected: {locationState.niche} {locationState.subTopic && `/ ${locationState.subTopic}`}
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
            className="premium-card mb-4 flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span className="icon-tile h-9 w-9 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </span>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {NICHE_TEMPLATES.map((template, index) => {
                  const NicheIcon = getNicheIcon(index);
                  const isSelected = expandedNiche === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleNicheClick(template.id)}
                      className="flex min-h-[174px] w-full flex-col rounded-3xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      style={{
                        borderColor: isSelected ? getNicheColor(index) : "var(--border)",
                        boxShadow: isSelected ? `0 0 0 3px ${getNicheColor(index)}18` : "var(--shadow-xs)",
                        background: isSelected ? `${getNicheColor(index)}0D` : "rgba(255,255,255,0.9)",
                      }}
                    >
                      <div
                        className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border bg-white shadow-sm"
                        style={{ borderColor: `${getNicheColor(index)}25`, color: getNicheColor(index) }}
                      >
                        <NicheIcon className="h-5 w-5" />
                      </div>
                      <h3
                        className="font-semibold mb-1 text-sm"
                        style={{ color: getNicheColor(index) }}
                      >
                        {template.title}
                      </h3>
                      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                        {template.description}
                      </p>
                      <p className="mt-auto flex items-center gap-1 text-xs font-semibold" style={{ color: getNicheColor(index) }}>
                        {isSelected ? <ChevronUp className="h-3 w-3" /> : null}
                        {template.subTopics.length} sub-topics
                      </p>
                    </button>
                  );
                })}
              </div>

              {expandedTemplate && (
                <div className="animate-fade-in-up rounded-[28px] border border-dashed border-[var(--border-strong)] bg-white/70 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                    <span className="h-5 w-px bg-[var(--border-strong)]" />
                    Pick a sub-topic for {expandedTemplate.title}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {expandedTemplate.subTopics.map((subTopic, subIndex) => {
                      const SubTopicIcon = SUBTOPIC_ICONS[subIndex % SUBTOPIC_ICONS.length];
                      const accent = getNicheColor(expandedTemplateIndex);

                      return (
                        <button
                          key={subTopic}
                          onClick={() => handleSubTopicClick(subTopic, expandedTemplate)}
                          className="min-h-[122px] rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                          style={{
                            borderColor: `${accent}35`,
                            background: `${accent}0A`,
                          }}
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm" style={{ color: accent }}>
                            <SubTopicIcon className="h-4 w-4" />
                          </div>
                          <h4 className="mb-1 text-sm font-bold" style={{ color: accent }}>
                            {subTopic}
                          </h4>
                          <p className="line-clamp-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
                            {getSubTopicDescription(subTopic, expandedTemplate.title)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-center text-sm italic" style={{ color: "var(--text-muted)" }}>
                Click a niche to expand sub-topics, or write your own below.
              </p>
            </div>
          )}
        </div>

        {/* Project Form */}
        <form onSubmit={handleSubmit} className="premium-card space-y-6 p-8">
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
              className="input-premium w-full px-4 py-3 transition-all"
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
              className="input-premium w-full px-4 py-3 transition-all"
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
                className="input-premium flex w-full items-center justify-between px-4 py-3 text-left transition-all"
                style={{
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
                  className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl shadow-xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.96)",
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
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-all hover:bg-[var(--bg-overlay)]"
                        style={{
                          background:
                            goal === goalOption.value ? "var(--brand-glow)" : "transparent",
                        }}
                      >
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--brand)" }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Target Audience (optional)
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Small business owners, freelancers, SaaS founders..."
              className="input-premium w-full px-4 py-3 transition-all"
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
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  You have used all your Traffic Magnets. Upgrade your plan to create more
                  projects.
                </p>
                <Link
                  to="/settings"
                  className="text-sm font-medium mt-1 inline-block hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  Upgrade Plan
                </Link>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!hasApiKey ? (
            <Link to="/settings" className="block">
              <button
                type="button"
                className="w-full rounded-2xl px-6 py-4 font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                }}
              >
                Add API Key in Settings First
              </button>
            </Link>
          ) : (
            <button
              type="submit"
              disabled={loading || isAtLimit || !niche.trim()}
              className="btn-primary w-full rounded-2xl px-6 py-4 font-semibold disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your niche...
                </span>
              ) : (
                "Discover Traffic Magnets"
              )}
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="premium-footer mt-12 p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Our Other Apps</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>AI Agent Factory <span style={{ color: "var(--accent-amber)" }}>(Coming Soon!)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Free SEO Tools</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>AI Bot Checker</li>
                <li>Traffic Magnets Opportunity Finder</li>
                <li>TM Keyword Intelligence</li>
                <li>Rank New Websites Fast!</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Free Traffic Tools</h4>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li>HookViral</li>
                <li>AI Writing Studio</li>
                <li>VidOptima</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Free Marketing Tools</h4>
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
              Traffic Magnet by VibeLabs © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
