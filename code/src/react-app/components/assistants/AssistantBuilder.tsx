import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { useToast } from "@/react-app/components/Toast";
import {
  createAssistant,
  deployAssistant,
  generateAssistantContext,
  updateAssistant,
  type AssistantRecord,
} from "@/react-app/lib/assistantApi";

const STEPS = [
  "Select Asset",
  "Assistant Role",
  "AI Context",
  "Knowledge",
  "Engagement",
  "Deploy",
];

const ROLES = [
  { id: "lead-capture", label: "Lead Capture" },
  { id: "sales-advisor", label: "Sales Advisor" },
  { id: "qualification-assistant", label: "Qualification" },
  { id: "customer-support", label: "Support" },
  { id: "conversion-assistant", label: "Conversion" },
  { id: "monetization", label: "Monetization" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (a: AssistantRecord) => void;
  tools?: Array<{ id: number; name: string; projectName?: string }>;
  captureFlows?: Array<{ publicId: string; name: string }>;
};

export default function AssistantBuilder({ open, onClose, onCreated, tools = [], captureFlows = [] }: Props) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [assistantId, setAssistantId] = useState<number | null>(null);

  const [name, setName] = useState("AI Assistant");
  const [assetType, setAssetType] = useState("tool");
  const [linkedToolId, setLinkedToolId] = useState<number | null>(null);
  const [assetKey, setAssetKey] = useState("");
  const [niche, setNiche] = useState("");
  const [assistantType, setAssistantType] = useState("lead-capture");
  const [targetGoal, setTargetGoal] = useState("capture-leads");
  const [instructions, setInstructions] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<Array<{ title: string; content: string }>>([
    { title: "", content: "" },
  ]);
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(true);
  const [showPricingCta, setShowPricingCta] = useState(true);
  const [ctaLabel, setCtaLabel] = useState("Get my free guide");
  const [captureFlowPublicId, setCaptureFlowPublicId] = useState("");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [deploySnippet, setDeploySnippet] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(0);
      setAssistantId(null);
      setDeploySnippet("");
    }
  }, [open]);

  if (!open) return null;

  const persistDraft = async () => {
    const body = {
      name,
      assetType,
      linkedToolId,
      assetKey,
      niche,
      assistantType,
      targetGoal,
      instructions,
      expertiseAreas,
      knowledgeSources: knowledgeSources.filter((k) => k.content.trim()),
      engagementSettings: { leadCaptureEnabled, showPricingCta, ctaLabel },
      captureFlowPublicId: captureFlowPublicId || null,
      widgetPosition,
      status: step >= 5 ? "active" : "draft",
    };
    if (assistantId) {
      const { assistant } = await updateAssistant(assistantId, body);
      return assistant;
    }
    const { assistant } = await createAssistant(body);
    setAssistantId(assistant.id);
    return assistant;
  };

  const runGenerateContext = async () => {
    setGenerating(true);
    try {
      const tool = tools.find((t) => t.id === linkedToolId);
      const { context } = await generateAssistantContext({
        niche: niche || "business",
        assetType,
        monetizationGoal: targetGoal,
        toolName: tool?.name || name,
      });
      if (typeof context.expertiseAreas === "string") setExpertiseAreas(context.expertiseAreas);
      if (typeof context.instructions === "string") setInstructions(context.instructions);
      const es = context.engagementSettings as Record<string, unknown> | undefined;
      if (es?.leadCaptureEnabled !== undefined) setLeadCaptureEnabled(Boolean(es.leadCaptureEnabled));
      if (es?.showPricingCta !== undefined) setShowPricingCta(Boolean(es.showPricingCta));
      if (typeof es?.ctaLabel === "string") setCtaLabel(es.ctaLabel);
      showToast({ title: "AI context generated", type: "success" });
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Context generation failed", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const next = async () => {
    setSaving(true);
    try {
      if (step === 2) await runGenerateContext();
      await persistDraft();
      if (step < STEPS.length - 1) setStep((s) => s + 1);
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      const a = await persistDraft();
      const { snippet } = await deployAssistant(a.id, {
        assetKey,
        targets: [{ deploymentTarget: assetType === "wordpress" ? "wordpress" : "embed", assetType, assetKey }],
        activate: true,
      });
      setDeploySnippet(snippet);
      onCreated(a);
      showToast({ title: "Assistant deployed", type: "success" });
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Deploy failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create AI Assistant</h2>
            <p className="text-sm text-slate-500">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-violet-600" : "bg-slate-200"}`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 0 && (
            <>
              <label className="text-sm font-medium text-slate-700">Assistant name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <label className="text-sm font-medium text-slate-700">Asset type</label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool">Interactive tool</SelectItem>
                  <SelectItem value="landing">Landing page</SelectItem>
                  <SelectItem value="content-wrapper">Content wrapper</SelectItem>
                  <SelectItem value="wordpress">WordPress page</SelectItem>
                  <SelectItem value="seo">SEO asset</SelectItem>
                </SelectContent>
              </Select>
              {tools.length > 0 && (
                <>
                  <label className="text-sm font-medium text-slate-700">Link to tool (optional)</label>
                  <Select
                    value={linkedToolId ? String(linkedToolId) : "none"}
                    onValueChange={(v) => {
                      const id = v === "none" ? null : Number(v);
                      setLinkedToolId(id);
                      const t = tools.find((x) => x.id === id);
                      if (t) {
                        setAssetKey(`tool-${t.id}`);
                        setName(`${t.name} Assistant`);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tools.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <label className="text-sm font-medium text-slate-700">Asset key / URL slug</label>
              <Input value={assetKey} onChange={(e) => setAssetKey(e.target.value)} placeholder="tool-123" />
              <label className="text-sm font-medium text-slate-700">Niche</label>
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Finance, SaaS, Health…" />
            </>
          )}

          {step === 1 && (
            <>
              <label className="text-sm font-medium text-slate-700">Assistant role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAssistantType(r.id)}
                    className={`p-3 rounded-xl border text-left text-sm ${
                      assistantType === r.id
                        ? "border-violet-500 bg-violet-50 text-violet-900"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <label className="text-sm font-medium text-slate-700">Primary goal</label>
              <Select value={targetGoal} onValueChange={setTargetGoal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capture-leads">Capture leads</SelectItem>
                  <SelectItem value="increase-conversions">Increase conversions</SelectItem>
                  <SelectItem value="qualify-prospects">Qualify prospects</SelectItem>
                  <SelectItem value="boost-engagement">Boost engagement</SelectItem>
                  <SelectItem value="recommend-products">Recommend products</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {step === 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={runGenerateContext}
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate context with AI
              </Button>
              <label className="text-sm font-medium text-slate-700">Expertise areas</label>
              <Input value={expertiseAreas} onChange={(e) => setExpertiseAreas(e.target.value)} />
              <label className="text-sm font-medium text-slate-700">Special instructions</label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} />
            </>
          )}

          {step === 3 && (
            <>
              {knowledgeSources.map((k, i) => (
                <div key={i} className="space-y-2 p-3 rounded-xl border border-slate-200">
                  <Input
                    placeholder="Source title"
                    value={k.title}
                    onChange={(e) => {
                      const copy = [...knowledgeSources];
                      copy[i] = { ...copy[i], title: e.target.value };
                      setKnowledgeSources(copy);
                    }}
                  />
                  <Textarea
                    placeholder="Paste knowledge, FAQs, product details…"
                    value={k.content}
                    onChange={(e) => {
                      const copy = [...knowledgeSources];
                      copy[i] = { ...copy[i], content: e.target.value };
                      setKnowledgeSources(copy);
                    }}
                    rows={3}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setKnowledgeSources([...knowledgeSources, { title: "", content: "" }])}
              >
                Add knowledge source
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={leadCaptureEnabled}
                  onChange={(e) => setLeadCaptureEnabled(e.target.checked)}
                />
                Enable lead capture prompts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPricingCta}
                  onChange={(e) => setShowPricingCta(e.target.checked)}
                />
                Show pricing / offer CTAs when intent detected
              </label>
              <label className="text-sm font-medium text-slate-700">CTA label</label>
              <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
              {captureFlows.length > 0 && (
                <>
                  <label className="text-sm font-medium text-slate-700">Audience capture flow (optional)</label>
                  <Select value={captureFlowPublicId || "none"} onValueChange={(v) => setCaptureFlowPublicId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {captureFlows.map((f) => (
                        <SelectItem key={f.publicId} value={f.publicId}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <label className="text-sm font-medium text-slate-700">Widget position</label>
              <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom right</SelectItem>
                  <SelectItem value="bottom-left">Bottom left</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-sm text-slate-600">
                Deploy your assistant to live assets. Copy the embed snippet into HTML before{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">&lt;/body&gt;</code>.
              </p>
              {deploySnippet ? (
                <Textarea readOnly value={deploySnippet} rows={6} className="font-mono text-xs" />
              ) : (
                <p className="text-sm text-slate-500">Click Deploy to generate your embed code.</p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between">
          <Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Continue
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy assistant"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
