import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  Bolt,
  BrainCircuit,
  CheckCircle,
  Code2,
  FileText,
  Gauge,
  Globe2,
  Layers3,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WandSparkles,
} from "lucide-react";

const proofPoints = [
  "Discover monetizable asset ideas in minutes",
  "Generate strategy blueprints and SaaS pages",
  "Export HTML, embeds, and authority content",
];

const metrics = [
  { value: "12", label: "business assets per category" },
  { value: "16", label: "online business niches" },
  { value: "3x", label: "publish-ready formats" },
];

const workflow = [
  {
    title: "Choose a niche",
    text: "Start with a monetization niche, audience, or traffic category. Ai Auto Traffic turns broad markets into focused online business opportunities.",
    icon: Target,
  },
  {
    title: "Generate the asset",
    text: "Create an AI business asset, strategy blueprint, landing page, HTML experience, and authority content wrapper with a guided SEO workflow.",
    icon: WandSparkles,
  },
  {
    title: "Publish and compound",
    text: "Export clean HTML or embed code, publish fast, and build a library of conversion assets that can rank and monetize over time.",
    icon: TrendingUp,
  },
];

const featureCards = [
  {
    title: "Opportunity discovery",
    text: "Uncover high-value business asset ideas your customers are already searching for, then prioritize them by traffic and revenue potential.",
    icon: Search,
  },
  {
    title: "Blueprint intelligence",
    text: "Turn a raw idea into a business strategy document with pain points, SEO opportunity, traffic strategy, authority, and monetization roadmap.",
    icon: BrainCircuit,
  },
  {
    title: "No-code asset builder",
    text: "Generate working HTML business assets and widgets without wrestling with code, plugins, or a developer backlog.",
    icon: Code2,
  },
  {
    title: "Content wrapper",
    text: "Package every asset with semantic SEO, EEAT content, NLP keyword coverage, FAQs, internal links, and conversion copy.",
    icon: FileText,
  },
  {
    title: "Landing page generator",
    text: "Create polished standalone SaaS pages around each asset so every opportunity has a clear conversion path.",
    icon: Globe2,
  },
  {
    title: "Repeatable growth system",
    text: "Build one monetizable asset, then repeat the same workflow across dozens of traffic and revenue opportunities.",
    icon: Layers3,
  },
];

const customerOutcomes = [
  "Launch professional business assets, lead magnets, revenue engines, and SEO systems without starting from a blank page.",
  "Create assets that educate visitors before asking them to book, buy, subscribe, apply, or share.",
  "Build a compounding library of authority pages instead of relying only on ads or social posts.",
];

