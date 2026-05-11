import { Link } from "react-router";
import { Target, Bolt, TrendingUp } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="max-w-[600px] space-y-8 animate-fade-in-up">
            {/* Eyebrow tag */}
            <div className="inline-block">
              <div
                className="px-4 py-2 rounded-full text-xs font-semibold tracking-wider"
                style={{
                  border: "1px solid var(--brand)",
                  color: "var(--brand)",
                  letterSpacing: "0.1em",
                }}
              >
                AI-POWERED SEO TOOL FACTORY
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              <div>Build tools that rank.</div>
              <div>Attract traffic that</div>
              <div className="text-gradient">compounds.</div>
            </h1>

            {/* Subtext */}
            <p
              className="text-base md:text-lg max-w-[480px] mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Generate free online calculators and tools your niche needs — built
              by AI, deployed in minutes, ranked on Google forever.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/signup">
                <button
                  className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:brightness-110 hover:scale-105 active:scale-98 transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                    boxShadow: "0 0 20px var(--brand-glow)",
                  }}
                >
                  ⚡ Start Building Free
                </button>
              </Link>
              <button
                onClick={scrollToFeatures}
                className="px-6 py-3 rounded-xl font-semibold hover:bg-opacity-80 transition-all duration-200"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              >
                See how it works →
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div id="features" className="px-4 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div
                className="glass-card p-8 space-y-4"
                style={{ animationDelay: "0ms" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(124, 92, 252, 0.15)" }}
                >
                  <Target className="w-8 h-8" style={{ color: "var(--brand)" }} />
                </div>
                <h3 className="text-xl font-bold">Pick Your Niche</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  AI finds the highest-potential tool opportunities in your market
                </p>
              </div>

              {/* Card 2 */}
              <div
                className="glass-card p-8 space-y-4"
                style={{ animationDelay: "60ms" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(245, 158, 11, 0.15)" }}
                >
                  <Bolt className="w-8 h-8" style={{ color: "var(--accent-amber)" }} />
                </div>
                <h3 className="text-xl font-bold">AI Builds the Tool</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  A working HTML calculator or checker, ready to embed in 60 seconds
                </p>
              </div>

              {/* Card 3 */}
              <div
                className="glass-card p-8 space-y-4"
                style={{ animationDelay: "120ms" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(0, 208, 132, 0.15)" }}
                >
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
