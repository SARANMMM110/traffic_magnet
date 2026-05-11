import { useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Search, ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What does the Traffic Asset Score (0–100) mean?",
    answer: "It's a weighted score based on three factors: <strong style='color: var(--brand)'>Traffic Potential</strong>, <strong style='color: var(--brand)'>Link Magnet Score</strong>, and <strong style='color: var(--brand)'>Monetization Potential</strong>. A higher score means the tool idea is more likely to attract organic search traffic, earn backlinks, AND has strong monetization potential. Use it to decide which tools to build first.",
  },
  {
    category: "Getting Started",
    question: "How does the Primary Goal setting affect my results?",
    answer: "Choosing <strong style='color: var(--brand)'>Drive Backlinks</strong>, <strong style='color: var(--brand)'>Generate Leads</strong>, <strong style='color: var(--brand)'>Increase Traffic</strong>, or <strong style='color: var(--brand)'>Improve Engagement</strong> changes how the AI writes your blueprint — specifically the monetization strategy, call-to-action angle, and internal linking suggestions. It doesn't lock the tool type, but it points the strategy in the right direction for what you want to achieve.",
  },
  {
    category: "Pricing & Plans",
    question: "If my tools get a lot of traffic, will I be charged more?",
    answer: "No. Magnet Lab has no usage-based pricing. Your subscription covers tool generation. The tools themselves are plain static HTML — once built, they cost nothing extra to run no matter how much traffic they receive. The only variable cost is your own API key (OpenAI/Anthropic), billed directly by those providers, and only used during the build stage — not when visitors use your tools.",
  },
  {
    category: "Building Tools",
    question: "Can I have a free public version of a tool and a paid/gated version at the same time?",
    answer: "Yes — and it's a great strategy. Build the tool once, then:<br/><ul style='margin: 8px 0; padding-left: 20px;'><li style='margin: 4px 0;'>Embed the free version on a public page to attract traffic and backlinks</li><li style='margin: 4px 0;'>Embed a second version on a members-only or gated page with custom branding</li></ul>The embed code is fully customisable HTML so you have complete control over both versions.",
  },
  {
    category: "API Keys",
    question: "The API key requirement feels too technical. Is there an easier way?",
    answer: "We hear you and we're working on simplifying this. The key thing to know: the API key is only needed when generating tools and blueprints. Once a tool is built, no API key is needed — it's a simple HTML file that runs itself. You set it up once and it works forever.",
  },
  {
    category: "Traffic & SEO",
    question: "How long does it take for traffic tool pages to rank on Google?",
    answer: "It varies by niche and domain authority, but typically you can expect to see movement in 4–12 weeks for lower-competition keywords. Tools pages tend to rank faster than traditional blog posts because they offer genuine utility — Google rewards pages that keep visitors engaged. Promoting your tool page to get initial backlinks will accelerate this significantly.",
  },
  {
    category: "Domains & Embedding",
    question: "Can I use my own domain for tool pages? Does it affect search rankings?",
    answer: "Yes on both. You can host your tool pages on your own domain — just upload the HTML file via FTP or your hosting panel. Using your own domain does help with rankings over time. Pages on a custom domain build domain authority, which search engines reward. It also looks more professional and trustworthy to visitors.",
  },
  {
    category: "Use Cases",
    question: "Can Magnet Lab be used to build a toolkit page for local or small business owners?",
    answer: "Absolutely — local business is one of the strongest niches for this strategy. Great tool ideas include:<br/><ul style='margin: 8px 0; padding-left: 20px;'><li style='margin: 4px 0;'>ROI calculator</li><li style='margin: 4px 0;'>Break-even calculator</li><li style='margin: 4px 0;'>Profit margin calculator</li><li style='margin: 4px 0;'>Customer lifetime value calculator</li><li style='margin: 4px 0;'>Ad spend ROI estimator</li><li style='margin: 4px 0;'>Foot traffic estimator</li></ul>Bundle several on one page targeting searches like \"free tools for small business owners\" and you create a page that local marketing agencies, business blogs, and chambers of commerce will naturally link to. Set Primary Goal to Drive Backlinks or Generate Leads depending on your objective.",
  },
];

const CATEGORIES = [
  { emoji: "🚀", name: "Getting Started" },
  { emoji: "💰", name: "Pricing & Plans" },
  { emoji: "🔨", name: "Building Tools" },
  { emoji: "🔑", name: "API Keys" },
  { emoji: "📈", name: "Traffic & SEO" },
  { emoji: "🌐", name: "Domains & Embedding" },
  { emoji: "💼", name: "Use Cases" },
];

