import { useState, useEffect, useMemo, useCallback, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Input } from "@/react-app/components/ui/input";
import { Button } from "@/react-app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { cn } from "@/react-app/lib/utils";
import { ArrowRight, Layers, Search } from "lucide-react";

interface Magnet {
  id: number;
  name: string;
  category: string;
  overall_score: number;
  traffic_score?: number;
  link_score?: number;
  monetization_score?: number;
  description?: string | null;
  blueprint: string | null;
  html_content: string | null;
  created_at: string;
  updated_at?: string;
  project_id: number;
  project_name: string;
}

function parseApiCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatRelative(iso: string | undefined) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return h <= 0 ? "Just now" : `${h}h ago`;
  const d = Math.floor(diff / 86400000);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function projectMonogram(projectName: string) {
  const match = projectName.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "?";
}

type FilterPill = "all" | "live" | "blueprint" | "high";

const FILTER_OPTIONS: { id: FilterPill; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Published" },
  { id: "blueprint", label: "Blueprint" },
  { id: "high", label: "High score" },
];

export default function MyMagnets() {
  const navigate = useNavigate();
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [blueprintCount, setBlueprintCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterPill>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [magnetsRes, usageRes] = await Promise.all([
        fetch("/api/magnets", { credentials: "include" }),
        fetch("/api/usage", { credentials: "include" }),
      ]);

      if (magnetsRes.ok) {
        const data = await magnetsRes.json();
        setMagnets((data.magnets || []) as Magnet[]);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        const used =
          data.toolsWithBlueprint !== undefined && data.toolsWithBlueprint !== null
            ? parseApiCount(data.toolsWithBlueprint)
            : 0;
        setBlueprintCount(used);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMagnets = useMemo(() => {
    return magnets
      .filter((m: Magnet) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.project_name.toLowerCase().includes(q);
        if (!matchesSearch) return false;
        if (filter === "live") return !!m.html_content;
        if (filter === "blueprint") return !m.html_content;
        if (filter === "high") return m.overall_score >= 82;
        return true;
      })
      .sort((a: Magnet, b: Magnet) => {
        if (sortBy === "score") return b.overall_score - a.overall_score;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      });
  }, [magnets, searchQuery, sortBy, filter]);

  const openEngine = useCallback(
    (m: Magnet) => {
      navigate(`/projects/${m.project_id}?tab=blueprint&toolId=${m.id}`);
    },
    [navigate]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl px-2">
          <div className="h-56 animate-pulse rounded-3xl bg-slate-800/40 md:h-64" />
          <div className="mx-auto -mt-6 max-w-3xl rounded-2xl border border-border/60 bg-card p-4 shadow-xl">
            <div className="h-10 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-muted/60" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-2 pb-20 md:px-3">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-10 text-white shadow-2xl shadow-slate-900/25 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--brand)" }}
          />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_minmax(0,0.85fr)] lg:items-end lg:gap-16">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-indigo-200/90">
                Workspace library
              </p>
              <h1 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight md:text-5xl lg:text-[3.25rem]">
                Your
                <span className="mt-1 block font-semibold text-white">blueprints &amp; builds</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400 md:text-[15px]">
                Every saved tool lives here. Pick a tile to jump back into the editor — no extra
                chrome.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  Plan &amp; limits
                  <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
                </Link>
                {magnets.length > 0 && (
                  <span className="text-sm tabular-nums text-slate-400">
                    <span className="font-semibold text-white">{magnets.length}</span> in this view
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md lg:text-right">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-200/90">
                Blueprint count
              </p>
              <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight text-white md:text-6xl">
                {blueprintCount.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-slate-400">Tools with a saved blueprint on your account</p>
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-7 max-w-4xl px-1 md:-mt-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 md:flex-row md:items-center md:gap-2 md:p-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Filter by name or project…"
                className="h-11 rounded-full border-0 bg-muted/50 pl-11 shadow-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-[var(--brand)]/25"
              />
            </div>
            <nav
              className="flex shrink-0 items-center gap-0 overflow-x-auto border-t border-border/50 pt-2 md:border-t-0 md:pt-0"
              aria-label="Tool filters"
            >
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilter(opt.id)}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors md:px-4",
                    filter === opt.id
                      ? "border-[var(--brand)] font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </nav>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 w-full shrink-0 rounded-full border-0 bg-muted/50 text-xs font-medium shadow-none md:w-[140px] md:bg-transparent">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Last updated</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-12 md:mt-14">
          {magnets.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 py-20 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} aria-hidden />
              <p className="mt-4 text-base font-medium text-foreground">Nothing here yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Start a project and save a blueprint — it will appear as a tile.
              </p>
              <Button asChild className="mt-8 rounded-full px-8" size="default">
                <Link to="/projects/new">Create project</Link>
              </Button>
            </div>
          ) : filteredMagnets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 py-16 text-center">
              <p className="font-medium text-foreground">No matches</p>
              <p className="mt-1 text-sm text-muted-foreground">Loosen filters or clear search.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-2 border-b border-border/40 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Registry
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{filteredMagnets.length}</span>
                    {" visible · "}
                    <span className="tabular-nums">{magnets.length}</span> total
                  </p>
                </div>
              </div>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                {filteredMagnets.map((magnet: Magnet) => (
                  <li key={magnet.id}>
                    <ToolTile magnet={magnet} onOpen={() => openEngine(magnet)} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ToolTile({ magnet, onOpen }: { magnet: Magnet; onOpen: () => void }) {
  const live = !!magnet.html_content;
  const overall = magnet.overall_score;
  const letter = projectMonogram(magnet.project_name);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${magnet.name}`}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl text-left transition-all duration-300",
        "bg-gradient-to-b from-white to-slate-50/90 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(99,91,255,0.08)]",
        "ring-1 ring-slate-200/80 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(99,91,255,0.18)] hover:ring-[var(--brand)]/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-2",
        "dark:from-slate-950 dark:to-slate-900 dark:ring-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, rgba(99, 91, 255, 0.07), transparent 50%), radial-gradient(80% 60% at 0% 100%, rgba(6, 182, 212, 0.05), transparent 45%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:via-white/20" />

      <div className="relative flex gap-4 p-5 md:gap-5 md:p-6">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold tabular-nums shadow-inner",
            "bg-gradient-to-br from-[var(--brand-soft)] to-indigo-100/90 text-[var(--brand)] ring-1 ring-indigo-200/50",
            "dark:from-indigo-950 dark:to-slate-900 dark:text-indigo-200 dark:ring-white/10"
          )}
          aria-hidden
        >
          {letter}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                live ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" : "bg-slate-400 dark:bg-slate-500"
              )}
              aria-hidden
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {live ? "Published" : "Blueprint"}
            </span>
          </div>
          <h2 className="mt-2.5 line-clamp-2 text-[1.05rem] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50 md:text-[1.1rem]">
            {magnet.name}
          </h2>
          <p className="mt-1.5 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground">
            {magnet.project_name}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div
            className={cn(
              "flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl text-lg font-bold tabular-nums text-white shadow-lg",
              overall >= 85
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
                : overall >= 70
                  ? "bg-gradient-to-br from-[var(--brand)] to-indigo-700 shadow-[var(--brand-glow)]"
                  : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
            )}
            title="Opportunity score"
          >
            {overall}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-5 py-3 dark:border-white/10 dark:bg-white/[0.04] md:px-6">
        <time
          className="text-[11px] font-medium tabular-nums tracking-wide text-muted-foreground"
          dateTime={magnet.updated_at || magnet.created_at}
        >
          {formatRelative(magnet.updated_at || magnet.created_at)}
        </time>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] transition group-hover:gap-2">
          Continue
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </button>
  );
}
