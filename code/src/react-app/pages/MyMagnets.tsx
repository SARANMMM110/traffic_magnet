import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Search, Zap, Loader2, ArrowRight } from "lucide-react";

interface Magnet {
  id: number;
  name: string;
  category: string;
  overall_score: number;
  blueprint: string | null;
  html_content: string | null;
  created_at: string;
  project_id: number;
  project_name: string;
}

interface UsageData {
  /** Finished tools (HTML generated) — same meaning as API `toolsCreated` */
  used: number;
  limit: number;
}

function parseApiCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function MyMagnets() {
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [usage, setUsage] = useState<UsageData>({ used: 0, limit: 10000 });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [progressWidth, setProgressWidth] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!usage.limit) return;
    const percentage = (usage.used / usage.limit) * 100;
    const t = setTimeout(() => setProgressWidth(percentage), 100);
    return () => clearTimeout(t);
  }, [usage]);

  const loadData = async () => {
    try {
      const [magnetsRes, usageRes] = await Promise.all([
        fetch("/api/magnets", { credentials: "include" }),
        fetch("/api/usage", { credentials: "include" }),
      ]);

      if (magnetsRes.ok) {
        const data = await magnetsRes.json();
        setMagnets(data.magnets || []);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        const used =
          data.toolsCreated !== undefined && data.toolsCreated !== null
            ? parseApiCount(data.toolsCreated)
            : 0;
        setUsage({ used, limit: 10000 });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = () => {
    const percentage = (usage.used / usage.limit) * 100;
    if (percentage >= 90) return "linear-gradient(90deg, #F43F5E, #E11D48)";
    if (percentage >= 70) return "linear-gradient(90deg, #F59E0B, #D97706)";
    return "linear-gradient(90deg, #00D084, #00A86B)";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#3B82F6";
    if (score >= 40) return "#F59E0B";
    return "#6B7280";
  };

  const filteredMagnets = magnets
    .filter((magnet) => {
      const matchesSearch =
        magnet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        magnet.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        magnet.project_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.overall_score - a.overall_score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  const usagePercentage = (usage.used / usage.limit) * 100;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-shell max-w-6xl">
        {/* Header */}
        <div className="surface-panel mb-8 p-6">
          <div className="section-eyebrow mb-2">Tool library</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>My tools</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Tools with a saved blueprint across your projects. The usage meter counts{" "}
            <strong>finished tools</strong> — rows where the interactive HTML has been generated at least
            once — not discovery-only ideas still sitting in a project.
          </p>
        </div>

        {/* Usage Meter Card */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {usage.used} of {usage.limit} finished tools (HTML generated)
            </p>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {usage.used} / {usage.limit}
            </p>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden mb-3"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-[800ms] ease-out"
              style={{
                width: `${progressWidth}%`,
                background: getProgressColor(),
              }}
            />
          </div>

          {/* Warning Messages */}
          {usagePercentage >= 100 && (
            <div>
              <p className="text-sm font-medium" style={{ color: "#F43F5E" }}>
                You&apos;ve reached your lifetime cap for finished tools.
              </p>
              <Link
                to="/settings"
                className="text-sm font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                style={{ color: "var(--brand)" }}
              >
                Upgrade your plan
              </Link>
            </div>
          )}
          {usagePercentage >= 80 && usagePercentage < 100 && (
            <p className="text-sm font-medium" style={{ color: "#F59E0B" }}>
              Running low — {usage.limit - usage.used} tool slots remaining.
            </p>
          )}
        </div>

        {/* Empty State */}
        {magnets.length === 0 && (
          <div className="text-center py-20">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(124, 92, 252, 0.15)" }}
            >
              <Zap className="w-10 h-10" style={{ color: "var(--brand)" }} />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No projects yet</h3>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              Create a project to start generating business asset ideas
            </p>
            <Link to="/projects/new">
              <button
                className="btn-primary rounded-2xl px-6 py-3 font-semibold"
              >
                Create Your First Project
              </button>
            </Link>
          </div>
        )}

        {/* Magnets List */}
        {magnets.length > 0 && (
          <div>
            {/* Sort Bar */}
            <div className="flex items-center gap-3 mb-6">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-premium px-4 py-3 text-sm"
              >
                <option value="date">Sort by: Date</option>
                <option value="name">Sort by: Name</option>
                <option value="score">Sort by: Score</option>
              </select>

              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="input-premium w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            {/* Magnet Rows */}
            <div className="space-y-3">
              {filteredMagnets.map((magnet) => {
                return (
                  <div
                    key={magnet.id}
                    className="premium-card p-5 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                          {magnet.name}
                        </h3>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: `${getScoreColor(magnet.overall_score)}20`,
                            color: getScoreColor(magnet.overall_score),
                          }}
                        >
                          {magnet.overall_score}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>{magnet.category}</span>
                        <span>·</span>
                        <span>
                          {new Date(magnet.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/projects/${magnet.project_id}?tab=blueprint`)}
                      className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:opacity-80"
                      style={{
                        color: "var(--brand)",
                      }}
                    >
                      View Blueprint
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
