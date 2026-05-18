import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { faviconUrl } from "@/react-app/lib/publishingSites";
import { useToast } from "@/react-app/components/Toast";
import { useBlobHtmlPreview } from "@/react-app/lib/useBlobHtmlPreview";
import { injectAudienceWidgetIntoHtml } from "@/react-app/lib/audienceWidget";
import { writePipelineDeploy } from "@/react-app/lib/pipelineDeploy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import { Badge } from "@/react-app/components/ui/badge";
import { Button } from "@/react-app/components/ui/button";
import { Separator } from "@/react-app/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/react-app/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Switch } from "@/react-app/components/ui/switch";
import { Label } from "@/react-app/components/ui/label";
import {
  FileText,
  Loader2,
  Copy,
  Download,
  Save,
  Trash2,
  Check,
  Sparkles,
  Folder,
  Zap,
  ArrowRight,
  Eye,
  Code2,
  Layers,
  Hash,
  MessageCircleQuestion,
  Gauge,
  Library,
  Globe,
  Radar,
  Workflow,
  UserPlus,
  MonitorPlay,
  Send,
} from "lucide-react";

interface HowItWorksStep {
  step_number: number;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentPackage {
  page_h1: string;
  introduction: string;
  how_it_works: HowItWorksStep[];
  key_benefits: string[];
  semantic_keywords: string[];
  faq_section: FAQItem[];
  meta_title: string;
  meta_description: string;
  cta_block: string | null;
}

interface WordPressDestinationSummary {
  id: number;
  siteName: string;
  domain: string;
  siteUrl: string;
  publishingAccess: boolean;
}

interface Campaign {
  id: number;
  name: string;
  tool_name: string | null;
  target_keyword: string | null;
  project_id: number | null;
  created_at: string;
  page_h1: string | null;
  introduction: string | null;
  how_it_works: string | null;
  key_benefits: string | null;
  semantic_keywords: string | null;
  faq_section: string | null;
  meta_title: string | null;
  meta_description: string | null;
  cta_block: string | null;
  blueprint: string | null;
  niche_topic: string | null;
  embed_code: string | null;
  include_cta: boolean | null;
  cta_type: string | null;
  cta_text: string | null;
  cta_url: string | null;
  full_page_html: string | null;
}

interface AudienceFlowOption {
  id: number;
  name: string;
  status: string;
  captureMethod: string;
  publicId: string;
}

export default function ContentWrapper() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [wpDestinations, setWpDestinations] = useState<WordPressDestinationSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/wordpress/sites", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const list = (data.sites ?? []) as WordPressDestinationSummary[];
        if (!cancelled) setWpDestinations(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setWpDestinations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");
  const [blueprint, setBlueprint] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [nicheTopic, setNicheTopic] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [includeCta, setIncludeCta] = useState(false);
  const [ctaType, setCtaType] = useState("Collect Emails");
  const [generating, setGenerating] = useState(false);
  const [contentPackage, setContentPackage] = useState<ContentPackage | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const [fullPageGenerated, setFullPageGenerated] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);

  const [appOrigin, setAppOrigin] = useState("");
  const [audienceFlows, setAudienceFlows] = useState<AudienceFlowOption[]>([]);
  const [audienceFlowsLoading, setAudienceFlowsLoading] = useState(false);
  const [audienceCaptureEnabled, setAudienceCaptureEnabled] = useState(false);
  const [selectedAudienceFlowPublicId, setSelectedAudienceFlowPublicId] = useState("");
  const [gatePreviewMode, setGatePreviewMode] = useState(false);

