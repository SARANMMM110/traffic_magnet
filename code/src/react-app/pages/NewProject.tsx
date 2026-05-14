import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  Users,
  Loader2,
  ChevronRight,
  Link2,
  Mail,
  MessageCircle,
  Clock,
  Award,
  Rocket,
  Globe,
  ShoppingCart,
  Briefcase,
  GraduationCap,
  Home,
  Repeat,
} from "lucide-react";

interface OpportunityType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  potential: "High" | "Medium" | "Strong";
  monetization: string;
  trafficScore: number;
  categories: string[];
  audience: string;
}

const OPPORTUNITIES: OpportunityType[] = [
  {
    id: "ai-seo",
    title: "AI Traffic Systems",
    description: "SEO intelligence, keyword strategy, and organic growth engines for traffic acquisition",
    icon: TrendingUp,
    gradient: "from-purple-500 via-purple-600 to-indigo-600",
    potential: "High",
    monetization: "Backlinks & Affiliates",
    trafficScore: 95,
    categories: [
      "Search Intent Intelligence",
      "Topical Authority Systems",
      "AI Content Optimization",
      "Competitor Traffic Analysis",
      "Local SEO Growth",
    ],
    audience: "SEO operators, content teams, niche site builders",
  },
  {
    id: "affiliate",
    title: "Affiliate Revenue Engines",
    description: "Buyer intent analysis, commission optimization, and monetization funnels",
    icon: DollarSign,
    gradient: "from-emerald-500 via-green-600 to-teal-600",
    potential: "High",
    monetization: "High Commission Potential",
    trafficScore: 92,
    categories: [
      "Buyer Intent Analysis",
      "Product Comparison Funnels",
      "Commission Optimization",
      "Affiliate SEO Systems",
      "Review Funnel Assets",
    ],
    audience: "Affiliate marketers, review publishers, niche site owners",
  },
  {
    id: "creator",
    title: "Creator Monetization",
    description: "Audience growth, engagement tools, and creator economy infrastructure",
    icon: Sparkles,
    gradient: "from-pink-500 via-rose-600 to-red-600",
    potential: "Strong",
    monetization: "Leads & Engagement",
    trafficScore: 88,
    categories: [
      "Audience Growth Systems",
      "Engagement Assets",
      "Email List Building",
      "Creator Brand Tools",
      "Community Intelligence",
    ],
    audience: "Creators, coaches, influencers, solo brands",
  },
  {
    id: "saas",
    title: "SaaS Growth Intelligence",
    description: "Product-led growth, conversion optimization, and startup analytics systems",
    icon: Rocket,
    gradient: "from-blue-500 via-indigo-600 to-violet-600",
    potential: "High",
    monetization: "Qualified Leads",
    trafficScore: 90,
    categories: [
      "PLG Strategy Tools",
      "Conversion Intelligence",
      "Growth Analytics",
      "Onboarding Optimization",
      "Retention Systems",
    ],
    audience: "SaaS founders, growth teams, product marketers",
  },
  {
    id: "ecommerce",
    title: "E-Commerce Systems",
    description: "Store optimization, product discovery, and revenue growth engines",
    icon: ShoppingCart,
    gradient: "from-orange-500 via-amber-600 to-yellow-600",
    potential: "Strong",
    monetization: "Affiliate & Traffic",
    trafficScore: 85,
    categories: [
      "Product Research Tools",
      "Store Analytics",
      "Conversion Funnels",
      "Customer Intelligence",
      "Revenue Optimization",
    ],
    audience: "Shopify brands, DTC teams, marketplace sellers",
  },
  {
    id: "lead-gen",
    title: "Lead Generation Engines",
    description: "B2B acquisition, qualification systems, and pipeline intelligence",
    icon: Target,
    gradient: "from-cyan-500 via-blue-600 to-indigo-600",
    potential: "High",
    monetization: "High-Value Leads",
    trafficScore: 93,
    categories: [
      "Lead Qualification",
      "Pipeline Intelligence",
      "Outreach Systems",
      "Conversion Tracking",
      "B2B Growth Tools",
    ],
    audience: "B2B founders, agencies, consultants",
  },
  {
    id: "viral",
    title: "Viral Interactive Tools",
    description: "Engagement assets, social discovery, and community-driven growth",
    icon: Zap,
    gradient: "from-fuchsia-500 via-purple-600 to-pink-600",
    potential: "Strong",
    monetization: "Traffic & Engagement",
    trafficScore: 87,
    categories: [
      "Social Tools",
      "Quiz & Assessment Engines",
      "Interactive Calculators",
      "Viral Discovery Assets",
      "Community Systems",
    ],
    audience: "Publishers, creators, social teams",
  },
  {
    id: "local",
    title: "Local Business Growth",
    description: "Local SEO, reputation systems, and service business intelligence",
    icon: Home,
    gradient: "from-lime-500 via-green-600 to-emerald-600",
    potential: "Medium",
    monetization: "Leads & Backlinks",
    trafficScore: 82,
    categories: [
      "Local SEO Tools",
      "Reputation Systems",
      "Service Area Intelligence",
      "Map Pack Optimization",
      "Review Generation",
    ],
    audience: "Local businesses, agencies, franchises",
  },
  {
    id: "digital-product",
    title: "Digital Product Systems",
    description: "Course creation, product launch, and educational content monetization",
    icon: GraduationCap,
    gradient: "from-violet-500 via-purple-600 to-indigo-600",
    potential: "Strong",
    monetization: "Leads & Sales",
    trafficScore: 86,
    categories: [
      "Course Launch Tools",
      "Student Acquisition",
      "Content Intelligence",
      "Pricing Optimization",
      "Educational Systems",
    ],
    audience: "Course creators, educators, coaches",
  },
  {
    id: "agency",
    title: "Agency & Freelance Growth",
    description: "Client acquisition, portfolio systems, and service business tools",
    icon: Briefcase,
    gradient: "from-slate-500 via-gray-600 to-zinc-600",
    potential: "Medium",
    monetization: "Lead Generation",
    trafficScore: 80,
    categories: [
      "Client Discovery",
      "Portfolio Intelligence",
      "Proposal Tools",
      "Service Pricing",
      "Agency Analytics",
    ],
    audience: "Freelancers, agencies, service providers",
  },
  {
    id: "automation",
    title: "AI Automation Business",
    description: "Workflow optimization, no-code systems, and automation consultancy",
    icon: Repeat,
    gradient: "from-sky-500 via-blue-600 to-cyan-600",
    potential: "High",
    monetization: "B2B Leads",
    trafficScore: 89,
    categories: [
      "Workflow Intelligence",
      "Automation Discovery",
      "No-Code Systems",
      "Process Optimization",
      "ROI Calculators",
    ],
    audience: "Automation consultants, operations teams",
  },
  {
    id: "content",
    title: "Content & Publishing",
    description: "Editorial systems, audience analytics, and media monetization",
    icon: Globe,
    gradient: "from-red-500 via-orange-600 to-amber-600",
    potential: "Strong",
    monetization: "Ads & Affiliates",
    trafficScore: 84,
    categories: [
      "Content Analytics",
      "Audience Intelligence",
      "Editorial Tools",
      "Monetization Systems",
      "Distribution Engines",
    ],
    audience: "Publishers, content teams, media brands",
  },
];

