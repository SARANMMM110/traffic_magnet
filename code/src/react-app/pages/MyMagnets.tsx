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
  used: number;
  limit: number;
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
    // Animate progress bar
    if (usage.used && usage.limit) {
      const percentage = (usage.used / usage.limit) * 100;
      setTimeout(() => setProgressWidth(percentage), 100);
    }
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
        setUsage({ used: data.tools || 0, limit: 10000 }); // 10000 lifetime magnets for pro plan
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
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>My Magnets</h1>
          <p style={{ color: "var(--text-muted)" }}>
            All blueprints you've generated across your projects.
          </p>
        </div>

        {/* Usage Meter Card */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {usage.used} of {usage.limit} lifetime Traffic Magnets used
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
                You've used all your Traffic Magnets.
              </p>
              <Link
                to="/settings"
                className="text-sm font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                style={{ color: "var(--brand)" }}
              >
                ⚡ Upgrade your plan →
              </Link>
            </div>
          )}
          {usagePercentage >= 80 && usagePercentage < 100 && (
            <p className="text-sm font-medium" style={{ color: "#F59E0B" }}>
              Running low — {usage.limit - usage.used} magnets remaining.
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
            <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No magnets yet</h3>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              Create a project to start generating tool ideas
            </p>
            <Link to="/projects/new">
              <button
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                  boxShadow: "0 0 20px var(--brand-glow)",
                }}
              >
                → Create Your First Project
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
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
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
                  placeholder="Search magnets..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Magnet Rows */}
            <div className="space-y-3">
              {filteredMagnets.map((magnet) => {
                return (
                  <div
                    key={magnet.id}
                    className="glass-card p-5 flex items-center justify-between gap-4 hover:scale-[1.01] transition-all"
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
