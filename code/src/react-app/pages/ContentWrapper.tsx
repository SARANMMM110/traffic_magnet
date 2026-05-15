import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { cn } from "@/react-app/lib/utils";
import { useToast } from "@/react-app/components/Toast";
import { useBlobHtmlPreview } from "@/react-app/lib/useBlobHtmlPreview";
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

export default function ContentWrapper() {
  const { showToast } = useToast();
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

  const fullPagePreviewUrl = useBlobHtmlPreview(
    fullPageGenerated && generatedHtml ? generatedHtml : null
  );

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
    <div class="page-container">
      <div class="cta-content">
        <h2>Ready to Get Started?</h2>
        <p>${ctaGoal}</p>
        <a href="${ctaUrl}" class="cta-button">Start Now</a>
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827; }
    .page-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .hero { padding: 120px 32px 100px; text-align: center; background: linear-gradient(180deg, #fafbff 0%, #fff 100%); }
    .hero h1 { font-size: clamp(40px, 6vw, 68px); font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; }
    .hero-intro { max-width: 720px; margin: 0 auto 40px; font-size: 18px; color: #475569; }
    .btn-primary { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7C5CFC, #a78bfa); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 20px rgba(124, 92, 252, 0.3); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124, 92, 252, 0.4); }
    .tool-section { padding: 100px 0; }
    .tool-card { max-width: 1100px; margin: 0 auto; background: rgba(255,255,255,0.9); border-radius: 24px; padding: 48px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
    .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; margin: 80px 0; }
    .step-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; }
    .step-number { width: 48px; height: 48px; background: linear-gradient(135deg, #7C5CFC, #a78bfa); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 20px; }
    .step-card h3 { font-size: 20px; margin-bottom: 12px; }
    .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin: 80px 0; }
    .benefit-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; display: flex; gap: 20px; }
    .benefit-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #7C5CFC, #a78bfa); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .faq-item { background: white; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 16px; }
    .faq-item summary { padding: 24px; cursor: pointer; font-weight: 600; list-style: none; }
    .faq-answer { padding: 0 24px 24px; color: #64748b; }
    .final-cta { padding: 100px 32px; background: linear-gradient(135deg, #7C5CFC, #a78bfa); text-align: center; }
    .cta-content h2 { font-size: 42px; color: white; margin-bottom: 20px; }
    .cta-content p { font-size: 18px; color: rgba(255,255,255,0.95); margin-bottom: 32px; }
    .cta-button { display: inline-block; padding: 18px 48px; background: white; color: #7C5CFC; border-radius: 12px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="page-container">
      <h1>${contentPackage.page_h1}</h1>
      <div class="hero-intro">${contentPackage.introduction}</div>
      <a href="#tool" class="btn-primary">Get Started</a>
    </div>
  </section>
  
  <section class="tool-section" id="tool">
    <div class="page-container">
      <div class="tool-card">
        ${sanitizeEmbedCode(embedCode) || '<p style="text-align:center;color:#999;">Tool embed code will appear here</p>'}
      </div>
    </div>
  </section>
  
  <section class="page-container">
    <div class="steps-grid">${howItWorksHTML}</div>
    <div class="benefits-grid">${benefitsHTML}</div>
    ${faqHTML}
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
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetKeyword.replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "Downloaded!", message: "HTML file saved" });
  };

  const handleCopyHtml = () => {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml);
    showToast({ type: "success", title: "Copied!", message: "HTML copied to clipboard" });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Header */}
        <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Content Wrapper
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Transform blueprints into SEO-optimized content packages with structured sections and exportable HTML
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 flex gap-2">
              <button
                onClick={() => setActiveTab("generate")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                  activeTab === "generate"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                )}
              >
                <Sparkles className="h-4 w-4" />
                Generate
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                  activeTab === "saved"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                )}
              >
                <Folder className="h-4 w-4" />
                Saved
                <span className="ml-1 rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-bold">
                  {campaigns.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          {activeTab === "generate" ? (
            <div className="space-y-8">
              {/* Input Form */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-5">
                  <h2 className="text-lg font-bold text-slate-900">Setup</h2>
                  <p className="mt-1 text-sm text-slate-600">Paste your blueprint and configuration</p>
                </div>
                <div className="space-y-6 p-8">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Blueprint
                    </label>
                    <textarea
                      value={blueprint}
                      onChange={(e) => handleBlueprintChange(e.target.value)}
                      placeholder="Paste blueprint or bundle here..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      rows={6}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Target Keyword
                      </label>
                      <input
                        type="text"
                        value={targetKeyword}
                        onChange={(e) => setTargetKeyword(e.target.value)}
                        placeholder="e.g., affiliate revenue engine"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Niche / Topic
                      </label>
                      <input
                        type="text"
                        value={nicheTopic}
                        onChange={(e) => setNicheTopic(e.target.value)}
                        placeholder="e.g., personal finance"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Embed Code <span className="text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      value={embedCode}
                      onChange={(e) => setEmbedCode(e.target.value)}
                      placeholder="Paste widget embed code..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      rows={4}
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeCta}
                        onChange={(e) => setIncludeCta(e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300 text-indigo-600 transition focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="text-sm font-semibold text-slate-900">
                        Include Call to Action
                      </span>
                    </label>

                    {includeCta && (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          value={ctaGoal}
                          onChange={(e) => setCtaGoal(e.target.value)}
                          placeholder="CTA text"
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <input
                          type="text"
                          value={ctaUrl}
                          onChange={(e) => setCtaUrl(e.target.value)}
                          placeholder="URL"
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating || !blueprint || !targetKeyword || !nicheTopic}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Generate Content Package
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Output */}
              {contentPackage && (
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        const content = `SEO TITLE: ${contentPackage.meta_title}\n\nMETA DESCRIPTION: ${contentPackage.meta_description}\n\nH1: ${contentPackage.page_h1}\n\nINTRO:\n${contentPackage.introduction}`;
                        navigator.clipboard.writeText(content);
                        showToast({ type: "success", title: "Copied!", message: "Content copied" });
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>

                  {/* Content Preview */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-8 py-5">
                      <h3 className="text-lg font-bold text-slate-900">Generated Content</h3>
                      <p className="mt-1 text-sm text-slate-600">SEO metadata and structured copy</p>
                    </div>
                    <div className="space-y-6 p-8">
                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Meta Title</div>
                        <div className="text-base text-slate-900">{contentPackage.meta_title}</div>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Meta Description</div>
                        <div className="text-sm text-slate-700">{contentPackage.meta_description}</div>
                      </div>
                      <div className="border-t border-slate-100 pt-6">
                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Page Headline</div>
                        <div className="text-2xl font-bold text-slate-900">{contentPackage.page_h1}</div>
                      </div>
                      <div>
                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Introduction</div>
                        <div className="text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: contentPackage.introduction }} />
                      </div>
                      <div>
                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                          How It Works ({contentPackage.how_it_works.length} steps)
                        </div>
                        <div className="space-y-3">
                          {contentPackage.how_it_works.map((step) => (
                            <div key={step.step_number} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                              <div className="font-bold text-slate-900">{step.step_number}. {step.title}</div>
                              <div className="mt-1 text-sm text-slate-600">{step.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Key Benefits ({contentPackage.key_benefits.length})
                        </div>
                        <div className="space-y-2">
                          {contentPackage.key_benefits.map((benefit, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                              <span className="text-sm text-slate-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HTML Builder */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-8 py-5">
                      <h3 className="text-lg font-bold text-slate-900">Full Page HTML</h3>
                      <p className="mt-1 text-sm text-slate-600">Generate complete landing page</p>
                    </div>
                    <div className="p-8">
                      {!fullPageGenerated ? (
                        <div className="space-y-4">
                          <button
                            onClick={handleGenerateFullHtmlPage}
                            disabled={isGeneratingHtml}
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl disabled:opacity-50"
                          >
                            {isGeneratingHtml ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Building HTML...
                              </>
                            ) : (
                              <>
                                <Code2 className="h-5 w-5" />
                                Generate HTML Page
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <button
                              onClick={handleDownloadHtml}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                            >
                              <Download className="h-4 w-4" />
                              Download HTML
                            </button>
                            <button
                              onClick={handleCopyHtml}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                              <Copy className="h-4 w-4" />
                              Copy Code
                            </button>
                          </div>

                          {fullPagePreviewUrl && (
                            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-lg">
                              <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3">
                                <Eye className="h-4 w-4 text-slate-600" />
                                <span className="text-xs font-semibold text-slate-600">Live Preview</span>
                              </div>
                              <iframe
                                src={fullPagePreviewUrl}
                                title="Preview"
                                sandbox="allow-scripts"
                                className="h-[600px] w-full border-none bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Saved Tab
            <div>
              {loadingCampaigns ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-8 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <Folder className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-slate-900">No saved campaigns</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-600">
                    Generate content from the Generate tab to save campaigns here
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                    >
                      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                        <h3 className="font-bold text-slate-900">{campaign.name}</h3>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-6">
                        {campaign.target_keyword && (
                          <div className="mb-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {campaign.target_keyword}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadCampaign(campaign)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:shadow-md"
                          >
                            <ArrowRight className="h-4 w-4" />
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
              <h3 className="text-xl font-bold text-slate-900">Save Campaign</h3>
              <p className="mt-1 text-sm text-slate-600">Enter a name for this campaign</p>
            </div>
            <div className="p-8">
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Campaign name..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && campaignName) {
                    handleSaveCampaign();
                  }
                }}
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCampaign}
                  disabled={!campaignName}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
