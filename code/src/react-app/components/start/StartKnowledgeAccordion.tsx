import { ChevronDown, Code2, Globe2, Rocket, Search, Wallet } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  {
    id: "setup",
    title: "Workspace setup",
    subtitle: "Identity, domains, and environment defaults",
    icon: Rocket,
    body: "Connect your primary property, confirm crawl budget, and set publishing guardrails. Traffic Magnet mirrors production constraints so generated assets stay deploy-safe.",
  },
  {
    id: "api",
    title: "API & automation",
    subtitle: "Headless hooks and integration contracts",
    icon: Code2,
    body: "Use the worker-backed routes to trigger renders, sync blueprints, and stream completion events. Designed for CI and internal tools—not brittle no-code bridges.",
  },
  {
    id: "deploy",
    title: "Deployment paths",
    subtitle: "Edge, static, and hybrid surfaces",
    icon: Globe2,
    body: "Choose embed-first delivery or standalone pages. The render engine emits stable HTML with progressive enhancement so you can ship without framework lock-in.",
  },
  {
    id: "seo",
    title: "SEO publishing",
    subtitle: "Structured entities and measurable freshness",
    icon: Search,
    body: "Blueprint-driven sections map to entities you can refresh on a schedule. Internal linking suggestions stay tied to your topical map—not generic blog noise.",
  },
  {
    id: "money",
    title: "Monetization playbooks",
    subtitle: "Revenue models that match intent depth",
    icon: Wallet,
    body: "Align calculator flows with lead capture, attach comparison tables for affiliate fit, and sequence soft CTAs for high-trust verticals.",
  },
];

export default function StartKnowledgeAccordion() {
  const [open, setOpen] = useState<string | null>("setup");

  return (
    <section className="rounded-[1.75rem] border border-slate-200/50 bg-gradient-to-b from-white/70 to-slate-50/30 p-1 shadow-[0_16px_48px_-32px_rgba(15,23,42,0.2)] backdrop-blur-xl">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
          Resource & learning center
        </h2>
        <p className="mt-1 text-base font-bold tracking-tight text-slate-900">
          Expandable knowledge lanes · zero marketing fluff
        </p>
      </div>

      <div className="space-y-1 px-2 pb-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isOpen = open === item.id;
          return (
            <div
              key={item.id}
              className={`
                overflow-hidden rounded-2xl border transition-all duration-300
                ${
                  isOpen
                    ? "border-violet-200/60 bg-white/80 shadow-md"
                    : "border-transparent bg-white/30 hover:border-slate-200/60 hover:bg-white/50"
                }
              `}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-900/[0.03] text-slate-700">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-violet-600" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="border-t border-slate-100/80 px-4 pb-4 pl-[4.25rem] pr-4 pt-3 text-sm leading-relaxed text-slate-600 sm:px-5 sm:pl-[4.5rem]">
                    {item.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
