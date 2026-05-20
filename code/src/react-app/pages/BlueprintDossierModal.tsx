import {
  useState,
  type ComponentType,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { cn } from "@/react-app/lib/utils";
import { VISUAL_THEMES, normalizeVisualThemeId } from "@/react-app/lib/visualThemes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Calculator,
  Check,
  CircleDollarSign,
  Code2,
  Download,
  FileOutput,
  GitBranch,
  Hash,
  LayoutTemplate,
  Link2,
  ListChecks,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import type { BlueprintDossierProject, BlueprintDossierTool } from "@/react-app/pages/BlueprintDossier";

const AUDIENCE_OPTIONS = [
  "General / Broad",
  "Small Business Owners",
  "Marketing Agencies",
  "Enterprise Teams",
  "Freelancers & Consultants",
] as const;

const MONETIZATION_OPTIONS = [
  "Lead Generation (email capture)",
  "Affiliate Links",
  "SaaS Subscription",
  "Freemium Upsell",
  "Services / Consulting",
] as const;

type VariationConfig = { audience: string; monetization: string };
type VariationResult = VariationConfig & Record<string, unknown> & { summary?: string };

function formatBlueprintHeading(raw: string): string {
  const trimmed = raw.trim();
  if (/^EEAT\b/i.test(trimmed)) {
    const rest = trimmed.replace(/^EEAT\s+/i, "");
    return rest ? `EEAT · ${formatBlueprintHeading(rest)}` : "EEAT";
  }
  return trimmed
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type BuildStep = "analyzing" | "logic" | "styling" | "embed" | "done";
type PanelTab = "blueprint" | "variations" | "landing";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 py-6 last:border-b-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export interface BlueprintDossierModalProps {
  tool: BlueprintDossierTool;
  project: BlueprintDossierProject | null;
  blueprint: Record<string, unknown>;
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  purpose: string;
  strategySections: { title: string; value: unknown }[];
  audiencePainPoints: string[];
  monetizationRoadmap: string[];
  eeatStructure: string[];
  keywords: string[];
  inputs: string;
  output: string;
  calculationLogic: string;
  monetization: string;
  linking: string;
  cta: string;
  features: string[];
  selectedTheme: string;
  setSelectedTheme: (id: string) => void;
  savingTheme: boolean;
  persistVisualTheme: (id: string) => void;
  buildStep: BuildStep | null;
  htmlBuildAction: "standalone" | "embed" | null;
  buildResult: { action: "standalone" | "embed"; html: string } | null;
  setBuildResult: Dispatch<
    SetStateAction<{ action: "standalone" | "embed"; html: string } | null>
  >;
  buildTool: (action: "standalone" | "embed") => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  copyBlueprint: () => void;
  regenerateBlueprint: () => void;
  generateBlueprint: () => void;
  generatingLanding: boolean;
  landingPageHtml: string | null;
  generateLandingPageHandler: () => void;
  downloadLandingPage: () => void;
  copyLandingPageHTML: () => void;
  regenerateLandingPage: () => void;
  onClose?: () => void;
  onNavigate: (path: string) => void;
  onToolUpdate?: (tool: BlueprintDossierTool) => void;
  showToast: (opts: { title: string; type: "success" | "error"; message?: string }) => void;
}

function VariationField({
  label,
  icon: Icon,
  value,
  onValueChange,
  options,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  onValueChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-white text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function VariationColumn({
  letter,
  badgeClass,
  audience,
  monetization,
  onAudienceChange,
  onMonetizationChange,
}: {
  letter: "A" | "B";
  badgeClass: string;
  audience: string;
  monetization: string;
  onAudienceChange: (v: string) => void;
  onMonetizationChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
            badgeClass,
          )}
        >
          {letter}
        </span>
        <span className="text-sm font-bold text-slate-900">Variation {letter}</span>
      </div>
      <VariationField
        label="Audience"
        icon={Users}
        value={audience}
        onValueChange={onAudienceChange}
        options={AUDIENCE_OPTIONS}
      />
      <VariationField
        label="Monetization"
        icon={CircleDollarSign}
        value={monetization}
        onValueChange={onMonetizationChange}
        options={MONETIZATION_OPTIONS}
      />
    </div>
  );
}

export default function BlueprintDossierModal({
  tool,
  project,
  blueprint,
  tab,
  onTabChange,
  purpose,
  strategySections,
  audiencePainPoints,
  monetizationRoadmap,
  eeatStructure,
  keywords,
  inputs,
  output,
  calculationLogic,
  monetization,
  linking,
  cta,
  features,
  selectedTheme,
  setSelectedTheme,
  savingTheme,
  persistVisualTheme,
  buildStep,
  htmlBuildAction,
  buildResult,
  setBuildResult,
  buildTool,
  copied,
  setCopied,
  copyBlueprint,
  regenerateBlueprint,
  generateBlueprint,
  generatingLanding,
  landingPageHtml,
  generateLandingPageHandler,
  downloadLandingPage,
  copyLandingPageHTML,
  regenerateLandingPage,
  // onClose,
  // onNavigate,
  onToolUpdate,
  showToast,
}: BlueprintDossierModalProps) {
  const [varA, setVarA] = useState<VariationConfig>({
    audience: AUDIENCE_OPTIONS[0],
    monetization: MONETIZATION_OPTIONS[0],
  });
  const [varB, setVarB] = useState<VariationConfig>({
    audience: AUDIENCE_OPTIONS[1],
    monetization: MONETIZATION_OPTIONS[1],
  });
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [variationResults, setVariationResults] = useState<{
    variationA: VariationResult;
    variationB: VariationResult;
  } | null>(null);
  const [applyingVariation, setApplyingVariation] = useState<"A" | "B" | null>(null);

  const tabs = [
    { id: "blueprint" as const, label: "Blueprint", icon: Sparkles },
    { id: "variations" as const, label: "Variations", icon: GitBranch },
    { id: "landing" as const, label: "Landing Page", icon: LayoutTemplate },
  ];

  const generateVariations = async () => {
    if (!tool.blueprint) {
      showToast({ title: "Generate a blueprint first", type: "error" });
      return;
    }
    setGeneratingVariations(true);
    setVariationResults(null);
    try {
      const res = await fetch(`/api/tools/${tool.id}/variations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationA: varA, variationB: varB }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to generate variations");
      }
      const data = await res.json();
      setVariationResults({ variationA: data.variationA, variationB: data.variationB });
      showToast({ title: "Variations generated!", type: "success" });
    } catch (e) {
      showToast({
        title: "Failed to generate variations",
        message: e instanceof Error ? e.message : undefined,
        type: "error",
      });
    } finally {
      setGeneratingVariations(false);
    }
  };

  const applyVariation = async (which: "A" | "B") => {
    if (!variationResults) return;
    const variation = which === "A" ? variationResults.variationA : variationResults.variationB;
    const { summary, audience, monetization, ...picked } = variation;
    setApplyingVariation(which);
    try {
      const next = JSON.stringify(picked);
      const res = await fetch(`/api/tools/${tool.id}/blueprint/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint: next }),
      });
      if (!res.ok) throw new Error("Failed to apply");
      onToolUpdate?.({ ...tool, blueprint: next });
      showToast({ title: `Variation ${which} applied`, type: "success" });
      onTabChange("blueprint");
    } catch {
      showToast({ title: "Failed to apply variation", type: "error" });
    } finally {
      setApplyingVariation(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-slate-100 px-6 pb-5 pt-6">
        <div className="mb-4 min-w-0 pr-10">
          <p className="text-xs font-medium text-slate-500">{tool.category}</p>
          <h2 className="mt-1 text-xl font-bold leading-tight text-slate-900">{tool.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{tool.description}</p>
          <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
            {project && <span>{project.name}</span>}
            {project && <span className="text-slate-300">·</span>}
            <span>
              Score <span className="font-semibold text-slate-700">{tool.overall_score}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span>Traffic {tool.traffic_score}</span>
            <span className="text-slate-300">·</span>
            <span>Links {tool.backlink_score}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                tab === id
                  ? "bg-slate-900 text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
        {tab === "blueprint" && (
          <div>
            {!tool.blueprint ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="text-sm font-medium text-slate-800">No blueprint yet</p>
                <p className="max-w-sm text-sm text-slate-500">
                  Generate a blueprint to unlock purpose, keywords, monetization, and export options.
                </p>
                <button
                  type="button"
                  onClick={generateBlueprint}
                  disabled={buildStep === "analyzing" || htmlBuildAction !== null}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {buildStep === "analyzing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate blueprint
                </button>
              </div>
            ) : (
              <>
                <Section icon={Target} title="Purpose">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{purpose}</p>
                </Section>

                {strategySections.map((section) => (
                  <Section key={section.title} icon={TrendingUp} title={formatBlueprintHeading(section.title)}>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {String(section.value)}
                    </p>
                  </Section>
                ))}

                {audiencePainPoints.length > 0 && (
                  <Section icon={Users} title="Audience pain points">
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                      {audiencePainPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </Section>
                )}

                <Section icon={Hash} title="Target keywords">
                  {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-500">Unspecified</p>
                  )}
                </Section>

                <Section icon={ListChecks} title="Inputs required">
                  <p className="whitespace-pre-line text-sm text-slate-700">{inputs || "Unspecified"}</p>
                </Section>

                <Section icon={FileOutput} title="Output type">
                  <p className="whitespace-pre-line text-sm text-slate-700">{output || "Unspecified"}</p>
                </Section>

                <Section icon={Calculator} title="Calculation logic">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {calculationLogic || "Unspecified"}
                  </p>
                </Section>

                {features.length > 0 && (
                  <Section icon={Sparkles} title="Features">
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                      {features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </Section>
                )}

                <Section icon={CircleDollarSign} title="Monetization strategy">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {monetization || "Unspecified"}
                  </p>
                </Section>

                {monetizationRoadmap.length > 0 && (
                  <Section icon={TrendingUp} title="Monetization roadmap">
                    <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
                      {monetizationRoadmap.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ol>
                  </Section>
                )}

                {eeatStructure.length > 0 && (
                  <Section icon={Check} title="EEAT structure">
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                      {eeatStructure.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </Section>
                )}

                <Section icon={Link2} title="Internal linking suggestions">
                  <p className="whitespace-pre-line text-sm text-slate-700">{linking || "Unspecified"}</p>
                </Section>

                <section className="py-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-orange-500" strokeWidth={1.75} />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Call to action</h3>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 px-4 py-4 ring-1 ring-orange-100">
                    <p className="text-sm font-semibold leading-relaxed text-orange-900">{cta || "Unspecified"}</p>
                  </div>
                </section>

                <section className="border-t border-slate-100 py-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-violet-600" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        Theme & export
                      </h3>
                    </div>
                    {savingTheme && <Loader2 className="h-4 w-4 animate-spin text-violet-600" />}
                  </div>
                  <p className="mb-3 text-xs text-slate-600">
                    Active:{" "}
                    <strong>
                      {VISUAL_THEMES.find((t) =>
                        t.id === normalizeVisualThemeId(blueprint.visual_theme ?? blueprint.theme),
                      )?.name ?? "Modern"}
                    </strong>
                  </p>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {VISUAL_THEMES.map((theme) => {
                      const active = selectedTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setSelectedTheme(theme.id);
                            void persistVisualTheme(theme.id);
                          }}
                          className={cn(
                            "relative rounded-xl border-2 p-2 text-left transition-all",
                            active
                              ? "border-orange-400 bg-orange-50/40"
                              : "border-slate-200 bg-white hover:border-slate-300",
                          )}
                        >
                          {active && (
                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </span>
                          )}
                          <div className="mb-1.5 h-8 w-full rounded-md" style={{ background: theme.swatch }} aria-hidden />
                          <p className="text-xs font-bold text-slate-900">{theme.name}</p>
                        </button>
                      );
                    })}
                  </div>
                  {htmlBuildAction ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      <span className="text-sm font-medium text-violet-800">
                        {htmlBuildAction === "standalone"
                          ? "Generating standalone HTML…"
                          : "Generating embed snippet…"}
                      </span>
                    </div>
                  ) : buildResult ? (
                    <div className="space-y-2">
                      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800">
                        {buildResult.action === "standalone" ? "HTML ready" : "Embed ready"}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white"
                          onClick={() => {
                            const blob = new Blob([buildResult.html], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                            showToast({ title: "Downloaded!", type: "success" });
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download .html
                        </button>
                        <button
                          type="button"
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          onClick={() => {
                            void navigator.clipboard.writeText(buildResult.html).then(() => {
                              setCopied(true);
                              showToast({ title: "Copied to clipboard!", type: "success" });
                              setTimeout(() => setCopied(false), 2000);
                            });
                          }}
                        >
                          <Code2 className="h-4 w-4" />
                          {copied
                            ? "Copied"
                            : buildResult.action === "embed"
                              ? "Copy embed"
                              : "Copy code"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBuildResult(null);
                          setCopied(false);
                        }}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
                      >
                        Build again
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => buildTool("standalone")}
                        disabled={htmlBuildAction !== null || buildStep === "analyzing"}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm hover:border-violet-200 hover:bg-violet-50/50 disabled:opacity-50"
                      >
                        <Download className="h-4 w-4 text-violet-600" />
                        <span>
                          <span className="font-semibold text-slate-800">Standalone</span>
                          <span className="mt-0.5 block text-xs text-slate-500">Download .html</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => buildTool("embed")}
                        disabled={htmlBuildAction !== null || buildStep === "analyzing"}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm hover:border-violet-200 hover:bg-violet-50/50 disabled:opacity-50"
                      >
                        <Code2 className="h-4 w-4 text-violet-600" />
                        <span>
                          <span className="font-semibold text-slate-800">Embed</span>
                          <span className="mt-0.5 block text-xs text-slate-500">Copy snippet</span>
                        </span>
                      </button>
                    </div>
                  )}

                  </div>
                </section>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyBlueprint}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Copy blueprint
                  </button>
                  <button
                    type="button"
                    onClick={regenerateBlueprint}
                    disabled={htmlBuildAction !== null || buildStep === "analyzing"}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {buildStep === "analyzing" ? "Regenerating…" : "Regenerate"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "variations" && (
          <div className="space-y-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-5">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Configure variations
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <VariationColumn
                  letter="A"
                  badgeClass="bg-violet-600"
                  audience={varA.audience}
                  monetization={varA.monetization}
                  onAudienceChange={(v) => setVarA((prev) => ({ ...prev, audience: v }))}
                  onMonetizationChange={(v) => setVarA((prev) => ({ ...prev, monetization: v }))}
                />
                <VariationColumn
                  letter="B"
                  badgeClass="bg-sky-500"
                  audience={varB.audience}
                  monetization={varB.monetization}
                  onAudienceChange={(v) => setVarB((prev) => ({ ...prev, audience: v }))}
                  onMonetizationChange={(v) => setVarB((prev) => ({ ...prev, monetization: v }))}
                />
              </div>
              <button
                type="button"
                onClick={generateVariations}
                disabled={generatingVariations || !tool.blueprint}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingVariations ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-current" />
                    Generate 2 Blueprint Variations
                  </>
                )}
              </button>
            </div>

            {variationResults && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Generated variations</p>
                {(["A", "B"] as const).map((which) => {
                  const v = which === "A" ? variationResults.variationA : variationResults.variationB;
                  const title = (v.title as string) || (v.purpose as string) || `Variation ${which}`;
                  return (
                    <div
                      key={which}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <span className="text-[10px] font-medium uppercase text-slate-400">
                          {v.audience} · {v.monetization}
                        </span>
                      </div>
                      {v.summary && (
                        <p className="mb-3 text-xs leading-relaxed text-slate-600">{String(v.summary)}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => applyVariation(which)}
                        disabled={applyingVariation !== null}
                        className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {applyingVariation === which ? "Applying…" : `Use Variation ${which}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "landing" && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Landing page</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Generate a complete landing page—hero, tool embed, proof, FAQ, and conversion sections.
              </p>
            </div>
            {!landingPageHtml && !generatingLanding && (
              <button
                type="button"
                onClick={generateLandingPageHandler}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
              >
                <LayoutTemplate className="h-4 w-4" />
                Generate landing page
              </button>
            )}
            {generatingLanding && (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                <p className="text-sm text-slate-600">Generating landing page…</p>
              </div>
            )}
            {landingPageHtml && !generatingLanding && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={downloadLandingPage}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
                >
                  <Download className="h-4 w-4" />
                  Download .html
                </button>
                <button
                  type="button"
                  onClick={copyLandingPageHTML}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Code2 className="h-4 w-4" />
                  Copy HTML
                </button>
                <button
                  type="button"
                  onClick={regenerateLandingPage}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 sm:col-span-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
