import { Link } from "react-router";
import { ArrowRight, Bolt, CheckCircle, Sparkles, Target, TrendingUp } from "lucide-react";

export default function Landing() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Subtle gradient background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(124, 92, 252, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 60%),
            var(--bg-base)
          `,
        }}
      >
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-10"
            style={{
              background: "var(--brand)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
          <div className="max-w-[760px] space-y-8 animate-fade-in-up">
            {/* Eyebrow tag */}
            <div className="inline-block">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wider"
                style={{
                  border: "1px solid rgba(99, 91, 255, 0.22)",
                  background: "var(--brand-soft)",
                  color: "var(--brand)",
                  letterSpacing: "0.1em",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI-POWERED SEO TOOL FACTORY
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-extrabold leading-tight md:text-7xl">
              <div>Build AI tools that rank,</div>
              <div className="text-gradient">convert, and compound.</div>
            </h1>

            {/* Subtext */}
            <p
              className="mx-auto max-w-[620px] text-base leading-8 md:text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Generate free online calculators and tools your niche needs — built
              by AI, deployed in minutes, ranked on Google forever.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/signup">
                <button
                  className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold"
                >
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <button
                onClick={scrollToFeatures}
                className="btn-secondary rounded-2xl px-6 py-3 font-semibold"
              >
                See how it works
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              {["No-code workflow", "SEO-ready exports", "AI content wrapper"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div id="features" className="px-4 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="premium-card space-y-4 p-8" style={{ animationDelay: "0ms" }}>
                <div className="icon-tile h-14 w-14">
                  <Target className="w-8 h-8" style={{ color: "var(--brand)" }} />
                </div>
                <h3 className="text-xl font-bold">Pick Your Niche</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  AI finds the highest-potential tool opportunities in your market
                </p>
              </div>

              {/* Card 2 */}
              <div className="premium-card space-y-4 p-8" style={{ animationDelay: "60ms" }}>
                <div className="icon-tile h-14 w-14 text-[var(--accent-amber)]">
                  <Bolt className="w-8 h-8" style={{ color: "var(--accent-amber)" }} />
                </div>
                <h3 className="text-xl font-bold">AI Builds the Tool</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  A working HTML calculator or checker, ready to embed in 60 seconds
                </p>
              </div>

              {/* Card 3 */}
              <div className="premium-card space-y-4 p-8" style={{ animationDelay: "120ms" }}>
                <div className="icon-tile h-14 w-14 text-[var(--accent-green)]">
                  <TrendingUp className="w-8 h-8" style={{ color: "var(--accent-green)" }} />
                </div>
                <h3 className="text-xl font-bold">Traffic Compounds</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  Tools rank on Google and earn backlinks every month — forever
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