export default function Landing() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-14%] h-[32rem] w-[32rem] rounded-full bg-[rgba(99,91,255,0.12)] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-[rgba(8,145,178,0.11)] blur-3xl" />
        <div className="absolute bottom-[6%] left-[18%] h-[20rem] w-[20rem] rounded-full bg-[rgba(16,185,129,0.08)] blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight">Ai Auto Traffic</span>
              <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                AI opportunity engine
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" style={{ color: "var(--text-secondary)" }}>
            <button onClick={scrollToFeatures} className="transition-colors hover:text-[var(--text-primary)]">
              Features
            </button>
            <a href="#workflow" className="transition-colors hover:text-[var(--text-primary)]">
              Workflow
            </a>
            <a href="#outcomes" className="transition-colors hover:text-[var(--text-primary)]">
              Results
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-semibold sm:block" style={{ color: "var(--text-secondary)" }}>
              Sign in
            </Link>
            <Link to="/signup">
              <button className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold">
                Start free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </header>

        <main>
          <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:pb-28 lg:pt-20">
            <div className="animate-fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(99,91,255,0.22)] bg-white/75 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
                <Sparkles className="h-3.5 w-3.5" />
                AI online business opportunity engine
              </div>

              <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-0.055em] md:text-6xl lg:text-7xl">
                Build professional AI business assets that attract, convert, and monetize.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 md:text-lg" style={{ color: "var(--text-secondary)" }}>
                Ai Auto Traffic helps founders, agencies, creators, and publishers turn niche opportunities into traffic systems, lead magnets, revenue engines, landing pages, and authority content people want to use and share.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup">
                  <button className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold sm:w-auto">
                  Create your first opportunity asset
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <button
                  onClick={scrollToFeatures}
                  className="btn-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold"
                >
                  <MousePointerClick className="h-4 w-4" />
                  See the system
                </button>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {proofPoints.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/75 px-3.5 py-2 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-indigo-200/60 via-cyan-100/50 to-emerald-100/50 blur-2xl" />
              <div className="premium-card relative overflow-hidden rounded-[28px] bg-white/[0.92] p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                    Builder Preview
                  </span>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white">
                    <div className="mb-8 flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/[0.55]">Generated asset</p>
                        <h3 className="mt-2 text-2xl font-extrabold">Local SEO Growth Engine</h3>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Gauge className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {metrics.map((metric) => (
                        <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                          <div className="text-xl font-extrabold">{metric.value}</div>
                          <div className="mt-1 text-[0.72rem] leading-4 text-white/60">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="icon-tile h-9 w-9 rounded-xl">
                          <BarChart3 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">Traffic score</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            High intent search
                          </p>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[88%] rounded-full bg-[var(--brand)]" />
                      </div>
                      <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        Prioritized for quick publishing and customer education.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="icon-tile h-9 w-9 rounded-xl text-[var(--accent-green)]">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">Publish kit</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Ready assets
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {["HTML asset", "SaaS landing page", "Authority wrapper"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-20">
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="premium-card p-6 text-center">
                  <div className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--brand)" }}>
                    {metric.value}
                  </div>
                  <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="workflow" className="mx-auto max-w-7xl px-6 pb-20">
            <div className="surface-panel p-6 md:p-8">
              <div className="mb-8 max-w-2xl">
                <div className="section-eyebrow mb-3">Simple Workflow</div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  From niche idea to customer-ready asset in one guided system.
                </h2>
                <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  Instead of writing another generic blog post, build interactive assets that give visitors a reason to analyze, plan, save, subscribe, and share.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {workflow.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-3xl border border-[var(--border)] bg-white/80 p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="icon-tile">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">{step.title}</h3>
                      <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                        {step.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="features" className="mx-auto max-w-7xl px-6 pb-20">
            <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <div className="section-eyebrow mb-3">What Customers Notice</div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  Every page feels useful before it asks for anything.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                Ai Auto Traffic is built to help you ship practical business assets that make visitors trust your brand faster.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="premium-card group p-6">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--brand)] shadow-sm transition-all group-hover:bg-[var(--brand-soft)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                      {feature.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="outcomes" className="mx-auto max-w-7xl px-6 pb-24">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="premium-card p-7">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Bolt className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Designed to impress visitors, not just search engines.
                </h2>
                <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  Interactive business assets help customers understand their opportunity, see the value of your solution, and take the next step with more confidence.
                </p>
                <Link to="/signup">
                  <button className="btn-primary mt-7 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold">
                    Start building now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>

              <div className="grid gap-4">
                {customerOutcomes.map((outcome, index) => (
                  <div key={outcome} className="premium-card flex items-start gap-4 p-5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold">
                        {index === 0 ? "Ship faster" : index === 1 ? "Convert better" : "Grow steadily"}
                      </h3>
                      <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                        {outcome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-16">
            <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-slate-950 p-8 text-center text-white md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,91,255,0.38),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(8,145,178,0.28),transparent_30%)]" />
              <div className="relative mx-auto max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Build your first opportunity engine
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  Turn one niche into a library of monetizable business assets.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                  Start with one traffic system, lead magnet, or revenue engine. Then repeat the workflow until your site becomes the most useful resource in your market.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/signup">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto">
                      Get started free
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.15] bg-white/10 px-6 py-3.5 font-bold text-white transition-all hover:bg-white/[0.15] sm:w-auto">
                      Sign in
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
