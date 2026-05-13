import { useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { BriefcaseBusiness, ChevronDown, CircleDollarSign, Globe2, Hammer, KeyRound, Rocket, Search, TrendingUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What does the Traffic Asset Score (0–100) represent?",
    answer:
      "The score is a combined metric that evaluates three things: how much search traffic the asset could capture, the strength of backlink opportunities, and how profitable the idea might be. A higher number indicates a stronger overall opportunity. It’s meant to help you prioritize which tools to build first.",
  },
  {
    category: "Getting Started",
    question: "How does the Primary Goal option influence the blueprint?",
    answer:
      "Your selected goal — whether it’s boosting backlinks, generating leads, driving traffic, or improving engagement — guides how the AI shapes the strategy. It adjusts the monetization angle, recommended calls to action, and linking approach. It doesn’t restrict what type of tool you build, but it does tailor the plan toward your desired outcome.",
  },
  {
    category: "Pricing & Plans",
    question: "Will I pay more if my assets get lots of visitors?",
    answer:
      "No. Ai Auto Traffic doesn’t charge based on usage or traffic. Your subscription covers tool creation, and the generated assets are simple static HTML files that don’t incur extra costs no matter how much traffic they get. The only variable expense is your API key (OpenAI/Anthropic), which is only used while generating the asset — not when people use it.",
  },
  {
    category: "Building Assets",
    question: "Can I publish both a free version and a paid/gated version of the same asset?",
    answer:
      "Yes — and it’s a smart approach. You can build an asset once, then:<br/><ul style='margin: 8px 0; padding-left: 20px;'><li style='margin: 4px 0;'>Embed an open-access version on a public page to attract search traffic</li><li style='margin: 4px 0;'>Embed another version on a protected or members-only page with premium features or branding</li></ul>Since the embed code is fully editable HTML, you have full flexibility over both setups.",
  },
  {
    category: "API Keys",
    question: "Using an API key feels too technical. Is there a simpler option?",
    answer:
      "We understand. The key is only needed during the actual generation of tools and blueprints. After the tool is created, it becomes a self-contained HTML file and no longer depends on any API. You configure the key once, and your assets continue running indefinitely.",
  },
  {
    category: "Traffic & SEO",
    question: "How long until tool pages start ranking on Google?",
    answer:
      "Ranking time depends on your niche and domain strength, but many users see early results within 4–12 weeks for low-competition keywords. Tool-based pages often rank faster than regular articles because they offer real utility and keep visitors engaged — something Google rewards. Getting a few initial backlinks can speed up the process even more.",
  },
  {
    category: "Domains & Embedding",
    question: "Can I host my tools on my own domain? Does it help SEO?",
    answer:
      "Yes. You can upload the generated HTML to your own domain through FTP or your hosting panel. Hosting on your domain is beneficial — it supports long-term SEO, builds domain authority, and establishes more trust with users. It also gives your brand a more polished appearance.",
  },
  {
    category: "Use Cases",
    question: "Is Ai Auto Traffic suitable for creating toolkits for local or small business audiences?",
    answer:
      "Definitely. Local business niches work extremely well with this model. Useful asset ideas include:<br/><ul style='margin: 8px 0; padding-left: 20px;'><li style='margin: 4px 0;'>Local SEO performance checker</li><li style='margin: 4px 0;'>Lead conversion evaluator</li><li style='margin: 4px 0;'>Appointment/booking optimization analyzer</li><li style='margin: 4px 0;'>Reputation and review opportunity finder</li><li style='margin: 4px 0;'>Ad spend efficiency calculator</li><li style='margin: 4px 0;'>Service revenue projection tool</li></ul>Combining several on a single “business growth tools” page makes it attractive for local marketing blogs, business groups, and community organizations to link to. Choose Drive Backlinks or Generate Leads depending on your goal.",
  },
];

const CATEGORIES = [
  { icon: Rocket, name: "Getting Started" },
  { icon: CircleDollarSign, name: "Pricing & Plans" },
  { icon: Hammer, name: "Building Assets" },
  { icon: KeyRound, name: "API Keys" },
  { icon: TrendingUp, name: "Traffic & SEO" },
  { icon: Globe2, name: "Domains & Embedding" },
  { icon: BriefcaseBusiness, name: "Use Cases" },
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
      <div className="page-shell max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/faq" style={{ color: "var(--text-muted)" }} className="text-sm">
            Help Centre
          </Link>
        </div>

        {/* Header */}
        <div className="surface-panel mb-8 p-8 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Help & FAQ</h1>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>
            Answers to the most common questions about Ai Auto Traffic
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
            className="input-premium w-full pl-12 pr-4 py-4 text-base"
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
                {(() => {
                  const Icon = cat.icon;
                  return <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{cat.name}</span>;
                })()}
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
              const CategoryIcon = categoryData?.icon;
              return (
                <div key={category}>
                  {/* Category Header */}
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    {CategoryIcon && <CategoryIcon className="h-5 w-5 text-[var(--brand)]" />}
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
                          className="premium-card overflow-hidden transition-all"
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
                              maxHeight: isOpen ? "2000px" : "0px",
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
              Can't find your answer? Email support@aiautotraffic.com or post in the
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
