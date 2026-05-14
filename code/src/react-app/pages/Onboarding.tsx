import { useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import {
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle2,
  Book,
  Code,
  FileText,
  Lightbulb,
  Users,
  Search,
  DollarSign,
  ChevronRight,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    { number: 1, label: "Choose Niche" },
    { number: 2, label: "Define Goal" },
    { number: 3, label: "Customize" },
    { number: 4, label: "AI Generation" },
    { number: 5, label: "Review & Launch" },
  ];

  const studioTips = [
    {
      icon: TrendingUp,
      title: "High Impact",
      description: "Focus on niches with strong demand and monetization.",
    },
    {
      icon: Lightbulb,
      title: "Solve Real Problems",
      description: "Tools that solve real pain points get more traffic and links.",
    },
    {
      icon: CheckCircle2,
      title: "Validate & Scale",
      description: "Test, improve and scale what brings the best results.",
    },
  ];

  const helpfulGuides = [
    {
      icon: Book,
      title: "Getting Started Guide",
      description: "Learn the basics and start building in minutes.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: Code,
      title: "API & Integrations",
      description: "Connect tools and unlock advanced features.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: FileText,
      title: "Feature Documentation",
      description: "Explore everything Growth Studio can do.",
      color: "from-blue-500 to-cyan-600",
    },
  ];

  const recommendedTools = [
    {
      icon: Sparkles,
      title: "AI Tool Ideas Finder",
      description: "Discover 100+ tool ideas based on your niche and market demand.",
      color: "from-emerald-400 to-teal-500",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: DollarSign,
      title: "Revenue Model Explorer",
      description: "Find the best ways to monetize your assets.",
      color: "from-amber-400 to-orange-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: Search,
      title: "Keyword Opportunity",
      description: "Uncover low-competition, high-intent keyword gems.",
      color: "from-purple-400 to-indigo-500",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      icon: Users,
      title: "Competitor Analyzer",
      description: "See what's working for others and do it better.",
      color: "from-blue-400 to-cyan-500",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-20">
        {/* Hero Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                  Start Here
                  <span className="text-4xl">👋</span>
                </h1>
                <p className="text-lg text-slate-600">
                  Follow these simple steps to create your first growth asset.
                </p>
              </div>
              {/* Decorative Rocket Illustration Placeholder */}
              <div className="hidden lg:block">
                <div className="w-48 h-32 rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
                  <Zap className="w-16 h-16 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Progress Tracker */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    YOUR BUILD PROGRESS
                  </p>
                  <p className="text-sm font-semibold text-indigo-600">
                    {currentStep} of {totalSteps} completed
                  </p>
                </div>

                {/* Step Circles */}
                <div className="flex items-center justify-between mb-6">
                  {steps.map((step) => (
                    <div key={step.number} className="flex flex-col items-center flex-1">
                      <div
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2
                          transition-all duration-300
                          ${
                            step.number === currentStep
                              ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                              : step.number < currentStep
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-400"
                          }
                        `}
                      >
                        {step.number}
                      </div>
                      <p
                        className={`
                          text-xs font-medium text-center
                          ${step.number === currentStep ? "text-slate-900" : "text-slate-500"}
                        `}
                      >
                        {step.label}
                      </p>
                      {step.number === currentStep && (
                        <div className="mt-2 h-1 w-12 bg-indigo-600 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Step Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
                  <div className="inline-block px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider mb-4">
                    STEP {currentStep} OF {totalSteps}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Choose Your Business
                    <br />
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Opportunity
                    </span>
                  </h2>
                  <p className="text-slate-700 text-lg leading-relaxed mb-6">
                    Select a niche or market where you want to create traffic, leads, and revenue. Our AI will surface the best opportunities tailored for you.
                  </p>

                  {/* Decorative Icons */}
                  <div className="flex items-center gap-8 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
                        <Target className="w-6 h-6 text-rose-600" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/projects/new")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Explore Opportunities
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Helpful Guides */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Helpful Guides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {helpfulGuides.map((guide) => {
                    const Icon = guide.icon;
                    return (
                      <button
                        key={guide.title}
                        className="group bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center mb-3 shadow-md`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
                          {guide.title}
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </h4>
                        <p className="text-sm text-slate-600">{guide.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Tools */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Recommended for you</h3>
                  <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    See all
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.title}
                        className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-lg transition-all relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center mb-4`}>
                            <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                          </div>
                          <h4 className="font-bold text-slate-900 mb-2">{tool.title}</h4>
                          <p className="text-sm text-slate-600 mb-4">{tool.description}</p>
                          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all ml-auto">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Ready to build something powerful?</h3>
                      <p className="text-indigo-100">
                        Create your first project and let AI handle the heavy lifting.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/projects/new")}
                    className="px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                  >
                    Create New Project
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Studio Tips */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-8">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Studio Tips</h3>
                </div>
                <div className="space-y-5">
                  {studioTips.map((tip, index) => {
                    const Icon = tip.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{tip.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{tip.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="mt-6 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1">
                  View all tips
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 border-t border-slate-200 mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                OUR OTHER APPS
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <button className="hover:text-indigo-600">AI Agent Factory</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600 text-slate-400">(Coming Soon!)</button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                FREE SEO TOOLS
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <button className="hover:text-indigo-600">AI Bot Checker</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Traffic Opportunity Finder</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Traffic Magnets Keyword Intelligence</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Rank New Websites Fast!</button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                FREE TRAFFIC TOOLS
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <button className="hover:text-indigo-600">Backlink Gap Analyzer</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Topical Map Generator</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Expired Domain Finder</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Content Gap Scanner</button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                FREE MARKETING TOOLS
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <button className="hover:text-indigo-600">HookViral</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">AI Writing Studio</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">VidOptima</button>
                </li>
                <li>
                  <button className="hover:text-indigo-600">Hormozi Landing Page Pro</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