const GOALS = [
  { value: "backlinks", icon: Link2, label: "Drive Backlinks", color: "from-blue-500 to-cyan-600" },
  { value: "leads", icon: Mail, label: "Generate Leads", color: "from-emerald-500 to-green-600" },
  { value: "traffic", icon: TrendingUp, label: "Increase Traffic", color: "from-purple-500 to-indigo-600" },
  { value: "engagement", icon: MessageCircle, label: "Boost Engagement", color: "from-pink-500 to-rose-600" },
];

export default function NewProject() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<"discover" | "configure">("discover");
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredOpportunity, setHoveredOpportunity] = useState<string | null>(null);
  
  // Form state
  const [niche, setNiche] = useState("");
  const [projectName, setProjectName] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [usage, setUsage] = useState({ projects: 0, limit: 3 });

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

  const handleOpportunitySelect = (opportunity: OpportunityType) => {
    setSelectedOpportunity(opportunity);
    setAudience(opportunity.audience);
    // Auto-suggest goal based on opportunity
    if (opportunity.monetization.includes("Backlink")) setGoal("backlinks");
    else if (opportunity.monetization.includes("Lead")) setGoal("leads");
    else if (opportunity.monetization.includes("Traffic")) setGoal("traffic");
    else setGoal("engagement");
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (selectedOpportunity) {
      setNiche(`${selectedOpportunity.title} - ${category}`);
      setProjectName(`${category} Growth Engine`);
    }
    setStep("configure");
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
          message: "AI is discovering business opportunities...",
        });
        
        const discoverResponse = await fetch(`/api/projects/${data.id}/discover`, {
          method: "POST",
          credentials: "include",
        });

        if (discoverResponse.ok) {
          const discoverData = await discoverResponse.json();
          showToast({
            type: "success",
            title: "Discovery complete!",
            message: `Generated ${discoverData.toolCount || 0} assets`,
          });
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/dashboard');
        }
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
      showToast({ type: "error", title: "Error", message: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const isAtLimit = usage.projects >= usage.limit;

  if (step === "discover") {
    return (
      <DashboardLayout>
        <div className="min-h-screen pb-16">
          {/* Hero Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.1),transparent_50%)]" />
            
            <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 mb-8 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-200/50 shadow-sm mb-6">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-900">AI Business Studio</span>
                </div>
                
                <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  Discover Your Growth
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Opportunity
                  </span>
                </h1>
                
                <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
                  Select a business model to explore AI-powered asset opportunities.
                  Each system generates traffic, leads, and monetization engines.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900">12 Opportunity Systems</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="font-semibold text-slate-900">60+ Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="font-semibold text-slate-900">AI-Powered Discovery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunity Grid */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPPORTUNITIES.map((opportunity) => {
                const Icon = opportunity.icon;
                const isHovered = hoveredOpportunity === opportunity.id;
                const isSelected = selectedOpportunity?.id === opportunity.id;
                
                return (
                  <button
                    key={opportunity.id}
                    onClick={() => handleOpportunitySelect(opportunity)}
                    onMouseEnter={() => setHoveredOpportunity(opportunity.id)}
                    onMouseLeave={() => setHoveredOpportunity(null)}
                    className={`
                      group relative overflow-hidden rounded-3xl bg-white p-6 text-left
                      border-2 transition-all duration-300
                      ${isSelected 
                        ? 'border-indigo-500 shadow-2xl shadow-indigo-200/50 -translate-y-1' 
                        : 'border-slate-200 hover:border-indigo-300 hover:-translate-y-1 hover:shadow-xl'
                      }
                    `}
                  >
                    {/* Background Gradient Orb */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${opportunity.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500
                    `} />
                    
                    {/* Icon */}
                    <div className="relative mb-4">
                      <div className={`
                        w-16 h-16 rounded-2xl bg-gradient-to-br ${opportunity.gradient}
                        flex items-center justify-center shadow-lg
                        ${isHovered ? 'scale-110' : 'scale-100'} transition-transform duration-300
                      `}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Traffic Score Badge */}
                      <div className="absolute -top-2 -right-2 w-12 h-12 rounded-xl bg-white shadow-lg border-2 border-emerald-500 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-600 leading-none">{opportunity.trafficScore}</div>
                          <div className="text-[9px] font-semibold text-slate-500 uppercase">Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {opportunity.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      {opportunity.description}
                    </p>

                    {/* Metrics */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">Growth Potential</span>
                        <span className={`
                          px-2 py-1 rounded-md font-bold
                          ${opportunity.potential === 'High' ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${opportunity.potential === 'Strong' ? 'bg-blue-100 text-blue-700' : ''}
                          ${opportunity.potential === 'Medium' ? 'bg-amber-100 text-amber-700' : ''}
                        `}>
                          {opportunity.potential}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">Monetization</span>
                        <span className="font-semibold text-slate-700">{opportunity.monetization}</span>
                      </div>
                    </div>

                    {/* Category Count */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-900">
                        {opportunity.categories.length} Categories
                      </span>
                      <ChevronRight className={`
                        w-5 h-5 text-indigo-600
                        ${isHovered ? 'translate-x-1' : 'translate-x-0'} transition-transform
                      `} />
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection Panel */}
          {selectedOpportunity && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in-up">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Panel Header */}
                <div className={`bg-gradient-to-br ${selectedOpportunity.gradient} p-8 text-white`}>
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-semibold">Back to Opportunities</span>
                  </button>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {(() => {
                        const Icon = selectedOpportunity.icon;
                        return <Icon className="w-8 h-8" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-2">{selectedOpportunity.title}</h2>
                      <p className="text-white/90 text-lg">{selectedOpportunity.description}</p>
                    </div>
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="p-8 overflow-y-auto max-h-[60vh]">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Select a Category</h3>
                    <p className="text-sm text-slate-600">Choose the specific asset type you want to build</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedOpportunity.categories.map((category, index) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className="group relative p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 hover:bg-white transition-all text-left hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-10 h-10 rounded-xl bg-gradient-to-br ${selectedOpportunity.gradient}
                            flex items-center justify-center text-white font-bold shadow-md
                          `}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">{category}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              AI-powered {category.toLowerCase()} assets and growth systems
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Configure Step
  return (
    <DashboardLayout>
      <div className="min-h-screen pb-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <button
            onClick={() => setStep("discover")}
            className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Change Opportunity
          </button>

          {/* Selected Path Indicator */}
          {selectedOpportunity && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedOpportunity.gradient} flex items-center justify-center`}>
                  {(() => {
                    const Icon = selectedOpportunity.icon;
                    return <Icon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Selected Path</div>
                  <div className="font-bold text-slate-900">{selectedOpportunity.title}</div>
                </div>
              </div>
              {selectedCategory && (
                <div className="pl-13 text-sm text-slate-600">
                  <span className="font-semibold">Category:</span> {selectedCategory}
                </div>
              )}
            </div>
          )}

          {/* Form Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-3xl blur-3xl opacity-50" />
            
            <form onSubmit={handleSubmit} className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Configure Your Growth Engine</h2>
                <p className="text-slate-600">Customize your business asset generation workspace</p>
              </div>

              {/* Market Opportunity */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    Market Opportunity
                    <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value.slice(0, 120))}
                      placeholder="e.g. AI SEO Traffic Systems - Search Intent Intelligence"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      {niche.length}/120
                    </div>
                  </div>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The specific market niche and category you want to target with AI-generated assets
                </p>
              </div>

              {/* Project Identity */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Project Name
                    <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </span>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Search Intent Intelligence Growth Engine"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Give your project a memorable name, or we'll auto-generate one from your niche
                </p>
              </div>

              {/* Growth Objective */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Primary Growth Objective
                    <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {GOALS.map((goalOption) => {
                      const Icon = goalOption.icon;
                      const isSelected = goal === goalOption.value;
                      
                      return (
                        <button
                          key={goalOption.value}
                          type="button"
                          onClick={() => setGoal(goalOption.value)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-emerald-500 bg-emerald-50' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                            }
                          `}
                        >
                          <div className={`
                            w-10 h-10 rounded-lg bg-gradient-to-br ${goalOption.color}
                            flex items-center justify-center mb-3 shadow-md
                          `}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="font-bold text-slate-900 text-sm">{goalOption.label}</div>
                          
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </label>
              </div>

              {/* Target Audience */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Target Audience
                    <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </span>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. SEO operators, content teams, niche site builders"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Define who will use these business assets and benefit from the growth systems
                </p>
              </div>

              {/* Warnings */}
              {isAtLimit && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Project Limit Reached</p>
                    <p className="text-sm text-red-700">
                      You've used all {usage.limit} project slots.{" "}
                      <Link to="/settings" className="font-bold underline">Upgrade your plan</Link>
                    </p>
                  </div>
                </div>
              )}

              {!hasApiKey && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">API Key Required</p>
                    <p className="text-sm text-amber-700">
                      Add your OpenAI or Anthropic API key in{" "}
                      <Link to="/settings" className="font-bold underline">Settings</Link> to enable AI generation
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isAtLimit || !niche.trim() || !hasApiKey}
                className={`
                  w-full py-5 rounded-2xl font-bold text-lg text-white
                  bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                  hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg hover:shadow-xl
                  transition-all duration-300
                  relative overflow-hidden group
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Your Growth Engine...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Launch AI Discovery
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-xs text-slate-500">
                AI will analyze your opportunity and generate 10+ monetizable business assets
              </p>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
