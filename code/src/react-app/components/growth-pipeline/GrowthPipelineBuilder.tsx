import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Workflow } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Switch } from "@/react-app/components/ui/switch";
import { Label } from "@/react-app/components/ui/label";
import { useToast } from "@/react-app/components/Toast";
import {
  createGrowthDeployment,
  executeGrowthDeployment,
  updateGrowthDeployment,
  type GrowthDeployment,
} from "@/react-app/lib/growthPipelineApi";
import { writePipelineDeploy } from "@/react-app/lib/pipelineDeploy";

const STEPS = ["Asset", "Audience", "AI Assistant", "Publishing", "Analytics"];

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: (d: GrowthDeployment, html?: string) => void;
  audienceFlows?: Array<{ publicId: string; name: string; captureMethod?: string }>;
  assistants?: Array<{ publicId: string; name: string; status: string }>;
  wordpressSites?: Array<{ id: number; siteName: string }>;
  initialHtml?: string;
};

export default function GrowthPipelineBuilder({
  open,
  onClose,
  onComplete,
  audienceFlows = [],
  assistants = [],
  wordpressSites = [],
  initialHtml,
}: Props) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deploymentId, setDeploymentId] = useState<number | null>(null);

  const [name, setName] = useState("Growth deployment");
  const [assetType, setAssetType] = useState("content-wrapper");
  const [assetKey, setAssetKey] = useState("");
  const [audienceEnabled, setAudienceEnabled] = useState(true);
  const [audienceFlowPublicId, setAudienceFlowPublicId] = useState("");
  const [audienceMethod, setAudienceMethod] = useState("email");
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [assistantPublicId, setAssistantPublicId] = useState("");
  const [publishTarget, setPublishTarget] = useState("wordpress");
  const [wordpressSiteId, setWordpressSiteId] = useState<number | null>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [conversionTracking, setConversionTracking] = useState(true);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setDeploymentId(null);
    }
  }, [open]);

  if (!open) return null;

  const persist = async () => {
    const body = {
      name,
      assetType,
      assetKey: assetKey || `growth-${Date.now()}`,
      audienceFlowPublicId: audienceEnabled ? audienceFlowPublicId || null : null,
      audienceCaptureMethod: audienceEnabled ? audienceMethod : null,
      assistantPublicId: assistantEnabled ? assistantPublicId || null : null,
      publishTarget,
      wordpressSiteId: publishTarget === "wordpress" ? wordpressSiteId : null,
      analyticsEnabled,
      conversionTrackingEnabled: conversionTracking,
      optimizationEnabled,
      html: initialHtml,
    };
    if (deploymentId) {
      const { deployment } = await updateGrowthDeployment(deploymentId, body);
      return deployment;
    }
    const { deployment } = await createGrowthDeployment(body);
    setDeploymentId(deployment.id);
    return deployment;
  };

  const next = async () => {
    setSaving(true);
    try {
      await persist();
      if (step < STEPS.length - 1) setStep((s) => s + 1);
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deploy = async () => {
    setSaving(true);
    try {
      const dep = await persist();
      const result = await executeGrowthDeployment(dep.id, { html: initialHtml });
      if (result.handoff.publishTarget === "wordpress") {
        writePipelineDeploy({
          html: result.html,
          source: "growth-pipeline",
          growthDeploymentId: dep.id,
          growthDeploymentPublicId: dep.publicId,
          audienceFlowPublicId: dep.audienceFlowPublicId,
          audienceAssetKey: dep.assetKey,
          assistantPublicId: dep.assistantPublicId,
          assistantAssetKey: dep.assetKey,
          analyticsEnabled: dep.analyticsEnabled,
          conversionTrackingEnabled: dep.conversionTrackingEnabled,
          publishTarget: dep.publishTarget,
          wordpressSiteId: dep.wordpressSiteId,
          pageTitle: name,
        });
      }
      onComplete(result.deployment, result.html);
      showToast({ title: "Growth deployment executed", type: "success" });
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Deploy failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-violet-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Deployment flow</h2>
              <p className="text-sm text-slate-500">
                Step {step + 1}: {STEPS[step]}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex gap-1 px-6 pt-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-violet-600" : "bg-slate-200"}`} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 0 && (
            <>
              <Label>Flow name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Label>Asset type</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool">Standalone tool</SelectItem>
                  <SelectItem value="landing">Landing page</SelectItem>
                  <SelectItem value="content-wrapper">Content wrapper</SelectItem>
                  <SelectItem value="seo">SEO asset</SelectItem>
                  <SelectItem value="widget">Embedded widget</SelectItem>
                </SelectContent>
              </Select>
              <Label>Asset key</Label>
              <Input value={assetKey} onChange={(e) => setAssetKey(e.target.value)} placeholder="content-wrapper:keyword" />
            </>
          )}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <Label>Enable audience capture</Label>
                <Switch checked={audienceEnabled} onCheckedChange={setAudienceEnabled} />
              </div>
              {audienceEnabled && (
                <>
                  <Label>Capture method</Label>
                  <Select value={audienceMethod} onValueChange={setAudienceMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email unlock</SelectItem>
                      <SelectItem value="google">Google sign-in</SelectItem>
                      <SelectItem value="cta">CTA capture</SelectItem>
                      <SelectItem value="form">Lead form</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label>Capture flow</Label>
                  <Select value={audienceFlowPublicId || "none"} onValueChange={(v) => setAudienceFlowPublicId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {audienceFlows.map((f) => (
                        <SelectItem key={f.publicId} value={f.publicId}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <Label>Enable AI assistant</Label>
                <Switch checked={assistantEnabled} onCheckedChange={setAssistantEnabled} />
              </div>
              {assistantEnabled && (
                <>
                  <Label>Assistant</Label>
                  <Select value={assistantPublicId || "none"} onValueChange={(v) => setAssistantPublicId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {assistants
                        .filter((a) => a.status === "active")
                        .map((a) => (
                          <SelectItem key={a.publicId} value={a.publicId}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <Label>Publishing target</Label>
              <Select value={publishTarget} onValueChange={setPublishTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wordpress">WordPress site</SelectItem>
                  <SelectItem value="export">Export HTML</SelectItem>
                  <SelectItem value="embed">Embed widget</SelectItem>
                  <SelectItem value="seo">SEO page</SelectItem>
                </SelectContent>
              </Select>
              {publishTarget === "wordpress" && wordpressSites.length > 0 && (
                <>
                  <Label>WordPress site</Label>
                  <Select
                    value={wordpressSiteId ? String(wordpressSiteId) : "none"}
                    onValueChange={(v) => setWordpressSiteId(v === "none" ? null : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select site</SelectItem>
                      {wordpressSites.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.siteName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </>
          )}
          {step === 4 && (
            <>
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <Label>Conversion tracking</Label>
                  <Switch checked={conversionTracking} onCheckedChange={setConversionTracking} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Engagement analytics</Label>
                  <Switch checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>AI optimization recommendations</Label>
                  <Switch checked={optimizationEnabled} onCheckedChange={setOptimizationEnabled} />
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Deploy will auto-inject audience widget, AI assistant, and analytics runtime. No manual script pasting.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
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
            <Button onClick={deploy} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Execute deployment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
