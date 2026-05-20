import { useCallback, useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Zap,
  Mail,
  Globe2,
  MousePointerClick,
  Eye,
  Smartphone,
  Monitor,
  Target,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Settings,
  Play,
  ChevronRight,
  FileText,
  Bot,
  Globe,
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Slider } from "@/react-app/components/ui/slider";
import { cn } from "@/react-app/lib/utils";
import { createFlow, type CreateFlowPayload, type CaptureFlowConfig } from "@/react-app/lib/audienceApi";
import { fetchAllAssets, type UnifiedAsset } from "@/react-app/lib/assetRegistryApi";

interface CaptureFlowBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploy: (data: { publicId: string; flowId: number }) => void;
}

type BuilderStep = "asset" | "capture" | "triggers" | "customize" | "connect" | "deploy";
type CaptureType = "email" | "google" | "blur" | "fullscreen" | "sticky" | "exit" | "scroll" | "inline";

interface FlowState {
  name: string;
  goal: string;
  selectedAsset: UnifiedAsset | null;
  captureType: CaptureType;
  config: CaptureFlowConfig;
  status: "draft" | "live";
}

const CAPTURE_TYPES = [
  {
    id: "email" as const,
    name: "Email Unlock",
    description: "Classic email capture with verified leads",
    icon: Mail,
    conversion: "6-9%",
    quality: 85,
    recommended: true,
  },
  {
    id: "google" as const,
    name: "Google Sign-In",
    description: "One-tap OAuth with highest verification",
    icon: Globe2,
    conversion: "11-14%",
    quality: 95,
    recommended: true,
  },
  {
    id: "blur" as const,
    name: "Blur Unlock",
    description: "Partial content with progressive reveal",
    icon: Eye,
    conversion: "7-10%",
    quality: 80,
    recommended: false,
  },
  {
    id: "fullscreen" as const,
    name: "Fullscreen Gate",
    description: "High-impact modal overlay",
    icon: Target,
    conversion: "5-8%",
    quality: 88,
    recommended: false,
  },
  {
    id: "sticky" as const,
    name: "Sticky CTA",
    description: "Persistent bottom banner",
    icon: MousePointerClick,
    conversion: "4-6%",
    quality: 72,
    recommended: false,
  },
  {
    id: "exit" as const,
    name: "Exit Intent",
    description: "Triggered when user attempts to leave",
    icon: AlertCircle,
    conversion: "8-11%",
    quality: 78,
    recommended: false,
  },
];


// Helper to get asset icon
const getAssetIcon = (assetType: string) => {
  switch (assetType) {
    case "interactive-tool":
      return Zap;
    case "landing-page":
      return Layers;
    case "content-wrapper":
      return FileText;
    case "ai-assistant":
      return Bot;
    case "wordpress-page":
      return Globe;
    default:
      return Target;
  }
};