  useEffect(() => {
    setAppOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAudienceFlowsLoading(true);
      try {
        const res = await fetch("/api/audience/flows", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const raw = (data.flows ?? []) as Record<string, unknown>[];
        const list: AudienceFlowOption[] = raw.map((x) => ({
          id: x.id as number,
          name: String(x.name || "Flow"),
          status: String(x.status || "draft"),
          captureMethod: String(x.captureMethod || "email"),
          publicId: String(x.publicId || ""),
        }));
        if (!cancelled) setAudienceFlows(list);
      } catch {
        if (!cancelled) setAudienceFlows([]);
      } finally {
        if (!cancelled) setAudienceFlowsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const live = audienceFlows.filter((f: AudienceFlowOption) => f.status === "live");
    if (audienceCaptureEnabled && !selectedAudienceFlowPublicId && live.length === 1) {
      setSelectedAudienceFlowPublicId(live[0].publicId);
    }
  }, [audienceFlows, audienceCaptureEnabled, selectedAudienceFlowPublicId]);

  const audienceAssetKey = useMemo(() => {
    const base = (targetKeyword || contentPackage?.page_h1 || "landing").replace(/\s+/g, "-").slice(0, 120);
    return `content-wrapper:${base}`;
  }, [targetKeyword, contentPackage?.page_h1]);

  const previewHtmlForIframe = useMemo(() => {
    if (!fullPageGenerated || !generatedHtml) return null;
    if (gatePreviewMode && audienceCaptureEnabled && selectedAudienceFlowPublicId && appOrigin) {
      return injectAudienceWidgetIntoHtml(generatedHtml, appOrigin, selectedAudienceFlowPublicId, audienceAssetKey);
    }
    return generatedHtml;
  }, [
    fullPageGenerated,
    generatedHtml,
    gatePreviewMode,
    audienceCaptureEnabled,
    selectedAudienceFlowPublicId,
    appOrigin,
    audienceAssetKey,
  ]);

  const fullPagePreviewUrl = useBlobHtmlPreview(previewHtmlForIframe);

  const getExportHtml = useCallback(() => {
    if (!generatedHtml) return "";
    if (audienceCaptureEnabled && selectedAudienceFlowPublicId && appOrigin) {
      return injectAudienceWidgetIntoHtml(generatedHtml, appOrigin, selectedAudienceFlowPublicId, audienceAssetKey);
    }
    return generatedHtml;
  }, [generatedHtml, audienceCaptureEnabled, selectedAudienceFlowPublicId, appOrigin, audienceAssetKey]);

  const handlePipelinePublish = useCallback(() => {
    if (audienceCaptureEnabled && !selectedAudienceFlowPublicId) {
      showToast({
        type: "error",
        title: "Select a capture flow",
        message: "Choose a live flow or create one in Audience Growth Engine.",
      });
      return;
    }
    writePipelineDeploy({
      html: getExportHtml(),
      source: "content-wrapper",
      audienceFlowPublicId: audienceCaptureEnabled ? selectedAudienceFlowPublicId : null,
      audienceAssetKey,
      pageTitle: contentPackage?.page_h1 || targetKeyword || undefined,
    });
    navigate("/wordpress");
    showToast({
      type: "success",
      title: "Deploy package ready",
      message: "Publishing Hub received your HTML. Use the banner there to copy or continue.",
    });
  }, [
    audienceCaptureEnabled,
    selectedAudienceFlowPublicId,
    getExportHtml,
    audienceAssetKey,
    contentPackage?.page_h1,
    targetKeyword,
    navigate,
    showToast,
  ]);

  const [ctaGoal, setCtaGoal] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  useEffect(() => {
    if (activeTab === "saved") {
      loadCampaignsAndProjects();
    }
  }, [activeTab]);

  const loadCampaignsAndProjects = async () => {
    setLoadingCampaigns(true);
    try {
      const campaignsRes = await fetch("/api/content-campaigns", { credentials: "include" });

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleBlueprintChange = (value: string) => {
    if (value.includes('TOOL_NAME:') && value.includes('TARGET_KEYWORD:') && value.includes('EMBED_CODE:')) {
      parseStructuredBundle(value);
      return;
    } else if (value.includes('BLUEPRINT:') && value.includes('TARGET KEYWORD:')) {
      parseStructuredBundle(value);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (parsed.blueprint || parsed.target_keyword || parsed.niche_topic || parsed.embed_code) {
        if (parsed.blueprint) setBlueprint(parsed.blueprint);
        if (parsed.target_keyword) setTargetKeyword(parsed.target_keyword);
        if (parsed.niche_topic) setNicheTopic(parsed.niche_topic);
        if (parsed.embed_code) setEmbedCode(parsed.embed_code);
        return;
      }
    } catch {
      // Not JSON
    }

    setBlueprint(value);
  };

  const parseStructuredBundle = (bundleText: string) => {
    try {
      const extractSection = (label: string, nextLabel?: string) => {
        const regex = nextLabel
          ? new RegExp(`${label}:\\s*([\\s\\S]*?)(?=${nextLabel}:)`, 'i')
          : new RegExp(`${label}:\\s*([\\s\\S]*)$`, 'i');
        const match = bundleText.match(regex);
        return match ? match[1].trim() : '';
      };

      const targetKeyword = extractSection('TARGET_KEYWORD', 'NICHE') || extractSection('TARGET KEYWORD', 'NICHE');
      const niche = extractSection('NICHE', 'BLUEPRINT') || extractSection('NICHE', 'CTA');
      const blueprintContent = extractSection('BLUEPRINT', 'EMBED_CODE') || extractSection('PURPOSE', 'KEYWORDS');
      const embedCode = extractSection('EMBED_CODE', 'CTA') || extractSection('EMBED CODE', 'LANDING PAGE HTML');
      const cta = extractSection('CTA', 'FORMAT') || extractSection('CTA', 'EMBED CODE');

      if (blueprintContent) setBlueprint(blueprintContent);
      if (targetKeyword) setTargetKeyword(targetKeyword);
      if (niche) setNicheTopic(niche);
      if (embedCode) setEmbedCode(embedCode);

      if (cta) {
        setIncludeCta(true);
        setCtaGoal(cta);
      }

      showToast({
        type: "success",
        title: "Auto-filled!",
        message: "All fields populated from bundle",
      });
    } catch (error) {
      console.error('Parse error:', error);
      showToast({
        type: "error",
        title: "Parse error",
        message: "Could not auto-fill fields",
      });
    }
  };

  const handleGenerate = async () => {
    if (!blueprint || !targetKeyword || !nicheTopic) return;

    setGenerating(true);
    setFullPageGenerated(false);
    setGeneratedHtml("");

    try {
      const res = await fetch("/api/content-wrapper/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          blueprint,
          target_keyword: targetKeyword,
          niche_topic: nicheTopic,
          include_cta: includeCta,
          cta_type: includeCta ? ctaType : null,
          cta_text: includeCta ? ctaGoal : null,
          cta_url: includeCta ? ctaUrl : null,
          use_platform_engine: import.meta.env.VITE_USE_PLATFORM_RENDER === "true",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContentPackage(data);
        await autoSaveCampaign(data);
        showToast({
          type: "success",
          title: "Content generated!",
          message: "Your SEO package is ready",
        });
      } else {
        const error = await res.json();
        showToast({
          type: "error",
          title: "Generation failed",
          message: error.error || "Could not generate content",
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to generate content",
      });
    } finally {
      setGenerating(false);
    }
  };

  const autoSaveCampaign = async (contentData: ContentPackage) => {
    const timestamp = new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
    const autoName = `${targetKeyword} - ${timestamp}`;

    try {
      await fetch("/api/content-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: autoName,
          blueprint,
          target_keyword: targetKeyword,
          niche_topic: nicheTopic,
          embed_code: embedCode,
          include_cta: includeCta,
          cta_type: includeCta ? ctaType : null,
          cta_text: includeCta ? ctaGoal : null,
          cta_url: includeCta ? ctaUrl : null,
          page_h1: contentData.page_h1,
          introduction: contentData.introduction,
          how_it_works: JSON.stringify(contentData.how_it_works),
          key_benefits: JSON.stringify(contentData.key_benefits),
          semantic_keywords: JSON.stringify(contentData.semantic_keywords),
          faq_section: JSON.stringify(contentData.faq_section),
          seo_title: contentData.meta_title,
          meta_description: contentData.meta_description,
          cta_block: contentData.cta_block,
          full_page_html: generatedHtml || null,
        }),
      });
      loadCampaignsAndProjects();
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  };

  const sanitizeEmbedCode = (code: string): string => {
    if (!code) return code;
    let sanitized = code;
    sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?html[^>]*>/gi, '');
    sanitized = sanitized.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    sanitized = sanitized.replace(/<\/?body[^>]*>/gi, '');
    sanitized = sanitized.replace(/<script[^>]*tailwindcss[^>]*><\/script>/gi, '');
    sanitized = sanitized.replace(/\n\s*\n/g, '\n');
    return sanitized.trim();
  };

  const handleGenerateFullHtmlPage = async () => {
    if (!contentPackage) return;

    setIsGeneratingHtml(true);
    setFullPageGenerated(false);
    setGeneratedHtml("");

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const howItWorksHTML = contentPackage.how_it_works
        .map(step => `
        <div class="step-card">
          <div class="step-number">${step.step_number}</div>
          <h3>${step.title}</h3>
          <p>${step.description}</p>
        </div>
      `).join("");

      const benefitsHTML = contentPackage.key_benefits
        .map((b, idx) => {
          const parts = b.split(':');
          const title = parts.length > 1 ? parts[0].trim() : b.split('.')[0] || 'Benefit';
          const description = parts.length > 1 ? parts.slice(1).join(':').trim() : b;

          return `
        <div class="benefit-card">
          <div class="benefit-icon">${idx + 1}</div>
          <div class="benefit-content">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        </div>
      `;
        }).join("");

      const faqHTML = contentPackage.faq_section
        .map(faq => `
        <details class="faq-item">
          <summary>${faq.question}</summary>
          <div class="faq-answer">
            <p>${faq.answer}</p>
          </div>
        </details>
      `).join("");

      const ctaContent = includeCta && ctaGoal && ctaUrl
        ? `
  <section class="final-cta">
    <div class="wrap">
      <div class="cta-content">
        <h2>Ready when you are</h2>
        <p>${ctaGoal}</p>
        <a href="${ctaUrl}" class="cta-button">Continue →</a>
      </div>
    </div>
  </section>
        `
        : contentPackage.cta_block || '';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contentPackage.meta_title}</title>
  <meta name="description" content="${contentPackage.meta_description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Source Sans 3', system-ui, sans-serif;
      line-height: 1.65;
      color: #0f172a;
      background: #f8f7f4;
    }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 0 22px; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
    }
    .eyebrow::before {
      content: '';
      width: 28px;
      height: 2px;
      background: linear-gradient(90deg, #64748b, #cbd5e1);
      border-radius: 2px;
    }
    .hero {
      background: radial-gradient(120% 90% at 10% 0%, rgba(71, 85, 105, 0.2), transparent 55%),
        radial-gradient(90% 70% at 90% 10%, rgba(30, 41, 59, 0.15), transparent 50%),
        linear-gradient(165deg, #0b1224 0%, #111827 42%, #0f172a 100%);
      color: #e2e8f0;
      padding: 72px 0 64px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    }
    .hero-grid {
      display: grid;
      gap: 40px;
      align-items: start;
    }
    @media (min-width: 900px) {
      .hero-grid { grid-template-columns: 1.15fr 0.85fr; gap: 56px; }
    }
    .hero h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 600;
      font-size: clamp(2.1rem, 4vw, 3.25rem);
      line-height: 1.12;
      letter-spacing: -0.02em;
      color: #f8fafc;
      margin: 16px 0 20px;
    }
    .hero-intro {
      font-size: 1.05rem;
      color: rgba(226, 232, 240, 0.88);
      max-width: 52ch;
    }
    .hero-panel {
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 18px;
      padding: 22px 22px 20px;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(10px);
    }
    .hero-panel h2 {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .meta-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .meta-pill {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      color: #e2e8f0;
      background: rgba(2, 6, 23, 0.35);
    }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 28px;
      padding: 12px 20px;
      border-radius: 999px;
      border: 1px solid rgba(226, 232, 240, 0.35);
      color: #f8fafc;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s, border-color 0.2s;
    }
    .btn-ghost:hover { background: rgba(248, 250, 252, 0.08); border-color: rgba(248, 250, 252, 0.55); }
    .tool-band {
      margin-top: -36px;
      padding-bottom: 72px;
    }
    .tool-frame {
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: #fff;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
      padding: 8px;
    }
    .tool-chrome {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .dot { width: 9px; height: 9px; border-radius: 999px; background: #e2e8f0; }
    .dot:nth-child(1) { background: #fda4af; }
    .dot:nth-child(2) { background: #fcd34d; }
    .dot:nth-child(3) { background: #cbd5e1; }
    .chrome-title { font-size: 12px; font-weight: 600; color: #64748b; margin-left: 8px; }
    .tool-body { padding: 28px 24px 32px; }
    .section { padding: 72px 0; }
    .section-head {
      max-width: 640px;
      margin-bottom: 36px;
    }
    .section-head h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(1.6rem, 2.6vw, 2.1rem);
      color: #0f172a;
      margin-bottom: 10px;
    }
    .section-head p { color: #475569; font-size: 1rem; }
    .rail {
      display: grid;
      gap: 18px;
    }
    @media (min-width: 768px) {
      .rail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    .step-card {
      position: relative;
      padding: 22px 20px 22px 20px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid #e2e8f0;
      min-height: 100%;
    }
    .step-card::before {
      content: '';
      position: absolute;
      left: 18px;
      top: 48px;
      bottom: -18px;
      width: 2px;
      background: linear-gradient(#94a3b8, transparent);
      opacity: 0.35;
      display: none;
    }
    @media (min-width: 768px) {
      .step-card:not(:last-child)::before { display: block; }
    }
    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      color: #334155;
      background: rgba(241, 245, 249, 0.95);
      border: 1px solid #cbd5e1;
      margin-bottom: 14px;
    }
    .step-card h3 { font-size: 1.05rem; margin-bottom: 8px; color: #0f172a; }
    .step-card p { font-size: 0.95rem; color: #475569; }
    .benefits-grid {
      display: grid;
      gap: 16px;
    }
    @media (min-width: 720px) {
      .benefits-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .benefit-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      border-radius: 16px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
    }
    .benefit-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      color: #334155;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .benefit-card h3 { font-size: 1rem; margin-bottom: 6px; color: #0f172a; }
    .benefit-card p { font-size: 0.92rem; color: #475569; }
    .faq-wrap { margin-top: 48px; }
    .faq-item {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #fff;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .faq-item summary {
      list-style: none;
      cursor: pointer;
      padding: 18px 20px;
      font-weight: 600;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .faq-item summary::-webkit-details-marker { display: none; }
    .faq-answer { padding: 0 20px 18px; color: #475569; font-size: 0.95rem; border-top: 1px solid #f1f5f9; }
    .final-cta {
      padding: 64px 22px;
      background: linear-gradient(120deg, #1e293b 0%, #334155 50%, #0f172a 100%);
      color: #f1f5f9;
      text-align: center;
    }
    .cta-content h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(1.75rem, 3vw, 2.35rem);
      margin-bottom: 12px;
      color: #f8fafc;
    }
    .cta-content p { font-size: 1.05rem; opacity: 0.95; margin-bottom: 22px; max-width: 560px; margin-left: auto; margin-right: auto; }
    .cta-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 28px;
      border-radius: 999px;
      background: #ffffff;
      color: #0f172a;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 10px 40px rgba(2, 6, 23, 0.2);
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap hero-grid">
      <div>
        <div class="eyebrow">Interactive landing</div>
        <h1>${contentPackage.page_h1}</h1>
        <div class="hero-intro">${contentPackage.introduction}</div>
        <a href="#tool" class="btn-ghost">Jump to the tool →</a>
      </div>
      <aside class="hero-panel" aria-label="Search signals">
        <h2>On-page signals</h2>
        <p style="font-size:14px;color:#cbd5e1;line-height:1.5;margin-bottom:14px;">Structured for readers and search: clear promise, proof, and a focused conversion path.</p>
        <div class="meta-row">
          <span class="meta-pill">Meta tuned</span>
          <span class="meta-pill">FAQ coverage</span>
          <span class="meta-pill">Embed-ready</span>
        </div>
      </aside>
    </div>
  </header>

  <section class="tool-band" id="tool">
    <div class="wrap">
      <div class="tool-frame">
        <div class="tool-chrome" aria-hidden="true">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="chrome-title">Embedded experience</span>
        </div>
        <div class="tool-body">
          ${sanitizeEmbedCode(embedCode) || '<p style="text-align:center;color:#94a3b8;font-size:15px;">Paste your widget embed to preview it in this frame.</p>'}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <h2>How it works</h2>
        <p>A tight narrative arc visitors can scan in seconds—then act.</p>
      </div>
      <div class="rail">${howItWorksHTML}</div>
      <div class="section-head" style="margin-top:56px;">
        <h2>Why it matters</h2>
        <p>Benefit-led proof points that reinforce the headline and reduce hesitation.</p>
      </div>
      <div class="benefits-grid">${benefitsHTML}</div>
      <div class="faq-wrap">${faqHTML}</div>
    </div>
  </section>

  ${ctaContent}
</body>
</html>`;

      setGeneratedHtml(html);
      setFullPageGenerated(true);

      showToast({
        type: "success",
        title: "HTML Generated!",
        message: "Landing page ready",
      });
    } catch (error) {
      console.error("HTML generation error:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to generate HTML",
      });
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    if (audienceCaptureEnabled && !selectedAudienceFlowPublicId) {
      showToast({
        type: "error",
        title: "Select a capture flow",
        message: "Pick a live flow before exporting with Audience capture enabled.",
      });
      return;
    }
    const html = getExportHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetKeyword.replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      type: "success",
      title: "Downloaded!",
      message: audienceCaptureEnabled ? "HTML includes Audience Growth widget." : "HTML file saved",
    });
  };

  const handleCopyHtml = () => {
    if (!generatedHtml) return;
    if (audienceCaptureEnabled && !selectedAudienceFlowPublicId) {
      showToast({
        type: "error",
        title: "Select a capture flow",
        message: "Pick a live flow before copying with Audience capture enabled.",
      });
      return;
    }
    navigator.clipboard.writeText(getExportHtml());
    showToast({
      type: "success",
      title: "Copied!",
      message: audienceCaptureEnabled ? "Clipboard includes Audience widget snippet." : "HTML copied to clipboard",
    });
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm("Delete this campaign?")) return;

    try {
      const res = await fetch(`/api/content-campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        showToast({ type: "success", title: "Deleted", message: "Campaign removed" });
        loadCampaignsAndProjects();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleLoadCampaign = (campaign: Campaign) => {
    setActiveTab("generate");
    setBlueprint(campaign.blueprint || "");
    setTargetKeyword(campaign.target_keyword || "");
    setNicheTopic(campaign.niche_topic || "");
    setEmbedCode(campaign.embed_code || "");
    setIncludeCta(campaign.include_cta || false);
    setCtaType(campaign.cta_type || "Collect Emails");
    setCtaGoal(campaign.cta_text || "");
    setCtaUrl(campaign.cta_url || "");

    if (campaign.full_page_html) {
      setGeneratedHtml(campaign.full_page_html);
      setFullPageGenerated(true);
    } else {
      setFullPageGenerated(false);
      setGeneratedHtml("");
    }

    if (campaign.page_h1 && campaign.introduction && campaign.how_it_works) {
      try {
        setContentPackage({
          page_h1: campaign.page_h1,
          introduction: campaign.introduction,
          how_it_works: JSON.parse(campaign.how_it_works),
          key_benefits: JSON.parse(campaign.key_benefits || "[]"),
          semantic_keywords: JSON.parse(campaign.semantic_keywords || "[]"),
          faq_section: JSON.parse(campaign.faq_section || "[]"),
          meta_title: campaign.meta_title || "",
          meta_description: campaign.meta_description || "",
          cta_block: campaign.cta_block,
        });
      } catch (error) {
        console.error("Parse error:", error);
      }
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignName || !contentPackage) return;
    try {
      await fetch("/api/content-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: campaignName,
          blueprint,
          target_keyword: targetKeyword,
          niche_topic: nicheTopic,
          embed_code: embedCode,
          include_cta: includeCta,
          cta_type: includeCta ? ctaType : null,
          cta_text: includeCta ? ctaGoal : null,
          cta_url: includeCta ? ctaUrl : null,
          page_h1: contentPackage.page_h1,
          introduction: contentPackage.introduction,
          how_it_works: JSON.stringify(contentPackage.how_it_works),
          key_benefits: JSON.stringify(contentPackage.key_benefits),
          semantic_keywords: JSON.stringify(contentPackage.semantic_keywords),
          faq_section: JSON.stringify(contentPackage.faq_section),
          seo_title: contentPackage.meta_title,
          meta_description: contentPackage.meta_description,
          cta_block: contentPackage.cta_block,
          full_page_html: generatedHtml || null,
        }),
      });
      setShowSaveModal(false);
      setCampaignName("");
      showToast({ type: "success", title: "Saved!", message: "Campaign saved" });
      loadCampaignsAndProjects();
    } catch (error) {
      console.error("Save error:", error);
      showToast({ type: "error", title: "Error", message: "Failed to save" });
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        >
          <div className="absolute -left-32 top-0 h-[420px] w-[520px] rounded-full bg-slate-400/10 blur-3xl" />
          <div className="absolute right-[-120px] top-24 h-[380px] w-[480px] rounded-full bg-slate-300/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[280px] w-[720px] translate-y-1/3 rounded-full bg-slate-900/[0.03] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "generate" | "saved")}
            className="gap-8"
          >
            <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground">
                    <Layers className="h-3.5 w-3.5" />
                  </span>
                  Content workspace
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Content wrapper
                  </h1>
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-[15px]">
                    Generate structured SEO copy from your blueprint, review metadata and sections, then export a complete HTML landing page with your embed in place.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="border-border bg-background font-medium text-foreground">
                    Blueprint-aware
                  </Badge>
                  <Badge variant="outline" className="border-border bg-background font-medium text-foreground">
                    Full-page export
                  </Badge>
                  <Badge variant="outline" className="border-border bg-muted/50 font-medium text-muted-foreground">
                    Campaign library
                  </Badge>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                <TabsList variant="line" className="h-auto w-full justify-start gap-1 rounded-2xl border border-border bg-white/70 p-1 shadow-sm backdrop-blur-sm sm:w-auto sm:justify-end">
                  <TabsTrigger value="generate" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:shadow-sm">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    Compose
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:shadow-sm">
                    <Library className="h-4 w-4 shrink-0" />
                    Library
                    <span className="ml-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
                      {campaigns.length}
                    </span>
                  </TabsTrigger>
                </TabsList>
                {activeTab === "generate" && (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-white/50 px-4 py-3 text-xs text-muted-foreground backdrop-blur-sm sm:max-w-xs sm:text-left">
                    <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-semibold text-foreground">Readiness:</span>{" "}
                      {[blueprint, targetKeyword, nicheTopic].filter(Boolean).length}/3 inputs set
                    </span>
                  </div>
                )}
              </div>
            </header>

            <TabsContent value="generate" className="mt-0 space-y-10 animate-fade-in-up outline-none">
              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-r from-violet-500/[0.06] via-transparent to-sky-500/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        WordPress publishing
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {wpDestinations.length === 0
                          ? "Connect a site in Publishing Hub to unlock direct deploy for wrapped HTML, landing pages, and SEO assets."
                          : `${wpDestinations.length} connected destination${wpDestinations.length === 1 ? "" : "s"} — publish queue targets Content Wrapper output.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {wpDestinations.slice(0, 4).map((s: WordPressDestinationSummary) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/90 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm"
                      >
                        <img
                          src={faviconUrl(s.domain)}
                          alt=""
                          className="h-4 w-4 rounded"
                        />
                        <span className="max-w-[140px] truncate">{s.siteName}</span>
                        {!s.publishingAccess && (
                          <span className="text-[10px] text-amber-600">limited</span>
                        )}
                      </span>
                    ))}
                    <Link
                      to="/audience-growth"
                      className="inline-flex items-center gap-1 rounded-xl border border-violet-200/70 bg-violet-50/50 px-3 py-1.5 text-xs font-semibold text-violet-900 transition hover:bg-violet-100/60"
                    >
                      <Radar className="h-3.5 w-3.5" />
                      Audience Engine
                    </Link>
                    <Link
                      to="/wordpress"
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/60"
                    >
                      Publishing Hub
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-border/80 shadow-md shadow-slate-900/[0.04]">
                      <CardHeader className="border-b border-border/60 bg-gradient-to-br from-white to-muted/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base font-semibold">Brief</CardTitle>
                            <CardDescription>Blueprint or pasted bundle (auto-fill supported).</CardDescription>
                          </div>
                          <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Step 1
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Blueprint
                        </label>
                        <textarea
                          value={blueprint}
                          onChange={(e) => handleBlueprintChange(e.target.value)}
                          placeholder="Paste blueprint, JSON bundle, or vendor export…"
                          rows={7}
                          className="min-h-[160px] w-full resize-y rounded-xl border border-input bg-background/80 px-3.5 py-3 text-sm shadow-inner transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-md shadow-slate-900/[0.04]">
                      <CardHeader className="border-b border-border/60 bg-gradient-to-br from-white to-muted/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base font-semibold">Targeting</CardTitle>
                            <CardDescription>Anchor the page to one keyword and a clear topical lane.</CardDescription>
                          </div>
                          <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Step 2
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-5">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Target keyword
                          </label>
                          <input
                            type="text"
                            value={targetKeyword}
                            onChange={(e) => setTargetKeyword(e.target.value)}
                            placeholder="e.g., affiliate revenue engine"
                            className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-sm shadow-inner transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Niche / topic
                          </label>
                          <input
                            type="text"
                            value={nicheTopic}
                            onChange={(e) => setNicheTopic(e.target.value)}
                            placeholder="e.g., personal finance"
                            className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-sm shadow-inner transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-border/80 shadow-md shadow-slate-900/[0.04]">
                    <CardHeader className="border-b border-border/60 bg-gradient-to-br from-slate-900/[0.03] to-white">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">Embed & conversion</CardTitle>
                          <CardDescription>Optional widget embed plus a focused CTA lane.</CardDescription>
                        </div>
                        <span className="w-fit rounded-lg bg-slate-900/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          Step 3
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Embed code <span className="font-normal normal-case text-muted-foreground/80">(optional)</span>
                        </label>
                        <textarea
                          value={embedCode}
                          onChange={(e) => setEmbedCode(e.target.value)}
                          placeholder="Paste widget / iframe snippet…"
                          rows={4}
                          className="w-full resize-y rounded-xl border border-input bg-muted/30 px-3.5 py-3 font-mono text-[13px] leading-relaxed shadow-inner transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                        />
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/25 p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={includeCta}
                            onChange={(e) => setIncludeCta(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-input text-foreground focus:ring-foreground/15"
                          />
                          <span>
                            <span className="text-sm font-semibold text-foreground">Include call to action</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              Adds a conversion block to generated HTML when goal and URL are set.
                            </span>
                          </span>
                        </label>

                        {includeCta && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">CTA intent</label>
                              <Select value={ctaType} onValueChange={setCtaType}>
                                <SelectTrigger className="h-11 w-full rounded-xl border-input bg-background">
                                  <SelectValue placeholder="Choose intent" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Collect Emails">Collect emails</SelectItem>
                                  <SelectItem value="Book a Call">Book a call</SelectItem>
                                  <SelectItem value="Start Trial">Start trial</SelectItem>
                                  <SelectItem value="Buy Now">Buy now</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Goal copy</label>
                              <input
                                type="text"
                                value={ctaGoal}
                                onChange={(e) => setCtaGoal(e.target.value)}
                                placeholder="What should visitors do next?"
                                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination URL</label>
                              <input
                                type="text"
                                value={ctaUrl}
                                onChange={(e) => setCtaUrl(e.target.value)}
                                placeholder="https://"
                                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        size="lg"
                        className="h-12 w-full gap-2 rounded-2xl shadow-sm"
                        onClick={handleGenerate}
                        disabled={generating || !blueprint || !targetKeyword || !nicheTopic}
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating package…
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5" />
                            Generate content package
                            <ArrowRight className="h-4 w-4 opacity-90" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
              </div>

              {contentPackage && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Generated package</h2>
                      <p className="text-sm text-muted-foreground">Review copy, coverage, then export HTML.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          const content = `SEO TITLE: ${contentPackage.meta_title}\n\nMETA DESCRIPTION: ${contentPackage.meta_description}\n\nH1: ${contentPackage.page_h1}\n\nINTRO:\n${contentPackage.introduction}`;
                          navigator.clipboard.writeText(content);
                          showToast({ type: "success", title: "Copied", message: "Top-of-funnel copy on your clipboard" });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Copy hero block
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowSaveModal(true)}>
                        <Save className="h-4 w-4" />
                        Save as campaign
                      </Button>
                    </div>
                  </div>

                  <Card className="overflow-hidden border-border/80 shadow-lg shadow-slate-900/[0.06]">
                    <CardHeader className="border-b border-border/70 bg-gradient-to-r from-white via-muted/40 to-muted/20">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold">Live breakdown</CardTitle>
                          <CardDescription>Tabbed review so each section gets breathing room.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {contentPackage.semantic_keywords.length} keywords
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Tabs defaultValue="signals" className="gap-5">
                        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1">
                          <TabsTrigger value="signals" className="gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm">
                            <Hash className="h-3.5 w-3.5" />
                            Signals
                          </TabsTrigger>
                          <TabsTrigger value="body" className="gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm">
                            <FileText className="h-3.5 w-3.5" />
                            On-page
                          </TabsTrigger>
                          <TabsTrigger value="structure" className="gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm">
                            <Layers className="h-3.5 w-3.5" />
                            Structure
                          </TabsTrigger>
                          <TabsTrigger value="faq" className="gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm">
                            <MessageCircleQuestion className="h-3.5 w-3.5" />
                            FAQ
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="signals" className="mt-0 space-y-5 outline-none">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-border bg-muted/20 p-4">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meta title</p>
                              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{contentPackage.meta_title}</p>
                            </div>
                            <div className="rounded-2xl border border-border bg-muted/20 p-4">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meta description</p>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contentPackage.meta_description}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Semantic keywords</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {contentPackage.semantic_keywords.length === 0 ? (
                                <span className="text-sm text-muted-foreground">No keyword list returned.</span>
                              ) : (
                                contentPackage.semantic_keywords.map((kw) => (
                                  <Badge key={kw} variant="outline" className="rounded-full border-border bg-muted/40 font-normal text-foreground">
                                    {kw}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="body" className="mt-0 space-y-5 outline-none">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Page headline</p>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{contentPackage.page_h1}</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Introduction</p>
                            <div
                              className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_p:not(:last-child)]:mb-3"
                              dangerouslySetInnerHTML={{ __html: contentPackage.introduction }}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="structure" className="mt-0 grid gap-6 lg:grid-cols-2 outline-none">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              How it works · {contentPackage.how_it_works.length} steps
                            </p>
                            <div className="relative mt-4 space-y-4 pl-1">
                              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent" aria-hidden />
                              {contentPackage.how_it_works.map((step) => (
                                <div key={step.step_number} className="relative flex gap-4">
                                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-foreground">
                                    {step.step_number}
                                  </span>
                                  <div className="min-w-0 flex-1 rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
                                    <p className="font-semibold text-foreground">{step.title}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              Key benefits · {contentPackage.key_benefits.length}
                            </p>
                            <ul className="mt-4 space-y-3">
                              {contentPackage.key_benefits.map((benefit, i) => (
                                <li
                                  key={i}
                                  className="flex gap-3 rounded-2xl border border-border bg-gradient-to-br from-white to-muted/30 p-4 shadow-sm"
                                >
                                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                                    <Check className="h-4 w-4" />
                                  </span>
                                  <span className="text-sm leading-relaxed text-muted-foreground">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TabsContent>

                        <TabsContent value="faq" className="mt-0 outline-none">
                          {contentPackage.faq_section.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No FAQ items in this package.</p>
                          ) : (
                            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-white/60">
                              {contentPackage.faq_section.map((faq, idx) => (
                                <AccordionItem key={idx} value={`faq-${idx}`} className="border-border/80">
                                  <AccordionTrigger className="px-4 text-left text-sm font-semibold text-foreground hover:no-underline">
                                    {faq.question}
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 text-sm leading-relaxed text-muted-foreground">
                                    {faq.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card className="border-border/80 shadow-md">
                    <CardHeader className="border-b border-border/60 bg-gradient-to-r from-slate-900/[0.04] to-white">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">Full-page HTML</CardTitle>
                          <CardDescription>Editorial shell + embed frame + structured sections.</CardDescription>
                        </div>
                        {fullPageGenerated && (
                          <Badge variant="outline" className="w-fit border-border bg-muted/50 text-foreground">
                            Ready to ship
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {!fullPageGenerated ? (
                        <Button
                          size="lg"
                          className="h-12 w-full gap-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-900/90"
                          onClick={handleGenerateFullHtmlPage}
                          disabled={isGeneratingHtml}
                        >
                          {isGeneratingHtml ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Building HTML…
                            </>
                          ) : (
                            <>
                              <Code2 className="h-5 w-5" />
                              Generate HTML page
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-5">
                          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-slate-50/90 via-white to-violet-50/25 p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Deploy pipeline
                                </p>
                                <h3 className="mt-1 text-base font-semibold text-foreground">Asset → Audience → Publish → Analytics</h3>
                                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                                  Attach a live capture flow, preview the real gate in the iframe, then hand off deploy-ready HTML to
                                  Publishing Hub with attribution preserved.
                                </p>
                              </div>
                              <Badge variant="outline" className="shrink-0 border-emerald-200/80 bg-emerald-50/70 text-emerald-900">
                                Live wiring
                              </Badge>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              {[
                                { step: "1", title: "Asset", desc: "HTML ready", ok: true, Icon: Layers },
                                {
                                  step: "2",
                                  title: "Audience",
                                  desc: audienceCaptureEnabled ? "Capture on" : "Optional",
                                  ok: audienceCaptureEnabled && !!selectedAudienceFlowPublicId,
                                  Icon: UserPlus,
                                },
                                {
                                  step: "3",
                                  title: "Preview",
                                  desc: gatePreviewMode ? "Gate + page" : "Base page",
                                  ok: true,
                                  Icon: MonitorPlay,
                                },
                                {
                                  step: "4",
                                  title: "Publish",
                                  desc: wpDestinations.length ? "Hub reachable" : "Connect a site",
                                  ok: wpDestinations.length > 0,
                                  Icon: Send,
                                },
                              ].map(({ step, title, desc, ok, Icon }) => (
                                <div
                                  key={step}
                                  className={`rounded-xl border px-3 py-3 ${
                                    ok ? "border-emerald-200/80 bg-white shadow-sm" : "border-border/60 bg-muted/15"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                      {step}
                                    </span>
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-sm font-semibold text-foreground">{title}</p>
                                  </div>
                                  <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
                                </div>
                              ))}
                            </div>

                            <div className="mt-6 grid gap-5 border-t border-border/50 pt-6 lg:grid-cols-2">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-white/85 px-4 py-3">
                                  <div>
                                    <Label htmlFor="cw-audience-cap" className="text-sm font-semibold text-foreground">
                                      Enable audience capture
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      Injects the production widget before <span className="font-mono">&lt;/body&gt;</span> on export.
                                    </p>
                                  </div>
                                  <Switch
                                    id="cw-audience-cap"
                                    checked={audienceCaptureEnabled}
                                    onCheckedChange={(v) => {
                                      setAudienceCaptureEnabled(v);
                                      if (v) setGatePreviewMode(true);
                                    }}
                                  />
                                </div>
                                {audienceCaptureEnabled && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Capture flow</Label>
                                    {audienceFlows.length > 0 ? (
                                      <Select
                                        value={selectedAudienceFlowPublicId || undefined}
                                        onValueChange={setSelectedAudienceFlowPublicId}
                                        disabled={audienceFlowsLoading}
                                      >
                                        <SelectTrigger className="h-11 rounded-xl bg-white">
                                          <SelectValue
                                            placeholder={audienceFlowsLoading ? "Loading flows…" : "Select a live flow"}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {audienceFlows.map((f) => (
                                            <SelectItem key={f.publicId} value={f.publicId} disabled={f.status !== "live"}>
                                              {f.name} · {f.captureMethod}
                                              {f.status !== "live" ? ` (${f.status})` : ""}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : null}
                                    {audienceFlows.length === 0 && !audienceFlowsLoading && (
                                      <p className="text-xs text-muted-foreground">
                                        No flows yet.{" "}
                                        <Link
                                          to="/audience-growth"
                                          className="font-semibold text-foreground underline-offset-2 hover:underline"
                                        >
                                          Audience Growth Engine
                                        </Link>{" "}
                                        creates them.
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant={!gatePreviewMode ? "default" : "outline"}
                                    size="sm"
                                    className="gap-2 rounded-xl"
                                    onClick={() => setGatePreviewMode(false)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Page only
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={gatePreviewMode ? "default" : "outline"}
                                    size="sm"
                                    className="gap-2 rounded-xl"
                                    disabled={!audienceCaptureEnabled || !selectedAudienceFlowPublicId}
                                    onClick={() => setGatePreviewMode(true)}
                                  >
                                    <MonitorPlay className="h-4 w-4" />
                                    Preview gate
                                  </Button>
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                  Preview loads the same <span className="font-mono text-xs">widget.js</span> as production (blur overlay,
                                  email form, or Google unlock per flow). OAuth may require a top-level window depending on browser
                                  sandbox rules.
                                </p>
                              </div>
                              <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-white/90 p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                    <Workflow className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Publishing handoff</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Packages HTML for WordPress: paste into a Custom HTML block, template, or your deployment tool.
                                      Analytics continue to aggregate under your asset key{" "}
                                      <span className="font-mono text-[10px] text-foreground/80">{audienceAssetKey}</span>.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    type="button"
                                    className="flex-1 gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-900/90"
                                    onClick={handlePipelinePublish}
                                  >
                                    <Send className="h-4 w-4" />
                                    Publish
                                  </Button>
                                  <Button type="button" variant="outline" className="flex-1 rounded-xl" asChild>
                                    <Link to="/audience-growth">Analytics</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              size="lg"
                              className="h-11 flex-1 gap-2 rounded-2xl shadow-sm"
                              onClick={handleDownloadHtml}
                            >
                              <Download className="h-4 w-4" />
                              Download HTML
                            </Button>
                            <Button size="lg" variant="outline" className="h-11 flex-1 gap-2 rounded-2xl" onClick={handleCopyHtml}>
                              <Copy className="h-4 w-4" />
                              Copy code
                            </Button>
                          </div>

                          {fullPagePreviewUrl && (
                            <div className="overflow-hidden rounded-2xl border border-border shadow-inner">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {gatePreviewMode && audienceCaptureEnabled && selectedAudienceFlowPublicId
                                      ? "Live preview · audience gate on"
                                      : "Live preview · base page"}
                                  </span>
                                </div>
                                {gatePreviewMode && audienceCaptureEnabled && selectedAudienceFlowPublicId && (
                                  <Badge variant="secondary" className="font-mono text-[10px]">
                                    flow {selectedAudienceFlowPublicId.slice(0, 8)}…
                                  </Badge>
                                )}
                              </div>
                              <iframe
                                src={fullPagePreviewUrl}
                                title="Content wrapper HTML preview"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                                className="h-[min(640px,70vh)] w-full border-none bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-0 outline-none animate-fade-in-up">
              {loadingCampaigns ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-border bg-white/50">
                  <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <Card className="border-dashed border-2 border-border/80 bg-white/60 py-16 text-center shadow-none">
                  <CardContent className="flex flex-col items-center gap-3 pt-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Folder className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">No campaigns yet</p>
                      <p className="max-w-md text-sm text-muted-foreground">
                        Generate a package once—auto-save runs in the background, and named saves land here for reload.
                      </p>
                    </div>
                    <Button className="mt-2 rounded-xl" onClick={() => setActiveTab("generate")}>
                      Go to compose
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {campaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="group overflow-hidden border-border/80 shadow-md transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <CardHeader className="border-b border-border/60 bg-gradient-to-br from-white to-muted/40 pb-4">
                        <CardTitle className="line-clamp-2 text-base">{campaign.name}</CardTitle>
                        <CardDescription>{new Date(campaign.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-5">
                        {campaign.target_keyword && (
                          <Badge variant="outline" className="rounded-full border-border bg-muted/40 font-normal text-foreground">
                            {campaign.target_keyword}
                          </Badge>
                        )}
                        <div className="flex gap-2">
                          <Button className="flex-1 gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-900/90" onClick={() => handleLoadCampaign(campaign)}>
                            <ArrowRight className="h-4 w-4" />
                            Load
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-xl border border-transparent"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            aria-label="Delete campaign"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => setShowSaveModal(false)}
          role="presentation"
        >
          <Card
            className="w-full max-w-md border-border/80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-campaign-title"
          >
            <CardHeader className="border-b border-border/60 bg-muted/30">
              <CardTitle id="save-campaign-title" className="text-lg">
                Save campaign
              </CardTitle>
              <CardDescription>Pick a memorable name—you can reload everything from the library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Campaign name…"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && campaignName) {
                    handleSaveCampaign();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowSaveModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl" disabled={!campaignName} onClick={handleSaveCampaign}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
