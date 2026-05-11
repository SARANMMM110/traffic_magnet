import { useState } from "react";
import { Link } from "react-router";
import { Check, X, ChevronDown } from "lucide-react";

export default function UpgradePage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleUpgrade = (plan: "starter" | "pro") => {
    // TODO: Integrate Stripe checkout
    console.log(`Upgrading to ${plan}, billing: ${isAnnual ? "annual" : "monthly"}`);
  };

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes, cancel from your account settings at any time. No questions asked.",
    },
    {
      q: "What happens to my tools if I downgrade?",
      a: "Your built tools remain yours forever. You just can't generate new ones beyond your plan limit.",
    },
    {
      q: "Do you offer refunds?",
      a: "Yes, we offer a 7-day money-back guarantee on all paid plans.",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(45, 27, 105, 0.19) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(27, 45, 105, 0.19) 0%, transparent 60%),
            #0A0A0F
          `,
        }}
      >
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-20"
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
      <div className="relative z-10 py-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg mb-8" style={{ color: "var(--text-muted)" }}>
            Start free. Upgrade when you're ready to scale.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-full" style={{ background: "var(--bg-elevated)" }}>
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                !isAnnual ? "text-white" : ""
              }`}
              style={{
                background: !isAnnual ? "var(--brand)" : "transparent",
                color: !isAnnual ? "white" : "var(--text-muted)",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                isAnnual ? "text-white" : ""
              }`}
              style={{
                background: isAnnual ? "var(--brand)" : "transparent",
                color: isAnnual ? "white" : "var(--text-muted)",
              }}
            >
              Annually — Save 20%
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-[960px] mx-auto grid md:grid-cols-3 gap-6 mb-16">
          {/* Trial Card */}
          <div className="glass-card p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-2">Trial</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
                  /forever
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Perfect for getting started
              </p>
            </div>

            <div className="flex-1 space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm text-white">3 lifetime Traffic Magnets</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm text-white">Blueprint generation</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm text-white">Build & embed tools</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm text-white">Community support</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                  Content Wrapper
                </span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                  WordPress publishing
                </span>
              </div>
            </div>

            <button
              disabled
              className="w-full py-3 rounded-xl font-semibold opacity-50 cursor-not-allowed"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-muted)",
              }}
            >
              Current Plan
            </button>
          </div>

          {/* Starter Card */}
          <div className="glass-card p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-2">Starter</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">
                  ${isAnnual ? "23" : "29"}
                </span>
                <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
                  /mo
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                For creators building momentum
              </p>
            </div>

            <div className="flex-1 space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
                <span className="text-sm text-white">25 Traffic Magnets / month</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
                <span className="text-sm text-white">Everything in Trial</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
                <span className="text-sm text-white">Content Wrapper (SEO pages)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
                <span className="text-sm text-white">Saved campaigns</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
                <span className="text-sm text-white">Priority email support</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                  WordPress publishing
                </span>
              </div>
            </div>

            <button
              onClick={() => handleUpgrade("starter")}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
              }}
            >
              Upgrade to Starter →
            </button>
          </div>

          {/* Pro Card (Featured) */}
          <div
            className="glass-card p-6 flex flex-col relative"
            style={{
              boxShadow: "0 0 0 2px var(--brand), 0 0 40px var(--brand-glow)",
            }}
          >
            {/* Most Popular Badge */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              MOST POPULAR
            </div>

            <div className="mb-4 mt-2">
              <h3 className="text-lg font-bold text-white mb-2">Pro</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">
                  ${isAnnual ? "63" : "79"}
                </span>
                <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
                  /mo
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                For agencies and serious builders
              </p>
            </div>

            <div className="flex-1 space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#7C5CFC" }} />
                <span className="text-sm text-white">Unlimited Traffic Magnets</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#7C5CFC" }} />
                <span className="text-sm text-white">Everything in Starter</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#7C5CFC" }} />
                <span className="text-sm text-white">WordPress direct publishing</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#7C5CFC" }} />
                <span className="text-sm text-white">White-label embed tools</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#7C5CFC" }} />
                <span className="text-sm text-white">Agency client accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#7C5CFC" }} />
                <span className="text-sm text-white">Dedicated support</span>
              </div>
            </div>

            <button
              onClick={() => handleUpgrade("pro")}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                boxShadow: "0 0 20px var(--brand-glow)",
              }}
            >
              Upgrade to Pro →
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Common questions about pricing
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>
                {expandedFaq === index && (
                  <div
                    className="px-6 pb-4 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Back to Dashboard Link */}
        <div className="text-center mt-12">
          <Link
            to="/dashboard"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--brand)" }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