export default function CaptureFlowBuilder({ open, onOpenChange, onDeploy }: CaptureFlowBuilderProps) {
  const [step, setStep] = useState<BuilderStep>("asset");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isCreating, setIsCreating] = useState(false);
  const [assets, setAssets] = useState<UnifiedAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetFilter, setAssetFilter] = useState<string>("");
  const [flowState, setFlowState] = useState<FlowState>({
    name: "New Capture Flow",
    goal: "Generate verified subscribers",
    selectedAsset: null,
    captureType: "email",
    status: "live",
    config: {
      headline: "Unlock Full Access",
      ctaText: "Continue",
      unlockPercent: 70,
      blurIntensity: 40,
      triggerDelayMs: 1200,
      widgetLayout: "fullscreen",
      scrollTrigger: 0,
      exitIntentEnabled: false,
      conversionGoal: "verified-leads",
    },
  });

  // Load real assets when builder opens
  useEffect(() => {
    if (open) {
      loadAssets();
    }
  }, [open]);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const response = await fetchAllAssets();
      setAssets(response.assets);
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const updateConfig = useCallback((updates: Partial<CaptureFlowConfig>) => {
    setFlowState((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  }, []);

  const updateFlow = useCallback((updates: Partial<FlowState>) => {
    setFlowState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      if (!flowState.selectedAsset) {
        throw new Error("No asset selected");
      }

      const payload: CreateFlowPayload = {
        name: flowState.name,
        assetType: flowState.selectedAsset.assetType === "interactive-tool" ? "tool" : 
                   flowState.selectedAsset.assetType === "content-wrapper" ? "content" :
                   flowState.selectedAsset.assetType === "ai-assistant" ? "assistant" :
                   flowState.selectedAsset.assetType === "wordpress-page" ? "wordpress" : "landing",
        captureMethod: flowState.captureType,
        status: flowState.status,
        config: flowState.config,
      };
      const result = await createFlow(payload);
      
      // Create deployment record connecting flow to asset
      await fetch("/api/audience/flows/" + result.flow.id + "/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: flowState.selectedAsset.id,
          assetType: flowState.selectedAsset.assetType,
        }),
      });

      onDeploy({ publicId: result.flow.publicId, flowId: result.flow.id });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create flow:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const currentCaptureType = CAPTURE_TYPES.find((t) => t.id === flowState.captureType);

  // Filter assets - show only generated blueprints (tools/magnets)
  const filteredAssets = assets.filter((asset) => 
    asset.assetType === "interactive-tool" && (
      asset.name.toLowerCase().includes(assetFilter.toLowerCase()) ||
      asset.assetType.toLowerCase().includes(assetFilter.toLowerCase())
    )
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm">
      <div className="fixed inset-4 lg:inset-8 flex items-center justify-center">
        <div className="relative w-full h-full max-w-[1600px] max-h-[900px] flex flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-white to-violet-50/30 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Capture Flow Builder</h2>
                <p className="text-xs text-slate-500">AI-powered conversion infrastructure</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Step Progress */}
          <div className="border-b border-slate-200/60 bg-slate-50/50 px-6 py-3">
            <div className="flex items-center gap-2 text-xs">
              {["asset", "capture", "triggers", "customize", "connect", "deploy"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(s as BuilderStep)}
                    className={cn(
                      "rounded-lg px-2 py-1 font-medium capitalize transition",
                      step === s
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    )}
                  >
                    {s}
                  </button>
                  {i < 5 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                </div>
              ))}
            </div>
          </div>

          {/* 3-Panel Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT PANEL - Configuration */}
            <div className="w-80 overflow-y-auto border-r border-slate-200/60 bg-white p-6">
              <div className="space-y-6">
                {/* Flow Info */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flow Details</Label>
                  <div className="space-y-2">
                    <Input
                      value={flowState.name}
                      onChange={(e) => updateFlow({ name: e.target.value })}
                      placeholder="Flow name"
                      className="rounded-xl"
                    />
                    <Input
                      value={flowState.goal}
                      onChange={(e) => updateFlow({ goal: e.target.value })}
                      placeholder="Conversion goal"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Asset Selection */}
                {step === "asset" && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Select Asset to Capture From
                    </Label>
                    
                    <Input
                      placeholder="Search your assets..."
                      value={assetFilter}
                      onChange={(e) => setAssetFilter(e.target.value)}
                      className="rounded-xl"
                    />

                    {loadingAssets ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                      </div>
                    ) : filteredAssets.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <Target className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-900">No assets found</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {assets.length === 0 
                            ? "Create a tool, landing page, or content wrapper first"
                            : "Try a different search term"}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {filteredAssets.map((asset) => {
                          const AssetIcon = getAssetIcon(asset.assetType);
                          const isSelected = flowState.selectedAsset?.id === asset.id;
                          
                          return (
                            <button
                              key={asset.id}
                              onClick={() => updateFlow({ selectedAsset: asset })}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                                isSelected
                                  ? "border-violet-200 bg-violet-50/80 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-violet-100"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                  isSelected
                                    ? "bg-violet-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                <AssetIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{asset.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    {asset.assetType.replace("-", " ")}
                                  </Badge>
                                  {asset.status === "published" && (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-4 px-1">
                                      Live
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Capture Type */}
                {step === "capture" && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Capture Experience
                    </Label>
                    <div className="space-y-2">
                      {CAPTURE_TYPES.map((capture) => (
                        <button
                          key={capture.id}
                          onClick={() => updateFlow({ captureType: capture.id })}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                            flowState.captureType === capture.id
                              ? "border-violet-200 bg-violet-50/80 shadow-sm"
                              : "border-slate-200 bg-white hover:border-violet-100"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              flowState.captureType === capture.id
                                ? "bg-violet-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            <capture.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{capture.name}</p>
                              {capture.recommended && (
                                <Badge className="h-4 rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-700">
                                  TOP
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{capture.description}</p>
                            <div className="flex gap-3 pt-1 text-[10px] font-medium">
                              <span className="text-violet-600">{capture.conversion} CVR</span>
                              <span className="text-slate-400">Quality {capture.quality}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trigger Settings */}
                {step === "triggers" && (
                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Trigger Configuration
                    </Label>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Delay (ms)</Label>
                      <Slider
                        value={[flowState.config.triggerDelayMs || 1200]}
                        onValueChange={(v) => updateConfig({ triggerDelayMs: v[0] })}
                        min={0}
                        max={5000}
                        step={100}
                        className="py-2"
                      />
                      <p className="text-xs text-slate-500">{flowState.config.triggerDelayMs}ms</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Scroll Trigger (%)</Label>
                      <Slider
                        value={[flowState.config.scrollTrigger || 0]}
                        onValueChange={(v) => updateConfig({ scrollTrigger: v[0] })}
                        min={0}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                      <p className="text-xs text-slate-500">{flowState.config.scrollTrigger}%</p>
                    </div>

                    {flowState.captureType === "blur" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">Blur Intensity</Label>
                        <Slider
                          value={[flowState.config.blurIntensity || 40]}
                          onValueChange={(v) => updateConfig({ blurIntensity: v[0] })}
                          min={0}
                          max={100}
                          step={5}
                          className="py-2"
                        />
                        <p className="text-xs text-slate-500">{flowState.config.blurIntensity}px</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Unlock Threshold (%)</Label>
                      <Slider
                        value={[flowState.config.unlockPercent || 70]}
                        onValueChange={(v) => updateConfig({ unlockPercent: v[0] })}
                        min={0}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                      <p className="text-xs text-slate-500">{flowState.config.unlockPercent}%</p>
                    </div>
                  </div>
                )}

                {/* Customization */}
                {step === "customize" && (
                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Experience Design
                    </Label>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Headline</Label>
                      <Input
                        value={flowState.config.headline || ""}
                        onChange={(e) => updateConfig({ headline: e.target.value })}
                        placeholder="Unlock Full Access"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">CTA Text</Label>
                      <Input
                        value={flowState.config.ctaText || ""}
                        onChange={(e) => updateConfig({ ctaText: e.target.value })}
                        placeholder="Continue"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Layout Style</Label>
                      <div className="space-y-2">
                        {[
                          { id: "fullscreen", name: "Fullscreen", desc: "Center modal" },
                          { id: "modal", name: "Modal", desc: "Floating card" },
                          { id: "sticky", name: "Sticky", desc: "Bottom banner" },
                        ].map((layout) => (
                          <button
                            key={layout.id}
                            onClick={() => updateConfig({ widgetLayout: layout.id as "fullscreen" | "modal" | "sticky" })}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                              flowState.config.widgetLayout === layout.id
                                ? "border-violet-200 bg-violet-50"
                                : "border-slate-200 hover:border-violet-100"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">{layout.name}</p>
                              <p className="text-xs text-slate-500">{layout.desc}</p>
                            </div>
                            {flowState.config.widgetLayout === layout.id && (
                              <CheckCircle2 className="h-4 w-4 text-violet-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Connect Systems */}
                {step === "connect" && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      System Connections
                    </Label>
                    <div className="space-y-2">
                      {[
                        { name: "Audience Engine", status: "connected", icon: Target },
                        { name: "Analytics", status: "connected", icon: TrendingUp },
                        { name: "WordPress", status: "available", icon: Globe2 },
                        { name: "AI Assistants", status: "available", icon: Sparkles },
                      ].map((system) => (
                        <div
                          key={system.name}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-center gap-2">
                            <system.icon className="h-4 w-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-900">{system.name}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-lg text-[10px]",
                              system.status === "connected"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            )}
                          >
                            {system.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deploy */}
                {step === "deploy" && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ready to Deploy
                    </Label>
                    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Flow Configured</p>
                          <p className="text-xs text-slate-600">{flowState.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Systems Connected</p>
                          <p className="text-xs text-slate-600">Analytics + Audience Engine</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Preview Tested</p>
                          <p className="text-xs text-slate-600">Desktop + mobile verified</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER PANEL - Live Preview */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100/50 p-8">
              <div className="mx-auto max-w-4xl space-y-4">
                {/* Preview Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-lg border-slate-200 bg-white text-xs font-medium">
                      <Eye className="mr-1 h-3 w-3" />
                      Live Preview
                    </Badge>
                    {flowState.selectedAsset && (
                      <Badge variant="outline" className="rounded-lg border-violet-200 bg-violet-50 text-xs text-violet-700">
                        {flowState.selectedAsset.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={previewDevice === "desktop" ? "default" : "outline"}
                      size="sm"
                      className="h-8 rounded-lg"
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      <Monitor className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={previewDevice === "mobile" ? "default" : "outline"}
                      size="sm"
                      className="h-8 rounded-lg"
                      onClick={() => setPreviewDevice("mobile")}
                    >
                      <Smartphone className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div
                  className={cn(
                    "mx-auto rounded-2xl border-2 border-slate-300/60 bg-white shadow-2xl transition-all",
                    previewDevice === "mobile" ? "max-w-sm" : "w-full"
                  )}
                  style={{ aspectRatio: previewDevice === "mobile" ? "9/19.5" : "16/10" }}
                >
                  <div className="relative h-full overflow-hidden rounded-xl">
                    {/* Mock Page Content */}
                    <div className="h-full overflow-y-auto bg-white p-8">
                      <div className="space-y-4">
                        <div className="h-8 w-48 rounded-lg bg-slate-200/80" />
                        <div className="space-y-2">
                          <div className="h-4 w-full rounded bg-slate-100" />
                          <div className="h-4 w-full rounded bg-slate-100" />
                          <div className="h-4 w-3/4 rounded bg-slate-100" />
                        </div>
                        <div className="h-40 rounded-xl bg-slate-200/60" />
                        <div className="space-y-2">
                          <div className="h-4 w-full rounded bg-slate-100" />
                          <div className="h-4 w-full rounded bg-slate-100" />
                          <div className="h-4 w-5/6 rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>

                    {/* Live Gate Overlay */}
                    {flowState.captureType && (
                      <div
                        className={cn(
                          "absolute inset-0 flex items-center justify-center transition-opacity",
                          flowState.config.widgetLayout === "sticky"
                            ? "items-end"
                            : "bg-slate-950/40 backdrop-blur-sm"
                        )}
                        style={{
                          backdropFilter:
                            flowState.captureType === "blur"
                              ? `blur(${flowState.config.blurIntensity || 0}px)`
                              : undefined,
                        }}
                      >
                        <div
                          className={cn(
                            "w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl",
                            flowState.config.widgetLayout === "sticky"
                              ? "m-4 max-w-2xl rounded-t-2xl rounded-b-none"
                              : "m-6"
                          )}
                        >
                          <h3 className="text-xl font-semibold text-slate-900">
                            {flowState.config.headline || "Unlock Full Access"}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {flowState.captureType === "google"
                              ? "Sign in with Google to continue"
                              : "Enter your email to access full content"}
                          </p>
                          
                          {flowState.captureType === "google" ? (
                            <Button className="mt-4 w-full rounded-xl bg-slate-900 hover:bg-slate-800">
                              <Globe2 className="mr-2 h-4 w-4" />
                              Continue with Google
                            </Button>
                          ) : (
                            <div className="mt-4 space-y-3">
                              <Input placeholder="your@email.com" className="rounded-xl" />
                              <Button className="w-full rounded-xl bg-violet-600 hover:bg-violet-700">
                                {flowState.config.ctaText || "Continue"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Info */}
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                  {currentCaptureType && (
                    <>
                      <span className="flex items-center gap-1">
                        <currentCaptureType.icon className="h-3 w-3" />
                        {currentCaptureType.name}
                      </span>
                      <span>·</span>
                      <span>{currentCaptureType.conversion} estimated CVR</span>
                      <span>·</span>
                      <span>Quality {currentCaptureType.quality}</span>
                    </>
                  )}
                </div>
              </div>
            </div>


          </div>

          {/* Footer Actions */}
          <div className="flex h-16 items-center justify-between border-t border-slate-200/80 bg-slate-50/50 px-6">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <Settings className="h-3.5 w-3.5" />
              <span>
                Step {["asset", "capture", "triggers", "customize", "connect", "deploy"].indexOf(step) + 1} of 6
              </span>
            </div>
            <div className="flex gap-2">
              {step !== "deploy" ? (
                <>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl bg-violet-600 hover:bg-violet-700"
                    onClick={() => {
                      const steps: BuilderStep[] = ["asset", "capture", "triggers", "customize", "connect", "deploy"];
                      const currentIndex = steps.indexOf(step);
                      if (currentIndex < steps.length - 1) {
                        setStep(steps[currentIndex + 1]);
                      }
                    }}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setStep("customize")}>
                    Back
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      "Deploying..."
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Deploy Flow
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
