import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";

export type WpPublishingFrequency = "manual" | "daily" | "weekly" | "automated";

export interface WordPressSitePublic {
  id: number;
  siteName: string;
  siteUrl: string;
  domain: string;
  username: string;
  wpUserId: number | null;
  wpDisplayName: string | null;
  wpVersion: string | null;
  restOk: boolean;
  publishingAccess: boolean;
  connectionHealth: string;
  publishingFrequency: WpPublishingFrequency;
  seoSyncStatus: string;
  lastPublishAt: string | null;
  lastVerifiedAt: string | null;
  assetsDeployed: number;
  createdAt: string;
  updatedAt: string;
}

type StepKey = "details" | "auth" | "test" | "done";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "details", label: "Site Details" },
  { key: "auth", label: "Authentication" },
  { key: "test", label: "Connection Test" },
  { key: "done", label: "Publishing Ready" },
];

function stepIndex(phase: StepKey): number {
  switch (phase) {
    case "details":
      return 0;
    case "auth":
      return 1;
    case "test":
      return 2;
    case "done":
      return 3;
    default:
      return 0;
  }
}

interface ConnectWordPressPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void | Promise<void>;
}

const REST_ME_PATH = "/wp-json/wp/v2/users/me";

export function ConnectWordPressPanel({ open, onOpenChange, onConnected }: ConnectWordPressPanelProps) {
  const [phase, setPhase] = useState<StepKey>("details");
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [connectedSite, setConnectedSite] = useState<WordPressSitePublic | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhase("details");
      setSiteName("");
      setSiteUrl("");
      setUsername("");
      setApplicationPassword("");
      setShowPassword(false);
      setSubmitting(false);
      setError(null);
      setErrorCode(null);
      setConnectedSite(null);
    }
  }, [open]);

  const activeIdx =
    phase === "done" ? STEPS.length : stepIndex(phase);

  const copyEndpoint = async () => {
    const base = siteUrl.trim() || "https://yoursite.com";
    let line = `GET ${base.replace(/\/$/, "")}${REST_ME_PATH}`;
    try {
      const u = new URL(base.startsWith("http") ? base : `https://${base}`);
      line = `GET ${u.origin.replace(/\/$/, "")}${u.pathname.replace(/\/$/, "")}${REST_ME_PATH}`;
    } catch {
      /* keep template */
    }
    await navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyAndConnect = async () => {
    setError(null);
    setErrorCode(null);
    if (!siteUrl.trim()) {
      setError("Enter your WordPress site URL.");
      setPhase("details");
      return;
    }
    if (!username.trim() || !applicationPassword.trim()) {
      setError("Enter your WordPress username and application password.");
      setPhase("auth");
      return;
    }

    setSubmitting(true);
    setPhase("test");

    try {
      const res = await fetch("/api/wordpress/sites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName.trim(),
          siteUrl: siteUrl.trim(),
          username: username.trim(),
          applicationPassword,
          publishingFrequency: "manual",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok === false) {
        let msg =
          data.message ||
          (typeof data.error === "string" ? data.error : null) ||
          "We could not complete the connection. Check your details and try again.";
        
        // Append detail if available
        if (data.detail && typeof data.detail === "string") {
          msg += ` (${data.detail})`;
        }
        
        setError(msg);
        setErrorCode(typeof data.code === "string" ? data.code : null);
        setPhase("auth");
        setSubmitting(false);
        return;
      }

      setConnectedSite(data.site as WordPressSitePublic);
      setApplicationPassword("");
      setPhase("done");
      void onConnected();
    } catch {
      setError("Network error — try again in a moment.");
      setPhase("auth");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/35 backdrop-blur-[2px] transition-opacity"
        aria-label="Close panel"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative flex h-full w-full max-w-[min(100vw,720px)] flex-col border-l border-neutral-200/80 bg-[#fafbfc] shadow-[0_0_80px_-20px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wp-connect-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200/70 bg-white/90 px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Publishing destination
            </p>
            <h2 id="wp-connect-title" className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              Connect WordPress Site
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
              Link your publishing destination to deploy AI-generated assets directly from the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Steps */}
        <div className="shrink-0 border-b border-neutral-200/60 bg-white/60 px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((s, i) => {
              const done = i < activeIdx || phase === "done";
              const current = phase !== "done" && i === Math.min(activeIdx, STEPS.length - 1);
              return (
                <div key={s.key} className="flex min-w-0 flex-1 items-center">
                  <div className="flex min-w-0 flex-col items-center gap-1.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                        done
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                          : current
                            ? "bg-neutral-900 text-white ring-2 ring-neutral-900/10"
                            : "border border-neutral-200 bg-white text-neutral-400"
                      }`}
                    >
                      {done ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={`hidden text-center text-[10px] font-medium uppercase tracking-wide sm:block ${
                        current ? "text-neutral-900" : "text-neutral-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-0.5 h-px flex-1 sm:mx-1 ${i < activeIdx || phase === "done" ? "bg-emerald-400/80" : "bg-neutral-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {phase === "done" && connectedSite ? (
            <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-8">
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-tight">Connected successfully</p>
                    <p className="text-sm text-emerald-700/90">REST API verified and publishing access confirmed.</p>
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-4 rounded-xl border border-neutral-200/60 bg-white/90 p-4">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(connectedSite.domain)}&sz=64`}
                    alt=""
                    className="h-12 w-12 rounded-xl border border-neutral-100 bg-neutral-50"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-950">{connectedSite.siteName}</p>
                    <p className="text-sm text-neutral-500">{connectedSite.domain}</p>
                    <dl className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
                      <div>
                        <dt className="text-neutral-400">WordPress user</dt>
                        <dd className="font-medium text-neutral-800">{connectedSite.wpDisplayName || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">REST API</dt>
                        <dd className="font-medium text-emerald-700">Reachable</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">WordPress version</dt>
                        <dd className="font-medium text-neutral-800">{connectedSite.wpVersion || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">Connected</dt>
                        <dd className="font-medium text-neutral-800">
                          {new Date(connectedSite.updatedAt || connectedSite.createdAt).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                  >
                    Start Publishing
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    to="/content"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    Open Content Studio
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                {error && (
                  <div
                    className="mb-6 rounded-xl border border-rose-200/90 bg-rose-50/90 px-4 py-3 text-sm text-rose-900"
                    role="alert"
                  >
                    <p className="font-medium">{errorCode ? `${errorCode.replace(/_/g, " ")}` : "Connection issue"}</p>
                    <p className="mt-1 text-rose-800/90">{error}</p>
                  </div>
                )}

                <div className="mb-8 grid gap-8 lg:grid-cols-2 lg:gap-10">
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Website details</h3>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="wp-site-name" className="text-neutral-700">
                          Site name
                        </Label>
                        <Input
                          id="wp-site-name"
                          placeholder="Growth Blog"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          onFocus={() => setPhase("details")}
                          className="h-11 rounded-xl border-neutral-200 bg-white"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wp-site-url" className="text-neutral-700">
                          Site URL
                        </Label>
                        <Input
                          id="wp-site-url"
                          placeholder="https://mysite.com"
                          value={siteUrl}
                          onChange={(e) => setSiteUrl(e.target.value)}
                          onFocus={() => setPhase("details")}
                          className="h-11 rounded-xl border-neutral-200 bg-white"
                          autoComplete="url"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Authentication</h3>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="wp-username" className="text-neutral-700">
                          Username
                        </Label>
                        <Input
                          id="wp-username"
                          placeholder="admin"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setPhase("auth")}
                          className="h-11 rounded-xl border-neutral-200 bg-white"
                          autoComplete="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wp-app-pass" className="text-neutral-700">
                          Application password
                        </Label>
                        <div className="relative">
                          <Input
                            id="wp-app-pass"
                            type={showPassword ? "text" : "password"}
                            placeholder="Paste the generated password"
                            value={applicationPassword}
                            onChange={(e) => setApplicationPassword(e.target.value)}
                            onFocus={() => setPhase("auth")}
                            className="h-11 rounded-xl border-neutral-200 bg-white pr-11 font-mono text-sm"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        W
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900">How to generate an Application Password</p>
                        <ol className="mt-3 space-y-2 text-sm text-neutral-600">
                          <li className="flex gap-2">
                            <span className="font-mono text-xs text-neutral-400">1.</span>
                            Open WordPress Admin
                          </li>
                          <li className="flex gap-2">
                            <span className="font-mono text-xs text-neutral-400">2.</span>
                            Go to Users → Profile
                          </li>
                          <li className="flex gap-2">
                            <span className="font-mono text-xs text-neutral-400">3.</span>
                            Scroll to Application Passwords
                          </li>
                          <li className="flex gap-2">
                            <span className="font-mono text-xs text-neutral-400">4.</span>
                            Create a new password and copy it
                          </li>
                          <li className="flex gap-2">
                            <span className="font-mono text-xs text-neutral-400">5.</span>
                            Paste it here (spaces are optional)
                          </li>
                        </ol>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <a
                            href="https://wordpress.org/documentation/article/application-passwords/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:underline"
                          >
                            WordPress documentation
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={copyEndpoint}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copied ? "Copied" : "Copy REST check path"}
                          </button>
                        </div>
                        <p className="mt-2 font-mono text-[11px] text-neutral-400 break-all">
                          GET …{REST_ME_PATH}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="shrink-0 border-t border-neutral-200/80 bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="order-2 h-11 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleVerifyAndConnect}
                    className="order-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60 sm:order-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        Verify & Connect
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
