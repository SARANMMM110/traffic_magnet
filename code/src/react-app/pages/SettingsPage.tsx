import { useState, useEffect } from "react";
import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useAuth } from "@getmocha/users-service/react";
import { useToast } from "@/react-app/components/Toast";
import { ArrowLeft, Eye, EyeOff, Info, Check, KeyRound } from "lucide-react";

interface UsageData {
  projects: number;
  tools: number;
  niches: number;
  plan: string;
  limit: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [ideogramKey, setIdeogramKey] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showIdeogram, setShowIdeogram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ openai?: string; anthropic?: string }>({});
  const [usage, setUsage] = useState<UsageData>({
    projects: 0,
    tools: 0,
    niches: 0,
    plan: "trial",
    limit: 3,
  });

  useEffect(() => {
    loadKeys();
    loadUsage();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/keys", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOpenaiKey(data.openai_key || "");
        setAnthropicKey(data.anthropic_key || "");
        setIdeogramKey(data.ideogram_key || "");
      }
    } catch (error) {
      console.error("Failed to load keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      const response = await fetch("/api/usage", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to load usage:", error);
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    // Simple hash function to get consistent color from email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#7C5CFC", // brand purple
      "#3B82F6", // blue
      "#10B981", // green
      "#F59E0B", // amber
      "#EC4899", // pink
      "#8B5CF6", // violet
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const validateKeys = () => {
    const newErrors: { openai?: string; anthropic?: string } = {};

    if (openaiKey && !openaiKey.startsWith("sk-")) {
      newErrors.openai = "OpenAI API key must start with 'sk-'";
    }

    if (anthropicKey && !anthropicKey.startsWith("sk-ant-")) {
      newErrors.anthropic = "Anthropic API key must start with 'sk-ant-'";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveKeys = async () => {
    if (!validateKeys()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/settings/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          openai_key: openaiKey || null,
          anthropic_key: anthropicKey || null,
          ideogram_key: ideogramKey || null,
        }),
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Keys saved!",
          message: "Your API keys are stored securely.",
        });
      } else {
        showToast({
          type: "error",
          title: "Save failed",
          message: "Could not save API keys. Please try again.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const usagePercent = (usage.projects / usage.limit) * 100;

  const getProgressColor = () => {
    if (usagePercent >= 100) return "#EF4444"; // red
    if (usagePercent >= 75) return "#F59E0B"; // amber
    return "#7C5CFC"; // brand purple
  };

  const getPlanBadgeStyle = () => {
    switch (usage.plan) {
      case "trial":
        return { background: "#FEF3C7", color: "#92400E" };
      case "starter":
        return { background: "#DBEAFE", color: "#1E40AF" };
      case "pro":
        return { background: "#EDE9FE", color: "#7C3AED" };
      default:
        return { background: "#F3F4F6", color: "#6B7280" };
    }
  };

  const getPlanLabel = () => {
    switch (usage.plan) {
      case "trial":
        return "Trial";
      case "starter":
        return "Starter";
      case "pro":
        return "Pro";
      default:
        return "Free";
    }
  };

  return (
    <DashboardLayout>
      <div className="page-shell max-w-2xl">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Account Settings</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage your profile and API keys
          </p>
        </div>

        {/* Profile Card */}
        <div className="premium-card p-6 mb-6">
          {/* Top Row */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{
                background: user ? getAvatarColor(user.google_user_data.email) : "#7C5CFC",
              }}
            >
              {user ? getInitials(user.google_user_data.email) : "?"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg mb-0.5" style={{ color: "var(--text-primary)" }}>
                {user?.google_user_data.name || "User"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {user?.google_user_data.email}
              </p>
            </div>

            <div className="text-right">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium mb-1"
                style={getPlanBadgeStyle()}
              >
                {getPlanLabel()}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                User Account
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px my-6" style={{ background: "var(--border)" }} />

          {/* Lifetime Usage */}
          <div className="mb-6">
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
            >
              LIFETIME USAGE
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 mr-4">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(usagePercent, 100)}%`,
                      background: getProgressColor(),
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {usage.projects} / {usage.limit}
              </span>
            </div>
          </div>

          {/* Your Plan Includes */}
          <div>
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
            >
              YOUR PLAN INCLUDES
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#10B981" }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-white">
                  {usage.limit} lifetime Traffic Magnets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#10B981" }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  Blueprint generation</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#10B981" }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>Build standalone & embed tools</span>
              </div>
            </div>

            {usage.plan === "trial" && (
              <button
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                  boxShadow: "0 0 20px var(--brand-glow)",
                }}
              >
                Upgrade Plan
              </button>
            )}
          </div>
        </div>

        {/* API Keys Card */}
        <div className="premium-card p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="icon-tile h-10 w-10">
              <KeyRound className="h-5 w-5" />
            </span>
            <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Your API Keys</h3>
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Bring your own API keys to power the AI features. Keys are stored securely on
            your account.
          </p>

          {/* OpenAI Key */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>OpenAI API Key</label>
              <div className="flex items-center gap-3">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--brand)" }}
                >
                  Get key →
                </a>
                <a
                  href="https://platform.openai.com/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--brand)" }}
                >
                  Check usage →
                </a>
              </div>
            </div>
            <div className="relative">
              <input
                type={showOpenai ? "text" : "password"}
                value={openaiKey}
                onChange={(e) => {
                  setOpenaiKey(e.target.value);
                  if (errors.openai) setErrors({ ...errors, openai: undefined });
                }}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  border: errors.openai
                    ? "1px solid #EF4444"
                    : "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "var(--text-muted)" }}
              >
                {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.openai ? (
              <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
                {errors.openai}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Used for blueprint generation, tool building, and landing pages.
              </p>
            )}
          </div>

          {/* Anthropic Key */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Anthropic API Key</label>
              <div className="flex items-center gap-3">
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--brand)" }}
                >
                  Get key →
                </a>
                <a
                  href="https://console.anthropic.com/settings/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--brand)" }}
                >
                  Check usage →
                </a>
              </div>
            </div>
            <div className="relative">
              <input
                type={showAnthropic ? "text" : "password"}
                value={anthropicKey}
                onChange={(e) => {
                  setAnthropicKey(e.target.value);
                  if (errors.anthropic) setErrors({ ...errors, anthropic: undefined });
                }}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  border: errors.anthropic
                    ? "1px solid #EF4444"
                    : "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "var(--text-muted)" }}
              >
                {showAnthropic ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.anthropic ? (
              <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
                {errors.anthropic}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Optional alternative AI provider.
              </p>
            )}
          </div>

          {/* Ideogram Key */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Ideogram API Key</label>
              <a
                href="https://ideogram.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--brand)" }}
              >
                Get key →
              </a>
            </div>
            <div className="relative">
              <input
                type={showIdeogram ? "text" : "password"}
                value={ideogramKey}
                onChange={(e) => setIdeogramKey(e.target.value)}
                placeholder="api_key..."
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => setShowIdeogram(!showIdeogram)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "var(--text-muted)" }}
              >
                {showIdeogram ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Used for generating hero images in the Content Wrapper tool.
            </p>
          </div>

          {/* Info Banner */}
          <div
            className="flex gap-3 p-4 rounded-lg mb-6"
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <Info className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} />
            <p className="text-sm" style={{ color: "#93C5FD" }}>
              Usage costs are billed directly to your API account — Magnet Lab does not
              charge for AI usage. Make sure you have credits available.
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveKeys}
            disabled={saving || loading}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
            }}
          >
            {saving ? "Saving..." : "💾 Save Keys"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
