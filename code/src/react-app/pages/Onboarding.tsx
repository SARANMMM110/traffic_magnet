import { useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  DollarSign,
  FileText,
  LayoutGrid,
  Lightbulb,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

function HeroIllustration() {
  return (
    <div className="relative hidden h-[140px] w-[200px] shrink-0 sm:block" aria-hidden>
      <svg viewBox="0 0 200 140" className="h-full w-full drop-shadow-lg">
        <defs>
          <linearGradient id="gs-rocket" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="gs-tab" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f3ff" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>
        </defs>
        <g transform="translate(20 55) rotate(-12 60 40)">
          <rect x="0" y="10" width="120" height="72" rx="10" fill="url(#gs-tab)" stroke="#ddd6fe" strokeWidth="1.5" />
          <rect x="12" y="22" width="36" height="22" rx="3" fill="#c4b5fd" opacity="0.9" />
          <rect x="52" y="22" width="56" height="8" rx="2" fill="#e9d5ff" />
          <rect x="52" y="34" width="40" height="8" rx="2" fill="#ede9fe" />
          <circle cx="92" cy="58" r="14" fill="none" stroke="#a78bfa" strokeWidth="3" strokeDasharray="6 4" />
          <path d="M86 58 L92 64 L102 50" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(95 18)">
          <path
            d="M45 8 L58 52 L45 44 L32 52 Z"
            fill="url(#gs-rocket)"
            stroke="#5b21b6"
            strokeWidth="1"
          />
          <ellipse cx="45" cy="28" rx="8" ry="12" fill="#ddd6fe" stroke="#6d28d9" strokeWidth="1" />
          <path d="M45 44 L40 62 L45 56 L50 62 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}

const STEPPER = [
  { id: 1, label: "Pick Niche", Icon: LayoutGrid },
  { id: 2, label: "Define Goal", Icon: ArrowRight },
  { id: 3, label: "Customize", Icon: SlidersHorizontal },
  { id: 4, label: "AI Generation", Icon: null },
  { id: 5, label: "Review & Launch", Icon: null },
] as const;

const STEP_PANELS: Array<{
  title: string;
  description: string;
  cta: string;
  ctaAction: "new-project" | "none";
}> = [
  {
    title: "Pick Your Business Opportunity",
    description:
      "Choose a niche or market where you want to create growth assets. Our AI will find high-opportunity tool ideas for you.",
    cta: "Choose Your Niche",
    ctaAction: "new-project",
  },
  {
    title: "Define Your Goal",
    description:
      "Clarify whether you want leads, affiliate revenue, or authority—so every asset we generate aligns to a measurable outcome.",
    cta: "Set goal & continue",
    ctaAction: "new-project",
  },
  {
    title: "Customize Your Asset",
    description:
      "Tune tone, depth, and format. Traffic Magnet adapts layout, schema, and calls-to-action to match your brand and funnel.",
    cta: "Open customization",
    ctaAction: "new-project",
  },
  {
    title: "AI Generation",
    description:
      "We synthesize research, structure, and copy into a blueprint-ready asset. Review deltas before anything goes live.",
    cta: "Start generation",
    ctaAction: "new-project",
  },
  {
    title: "Review & Launch",
    description:
      "Validate previews, publishing targets, and tracking. When you are ready, ship to your site or export for your stack.",
    cta: "Go to project workspace",
    ctaAction: "new-project",
  },
];

const RESOURCE_CARDS = [
  {
    icon: BookOpen,
    title: "Getting Started Guide",
    desc: "Learn the basics and start building in minutes.",
    box: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Code2,
    title: "API & Integrations",
    desc: "Connect tools and unlock advanced features.",
    box: "bg-violet-100 text-violet-600",
  },
  {
    icon: FileText,
    title: "Feature Documentation",
    desc: "Explore everything Growth Studio can do.",
    box: "bg-sky-100 text-sky-600",
  },
];

const EXPLORE = [
  {
    title: "AI Tool Ideas Finder",
    desc: "Discover 100+ tool ideas based on your niche.",
    icon: Sparkles,
    iconBg: "bg-emerald-100 text-emerald-600",
    arrow: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Revenue Model Explorer",
    desc: "Find the best ways to monetize your assets.",
    icon: DollarSign,
    iconBg: "bg-fuchsia-100 text-fuchsia-600",
    arrow: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    title: "Keyword Opportunity",
    desc: "Uncover hidden keyword gems in your niche.",
    icon: Search,
    iconBg: "bg-orange-100 text-orange-600",
    arrow: "bg-orange-50 text-orange-600",
  },
  {
    title: "Competitor Analyzer",
    desc: "See what's working for others and do it better.",
    icon: Users,
    iconBg: "bg-sky-100 text-sky-600",
    arrow: "bg-sky-50 text-sky-600",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const panel = STEP_PANELS[activeStep - 1] ?? STEP_PANELS[0];
  const total = STEPPER.length;

  return (
    <DashboardLayout>
      <div className="min-h-full pb-16 pt-2">
        <div className="mx-auto max-w-[920px] px-4 sm:px-6">
          {/* Header — outside card */}
          <header className="flex flex-col gap-6 py-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="relative flex h-12 w-14 shrink-0 items-center justify-center">
                <Sparkles className="absolute left-0 top-1 h-7 w-7 text-violet-500" strokeWidth={2} />
                <Sparkles className="absolute left-4 top-2 h-6 w-6 text-violet-600" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                  Welcome to Growth Studio
                </h1>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-600">
                  Let&apos;s build your first high-impact business asset.
                </p>
              </div>
            </div>
            <HeroIllustration />
          </header>

          {/* Setup progress card */}
          <section className="rounded-2xl border border-slate-100/80 bg-white p-6 shadow-md sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Your setup progress
              </p>
              <p className="text-sm font-semibold text-violet-600">
                Step {activeStep} of {total}
              </p>
            </div>

            <div className="mt-8 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-[600px] items-start sm:min-w-0">
                {STEPPER.map((step, i) => {
                  const active = step.id === activeStep;
                  const Icon = step.Icon;
                  const last = i === STEPPER.length - 1;
                  const displayLabel = active ? `${step.id} ${step.label}` : step.label;

                  return (
                    <div key={step.id} className="flex min-w-0 flex-1 items-start">
                      <div className="flex w-[72px] shrink-0 flex-col items-center sm:w-[86px]">
                        <div
                          className={`
                            relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold
                            ${
                              active
                                ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200/80"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                            }
                          `}
                        >
                          {Icon ? (
                            <Icon className="h-5 w-5" strokeWidth={2} />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>
                        <p
                          className={`mt-2.5 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                            active ? "font-bold text-slate-900" : "text-slate-500"
                          }`}
                        >
                          {displayLabel}
                        </p>
                        {active && <div className="mt-2 h-1 w-11 rounded-full bg-violet-600" />}
                      </div>
                      {!last && (
                        <div className="mt-[22px] h-px min-w-[8px] flex-1 border-t-2 border-dashed border-slate-200" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={activeStep <= 1}
                onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                Back
              </button>
              <button
                type="button"
                disabled={activeStep >= total}
                onClick={() => setActiveStep((s) => Math.min(total, s + 1))}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </section>

          {/* Active step card */}
          <section className="mt-6 rounded-2xl border border-slate-100/80 bg-white p-6 shadow-md sm:p-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                  <Target className="h-6 w-6 text-violet-600" strokeWidth={2} />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Step {activeStep} of {total}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{panel.title}</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {panel.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (panel.ctaAction === "new-project") navigate("/projects/new");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700"
                >
                  {panel.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="relative flex min-h-[200px] flex-col items-end justify-center gap-3 pr-1 lg:min-h-[220px] lg:pr-3">
                <div
                  className="pointer-events-none absolute right-6 top-1/2 h-[88%] w-[110px] -translate-y-1/2 rounded-full border border-dotted border-violet-200/70"
                  aria-hidden
                />
                <div className="pointer-events-none absolute right-14 top-10 h-2 w-2 rounded-full bg-emerald-300/90" />
                <div className="pointer-events-none absolute right-8 top-[42%] h-1.5 w-1.5 rounded-full bg-orange-300/90" />
                <div className="pointer-events-none absolute right-16 bottom-14 h-1.5 w-1.5 rounded-full bg-sky-300/90" />

                <div className="relative z-[1] flex w-full max-w-[268px] items-center gap-3 rounded-full border border-slate-100 bg-white py-2.5 pl-3 pr-4 shadow-md">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900">High Demand</p>
                    <p className="text-[11px] text-slate-500">Great traffic potential</p>
                  </div>
                </div>
                <div className="relative z-[1] mr-5 flex w-full max-w-[268px] items-center gap-3 rounded-full border border-slate-100 bg-white py-2.5 pl-3 pr-4 shadow-md sm:mr-8">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <DollarSign className="h-4 w-4 text-orange-600" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900">Monetizable</p>
                    <p className="text-[11px] text-slate-500">Strong revenue models</p>
                  </div>
                </div>
                <div className="relative z-[1] flex w-full max-w-[268px] items-center gap-3 rounded-full border border-slate-100 bg-white py-2.5 pl-3 pr-4 shadow-md">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100">
                    <RefreshCw className="h-4 w-4 text-sky-600" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900">Low Competition</p>
                    <p className="text-[11px] text-slate-500">Higher ranking chances</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Helpful resources */}
          <section className="mt-6">
            <h3 className="text-lg font-bold text-slate-900">Helpful Resources</h3>
            <div className="mt-4 flex flex-col gap-3">
              {RESOURCE_CARDS.map((r) => (
                <button
                  key={r.title}
                  type="button"
                  className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100/80 bg-white p-4 text-left shadow-md transition hover:border-violet-200 hover:shadow-lg sm:p-5"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.box}`}
                  >
                    <r.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{r.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{r.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </button>
              ))}
            </div>
          </section>

          {/* Growth tip */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50/90 p-5 shadow-md sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Lightbulb className="h-6 w-6 text-violet-600" strokeWidth={2} />
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-700">
                <span className="font-bold text-violet-800">Growth Tip: </span>
                Niches with buyer intent + low competition = high traffic + conversions. Our AI
                analyzes thousands of signals to help you win faster.
              </p>
              <div className="hidden shrink-0 sm:block" aria-hidden>
                <BarChart3 className="h-20 w-20 text-violet-200/90" strokeWidth={1.15} />
              </div>
            </div>
          </section>

          {/* Explore more */}
          <section className="mt-8 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Explore More</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXPLORE.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate("/projects/new")}
                  className="group relative flex flex-col rounded-2xl border border-slate-100/80 bg-white p-5 text-left shadow-md transition hover:border-violet-200 hover:shadow-lg"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBg}`}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{item.desc}</p>
                  <div className="mt-4 flex justify-end">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${item.arrow}`}
                    >
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
