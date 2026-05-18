import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { cn } from "@/react-app/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { Input } from "@/react-app/components/ui/input";
import { Separator } from "@/react-app/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/react-app/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Globe2,
  Hammer,
  KeyRound,
  Lightbulb,
  Mail,
  Rocket,
  Search,
  Settings,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

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

const CATEGORIES: { icon: LucideIcon; name: string }[] = [
  { icon: Rocket, name: "Getting Started" },
  { icon: CircleDollarSign, name: "Pricing & Plans" },
  { icon: Hammer, name: "Building Assets" },
  { icon: KeyRound, name: "API Keys" },
  { icon: TrendingUp, name: "Traffic & SEO" },
  { icon: Globe2, name: "Domains & Embedding" },
  { icon: BriefcaseBusiness, name: "Use Cases" },
];

function faqIndex(item: FAQItem): number {
  return FAQ_DATA.findIndex((f) => f.question === item.question && f.category === item.category);
}

export default function HelpFAQ() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [feedback, setFeedback] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredFAQs = useMemo(
    () =>
      FAQ_DATA.filter((item) => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          searchQuery === "" ||
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      }),
    [searchQuery, selectedCategory]
  );

  const groupedFAQs = useMemo(() => {
    const g: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach((item) => {
      if (!g[item.category]) g[item.category] = [];
      g[item.category].push(item);
    });
    return g;
  }, [filteredFAQs]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = { All: FAQ_DATA.length };
    FAQ_DATA.forEach((item) => {
      m[item.category] = (m[item.category] || 0) + 1;
    });
    return m;
  }, []);

  const handleFeedback = (index: number, helpful: boolean) => {
    setFeedback((prev: Map<number, boolean>) => new Map(prev).set(index, helpful));
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-full overflow-x-hidden pb-20">
        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-[10%] top-0 h-[min(520px,70vh)] w-[min(560px,55vw)] rounded-[40%] bg-primary/[0.07] blur-3xl" />
          <div className="absolute -left-[8%] top-32 h-[380px] w-[440px] rounded-full bg-violet-500/[0.06] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, hsl(var(--border-hsl) / 0.55) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-2 sm:px-4 lg:px-6">
          {/* Editorial hero */}
          <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl shadow-slate-900/25">
            <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(99,91,255,0.12)_75%,rgba(8,145,178,0.08)_100%)]" />
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-white/[0.04] blur-2xl" />
            <div className="relative grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-end lg:gap-12 lg:py-12">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary/90" />
                  Help &amp; reference
                </div>
                <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
                  Answers built for{" "}
                  <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                    builders, not brochures.
                  </span>
                </h1>
                <p className="max-w-xl text-pretty text-sm leading-relaxed text-white/72 sm:text-[15px]">
                  Deep-dive guidance on scores, goals, pricing, APIs, SEO, hosting, and real-world playbooks—organized
                  like internal documentation so you can move fast without re-reading marketing fluff.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="border-0 bg-white/10 text-xs font-medium text-white hover:bg-white/15">
                    {FAQ_DATA.length} articles
                  </Badge>
                  <Badge variant="outline" className="border-white/20 bg-transparent text-xs font-medium text-white/85">
                    Curated categories
                  </Badge>
                </div>
              </div>

              <div className="relative lg:pb-1">
                <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-1 shadow-inner backdrop-blur-md">
                  <div className="rounded-xl bg-white p-1 shadow-lg">
                    <div className="relative rounded-lg bg-muted/30 p-3 sm:p-4">
                      <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-7" />
                      <Input
                        ref={searchRef}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search the knowledge base…"
                        className="h-12 rounded-xl border-border/80 bg-background pl-11 pr-20 text-[15px] shadow-sm sm:pl-12"
                        aria-label="Search help articles"
                      />
                      <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
                        /
                      </kbd>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] text-white/45 sm:text-left lg:text-left">
                  Press <kbd className="rounded border border-white/20 bg-white/10 px-1 font-mono">/</kbd> anywhere to
                  jump to search
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,248px)_minmax(0,1fr)_minmax(0,220px)] xl:gap-12">
            {/* Topic rail */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <div className="mb-4 lg:hidden">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Topic
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 w-full rounded-2xl border-border/80 shadow-sm">
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All topics ({categoryCounts.All})</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({categoryCounts[cat.name] ?? 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="hidden overflow-hidden border-border/70 shadow-md lg:block">
                <CardHeader className="border-b border-border/60 bg-gradient-to-br from-muted/40 to-background pb-4">
                  <CardTitle className="text-sm font-semibold tracking-tight">Chapters</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Pick a lane—counts show how many articles sit inside each topic.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className={cn(
                      "relative flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                      selectedCategory === "All"
                        ? "bg-primary/10 font-semibold text-foreground shadow-sm ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {selectedCategory === "All" && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <span className={cn("pl-1", selectedCategory === "All" && "pl-2")}>All topics</span>
                    <span className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {categoryCounts.All}
                    </span>
                  </button>
                  <Separator className="my-2" />
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const count = categoryCounts[cat.name] ?? 0;
                    const active = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={cn(
                          "relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                          active
                            ? "bg-primary/10 font-semibold text-foreground shadow-sm ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "opacity-70")} />
                        <span className={cn("min-w-0 flex-1 truncate", active && "pl-1")}>{cat.name}</span>
                        <span className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Main column */}
            <div className="min-w-0 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Showing{" "}
                    <span className="font-semibold tabular-nums text-foreground">{filteredFAQs.length}</span> of{" "}
                    <span className="tabular-nums">{FAQ_DATA.length}</span> articles
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl border-border/80" asChild>
                    <Link to="/settings">
                      <Settings className="h-3.5 w-3.5" />
                      Workspace
                    </Link>
                  </Button>
                </div>
              </div>

              {Object.keys(groupedFAQs).length === 0 ? (
                <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-b from-muted/30 to-background py-16 text-center shadow-none">
                  <CardContent className="mx-auto max-w-md space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Search className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-foreground">No matches</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Loosen your query or reset filters—we will surface every article again.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                      }}
                    >
                      Clear search &amp; topic
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                (Object.entries(groupedFAQs) as [string, FAQItem[]][]).map(([category, items]) => {
                  const categoryMeta = CATEGORIES.find((c) => c.name === category);
                  const CategoryIcon = categoryMeta?.icon ?? BookOpen;
                  return (
                    <section key={category} className="scroll-mt-6">
                      <Card className="overflow-hidden border-border/70 shadow-lg shadow-slate-900/[0.04]">
                        <CardHeader className="relative border-b border-border/60 bg-gradient-to-r from-muted/35 via-background to-primary/[0.04] pb-5">
                          <div className="absolute right-0 top-0 h-32 w-32 translate-x-6 -translate-y-8 rounded-full bg-primary/[0.06] blur-2xl" />
                          <div className="relative flex flex-wrap items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-sm">
                              <CategoryIcon className="h-5 w-5 text-primary" aria-hidden />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold tracking-tight">{category}</CardTitle>
                              <CardDescription className="text-xs sm:text-sm">
                                {items.length} answer{items.length === 1 ? "" : "s"} in this chapter
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="ml-auto font-mono text-[11px]">
                              {items.length} Q&amp;A
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Accordion
                            type="multiple"
                            className="w-full rounded-none border-0 bg-transparent p-0 shadow-none"
                          >
                            {items.map((item, qIdx) => {
                              const gid = faqIndex(item);
                              const safeId = gid >= 0 ? gid : item.question.length;
                              const hasFeedback = feedback.has(gid);
                              const qLabel = String(qIdx + 1).padStart(2, "0");

                              return (
                                <AccordionItem
                                  key={`${category}-${item.question}`}
                                  value={`article-${category}-${safeId}`}
                                  className="group/item border-0 border-t border-border/60 first:border-t-0 data-[state=open]:bg-gradient-to-b data-[state=open]:from-primary/[0.04] data-[state=open]:to-transparent"
                                >
                                  <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6 sm:py-5 [&>svg]:text-muted-foreground">
                                    <span className="flex items-start gap-3">
                                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/50 font-mono text-xs font-bold text-muted-foreground transition-colors group-hover/item:border-primary/25 group-hover/item:text-foreground group-data-[state=open]/item:border-primary/30 group-data-[state=open]/item:bg-primary/10 group-data-[state=open]/item:text-primary">
                                        {qLabel}
                                      </span>
                                      <span className="pr-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                                        {item.question}
                                      </span>
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-0">
                                    <div className="border-t border-border/50 bg-muted/[0.35] px-4 pb-5 pt-4 sm:px-8">
                                      <div
                                        className="max-w-[70ch] text-sm leading-relaxed text-muted-foreground [&_li]:my-1 [&_ul]:my-2 [&_ul]:pl-5"
                                        dangerouslySetInnerHTML={{ __html: item.answer }}
                                      />
                                      <Separator className="my-5" />
                                      {!hasFeedback ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs font-medium text-muted-foreground">
                                            Was this useful?
                                          </span>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-lg border-border/80 px-3 text-xs"
                                            onClick={() => handleFeedback(gid, true)}
                                          >
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            Yes
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-lg border-border/80 px-3 text-xs"
                                            onClick={() => handleFeedback(gid, false)}
                                          >
                                            <ThumbsDown className="h-3.5 w-3.5" />
                                            No
                                          </Button>
                                        </div>
                                      ) : (
                                        <p className="text-xs font-medium text-muted-foreground">
                                          Thanks—feedback recorded.
                                        </p>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </section>
                  );
                })
              )}

              <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Need a human?</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    For billing, API keys, or edge cases not covered here—reach support or tune your workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button className="rounded-xl shadow-sm" asChild>
                    <a href="mailto:support@aiautotraffic.com?subject=Help%20center%20question">
                      <Mail className="h-4 w-4" />
                      Email support
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border/80" asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4" />
                      Open settings
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Reference rail — desktop only */}
            <aside className="hidden xl:block">
              <div className="sticky top-4 space-y-4">
                <Card className="border-border/70 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">Quick signals</CardTitle>
                    </div>
                    <CardDescription className="text-xs leading-relaxed">
                      Shortcuts while you read—no tracking, just orientation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <p className="font-semibold text-foreground">Static delivery</p>
                      <p className="mt-1">Exported tools are plain HTML—fast globally, easy to cache.</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <p className="font-semibold text-foreground">API at build time</p>
                      <p className="mt-1">Keys power generation only; live visitors do not hit your LLM bill.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-muted/20 shadow-sm">
                  <CardContent className="flex items-center gap-3 pt-5">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Docs snapshot · refresh content when your product surface changes—we version answers with the app.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