export default function HelpFAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<Map<number, boolean>>(new Map());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const handleFeedback = (index: number, helpful: boolean) => {
    const newFeedback = new Map(feedback);
    newFeedback.set(index, helpful);
    setFeedback(newFeedback);
  };

  // Filter FAQs
  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category
  const groupedFAQs: Record<string, FAQItem[]> = {};
  filteredFAQs.forEach((item) => {
    if (!groupedFAQs[item.category]) {
      groupedFAQs[item.category] = [];
    }
    groupedFAQs[item.category].push(item);
  });

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/faq" style={{ color: "var(--text-muted)" }} className="text-sm">
            Help Centre
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Help & FAQ</h1>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>
            Answers to the most common questions about Magnet Lab
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
            {FAQ_DATA.length} answers and growing
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-12 pr-4 py-4 rounded-xl text-base glass-card"
            style={{
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Category Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className="px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all"
              style={{
                background:
                  selectedCategory === "All" ? "var(--brand)" : "var(--bg-elevated)",
                color: selectedCategory === "All" ? "white" : "var(--text-muted)",
                border:
                  selectedCategory === "All"
                    ? "none"
                    : "1px solid var(--border-strong)",
              }}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all"
                style={{
                  background:
                    selectedCategory === cat.name
                      ? "var(--brand)"
                      : "var(--bg-elevated)",
                  color:
                    selectedCategory === cat.name ? "white" : "var(--text-muted)",
                  border:
                    selectedCategory === cat.name
                      ? "none"
                      : "1px solid var(--border-strong)",
                }}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-8">
          {Object.keys(groupedFAQs).length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: "var(--text-muted)" }}>No results found</p>
            </div>
          ) : (
            Object.entries(groupedFAQs).map(([category, items]) => {
              const categoryData = CATEGORIES.find((c) => c.name === category);
              return (
                <div key={category}>
                  {/* Category Header */}
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span>{categoryData?.emoji}</span>
                    <span>{category}</span>
                    <span
                      className="text-sm px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                        fontWeight: "normal",
                      }}
                    >
                      {items.length}
                    </span>
                  </h2>

                  {/* Accordion Items */}
                  <div className="space-y-3">
                    {items.map((item, itemIndex) => {
                      const globalIndex =
                        FAQ_DATA.findIndex(
                          (faq) =>
                            faq.question === item.question &&
                            faq.category === item.category
                        ) || 0;
                      const isOpen = openItems.has(globalIndex);
                      const hasFeedback = feedback.has(globalIndex);

                      return (
                        <div
                          key={itemIndex}
                          className="glass-card overflow-hidden transition-all"
                        >
                          {/* Question Header */}
                          <button
                            onClick={() => toggleItem(globalIndex)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left transition-all hover:brightness-110"
                          >
                            <span className="font-bold pr-4" style={{ color: "var(--text-primary)" }}>
                              {item.question}
                            </span>
                            <ChevronDown
                              className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                              style={{
                                color: "var(--text-muted)",
                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            />
                          </button>

                          {/* Answer Body */}
                          <div
                            className="overflow-hidden transition-all duration-200"
                            style={{
                              maxHeight: isOpen ? "1000px" : "0px",
                            }}
                          >
                            <div className="px-6 pb-4">
                              <div
                                className="text-sm leading-relaxed mb-4"
                                style={{ color: "var(--text-secondary)" }}
                                dangerouslySetInnerHTML={{ __html: item.answer }}
                              />

                              {/* Was this helpful? */}
                              {!hasFeedback ? (
                                <div className="flex items-center gap-3">
                                  <span
                                    className="text-sm"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    Was this helpful?
                                  </span>
                                  <button
                                    onClick={() => handleFeedback(globalIndex, true)}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:brightness-110"
                                    style={{
                                      background: "var(--bg-elevated)",
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    👍 Yes
                                  </button>
                                  <button
                                    onClick={() => handleFeedback(globalIndex, false)}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:brightness-110"
                                    style={{
                                      background: "var(--bg-elevated)",
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    👎 No
                                  </button>
                                </div>
                              ) : (
                                <p
                                  className="text-sm animate-fade-in"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Thanks for your feedback!
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="text-center">
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>
              Can't find your answer? Email support@magnetlab.com or post in the
              community group.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                  boxShadow: "0 0 20px var(--brand-glow)",
                }}
              >
                + Submit a Question
              </button>
              <button
                className="px-6 py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                }}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
