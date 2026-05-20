import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Copy,
  Check,
  Code,
  Trash2,
  RefreshCw,
  Settings,
  Palette,
  MessageSquare,
} from "lucide-react";

interface EmbedConfig {
  mode: "popup" | "inline";
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  greeting: string;
  buttonText: string;
  position: "bottom-right" | "bottom-left";
  targetElement: string;
}

interface Deployment {
  id: number;
  public_id: string;
  embed_code: string;
  config: string;
  is_active: number;
  created_at: string;
}

export default function GPTEmbed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gptName, setGptName] = useState("");
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [embedCode, setEmbedCode] = useState("");

  const [config, setConfig] = useState<EmbedConfig>({
    mode: "popup",
    theme: {
      primaryColor: "#7C5CFC",
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
    },
    greeting: "Hi! How can I help you today?",
    buttonText: "Chat",
    position: "bottom-right",
    targetElement: "mocha-gpt-widget",
  });

  useEffect(() => {
    loadGPT();
    loadDeployments();
  }, [id]);

  async function loadGPT() {
    try {
      const response = await fetch(`/api/gpts/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setGptName(data.name);
        setConfig((prev) => ({
          ...prev,
          buttonText: data.name,
        }));
      }
    } catch (error) {
      console.error("Failed to load GPT:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDeployments() {
    try {
      const response = await fetch(`/api/gpts/${id}/embed/deployments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error("Failed to load deployments:", error);
    }
  }

  async function generateEmbedCode() {
    setGenerating(true);
    try {
      const response = await fetch(`/api/gpts/${id}/embed/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        setEmbedCode(data.embed_code);
        await loadDeployments();
      }
    } catch (error) {
      console.error("Failed to generate embed code:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function deleteDeployment(deploymentId: number) {
    if (!confirm("Delete this widget deployment?")) return;

    try {
      const response = await fetch(`/api/gpts/${id}/embed/${deploymentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await loadDeployments();
        setEmbedCode("");
      }
    } catch (error) {
      console.error("Failed to delete deployment:", error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(`/gpts/${id}/edit`)}
            className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Embeddable Widget
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Add {gptName} to any website with a simple code snippet
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Settings className="h-5 w-5" />
                Widget Mode
              </h2>
              <div className="grid gap-3">
                <button
                  onClick={() => setConfig({ ...config, mode: "popup" })}
                  className={`rounded-lg border p-4 text-left transition ${
                    config.mode === "popup"
                      ? "border-purple-600 bg-purple-600/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-400" />
                    <span className="font-semibold text-white">
                      Popup Chat Bubble
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Floating button in corner that opens chat overlay
                  </p>
                </button>
                <button
                  onClick={() => setConfig({ ...config, mode: "inline" })}
                  className={`rounded-lg border p-4 text-left transition ${
                    config.mode === "inline"
                      ? "border-purple-600 bg-purple-600/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-400" />
                    <span className="font-semibold text-white">
                      Inline Embed
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Embedded directly in your page content
                  </p>
                </button>
              </div>
            </div>

            {/* Customization */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Palette className="h-5 w-5" />
                Appearance
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.theme.primaryColor}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-20 cursor-pointer rounded-lg border border-slate-700"
                    />
                    <input
                      type="text"
                      value={config.theme.primaryColor}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                    />
                  </div>
                </div>

                {config.mode === "popup" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setConfig({ ...config, position: "bottom-right" })
                        }
                        className={`rounded-lg border py-2 text-sm transition ${
                          config.position === "bottom-right"
                            ? "border-purple-600 bg-purple-600/10 text-white"
                            : "border-slate-700 bg-slate-800/50 text-slate-400"
                        }`}
                      >
                        Bottom Right
                      </button>
                      <button
                        onClick={() =>
                          setConfig({ ...config, position: "bottom-left" })
                        }
                        className={`rounded-lg border py-2 text-sm transition ${
                          config.position === "bottom-left"
                            ? "border-purple-600 bg-purple-600/10 text-white"
                            : "border-slate-700 bg-slate-800/50 text-slate-400"
                        }`}
                      >
                        Bottom Left
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={config.buttonText}
                    onChange={(e) =>
                      setConfig({ ...config, buttonText: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Greeting Message
                  </label>
                  <textarea
                    value={config.greeting}
                    onChange={(e) =>
                      setConfig({ ...config, greeting: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>

                {config.mode === "inline" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Target Element ID
                    </label>
                    <input
                      type="text"
                      value={config.targetElement}
                      onChange={(e) =>
                        setConfig({ ...config, targetElement: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      The HTML element ID where the widget will be embedded
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateEmbedCode}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="h-5 w-5" />
                  Generate Embed Code
                </>
              )}
            </button>
          </div>

          {/* Embed Code & Deployments */}
          <div className="space-y-6">
            {embedCode && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Embed Code
                  </h2>
                  <button
                    onClick={() => copyToClipboard(embedCode)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
                  {embedCode}
                </pre>
                <p className="mt-4 text-sm text-slate-400">
                  Paste this code in your website's HTML, just before the
                  closing <code className="text-purple-400">&lt;/body&gt;</code>{" "}
                  tag.
                </p>
              </div>
            )}

            {/* Previous Deployments */}
            {deployments.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Active Widgets ({deployments.length})
                </h2>
                <div className="space-y-3">
                  {deployments.map((deployment) => {
                    const deployConfig = JSON.parse(deployment.config);
                    return (
                      <div
                        key={deployment.id}
                        className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: deployConfig.theme?.primaryColor,
                              }}
                            />
                            <span className="font-medium text-white">
                              {deployConfig.mode === "popup"
                                ? "Popup Widget"
                                : "Inline Widget"}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteDeployment(deployment.id)}
                            className="text-slate-400 transition hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mb-2 text-xs text-slate-400">
                          Created {formatDate(deployment.created_at)}
                        </p>
                        <button
                          onClick={() => {
                            setEmbedCode(deployment.embed_code);
                          }}
                          className="text-sm text-purple-400 hover:underline"
                        >
                          View embed code
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
