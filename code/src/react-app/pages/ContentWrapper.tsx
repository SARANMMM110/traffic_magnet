import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import {
  FileText,
  Loader2,
  Copy,
  Download,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  Sparkles,
  Folder,
  FileCode,
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

interface Project {
  id: number;
  name: string;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  
  // Build Full Page state
  const [fullPageGenerated, setFullPageGenerated] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [isBuildingPage, setIsBuildingPage] = useState(false);
  const [buildStep, setBuildStep] = useState("");
  
  // CTA input fields
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
      const [campaignsRes, projectsRes] = await Promise.all([
        fetch("/api/content-campaigns", { credentials: "include" }),
        fetch("/api/projects", { credentials: "include" }),
      ]);
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
      
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleBlueprintChange = (value: string) => {
    // Check if this is a structured bundle from "Copy All for Content Wrapper"
    if (value.includes('TOOL_NAME:') && value.includes('TARGET_KEYWORD:') && value.includes('EMBED_CODE:')) {
      parseStructuredBundle(value);
      return; // Don't set the full bundle to blueprint
    } else if (value.includes('BLUEPRINT:') && value.includes('TARGET KEYWORD:')) {
      // Legacy format support
      parseStructuredBundle(value);
      return; // Don't set the full bundle to blueprint
    }
    
    // Try to parse as JSON bundle (legacy)
    try {
      const parsed = JSON.parse(value);
      if (parsed.blueprint || parsed.target_keyword || parsed.niche_topic || parsed.embed_code) {
        // This is a JSON bundle, parse and set individual fields
        if (parsed.blueprint) setBlueprint(parsed.blueprint);
        if (parsed.target_keyword) setTargetKeyword(parsed.target_keyword);
        if (parsed.niche_topic) setNicheTopic(parsed.niche_topic);
        if (parsed.embed_code) setEmbedCode(parsed.embed_code);
        return; // Don't set the full JSON to blueprint
      }
    } catch {
      // Not JSON, continue to set as regular blueprint
    }
    
    // Not a bundle, just regular blueprint text
    setBlueprint(value);
  };

  const parseStructuredBundle = (bundleText: string) => {
    try {
      // Extract sections using regex
      const extractSection = (label: string, nextLabel?: string) => {
        const regex = nextLabel 
          ? new RegExp(`${label}:\\s*([\\s\\S]*?)(?=${nextLabel}:)`, 'i')
          : new RegExp(`${label}:\\s*([\\s\\S]*)$`, 'i');
        const match = bundleText.match(regex);
        return match ? match[1].trim() : '';
      };

      // Extract all sections - support both new and legacy formats
      const targetKeyword = extractSection('TARGET_KEYWORD', 'NICHE') || extractSection('TARGET KEYWORD', 'NICHE');
      const niche = extractSection('NICHE', 'BLUEPRINT') || extractSection('NICHE', 'CTA');
      const blueprintContent = extractSection('BLUEPRINT', 'EMBED_CODE') || extractSection('PURPOSE', 'KEYWORDS');
      const embedCode = extractSection('EMBED_CODE', 'CTA') || extractSection('EMBED CODE', 'LANDING PAGE HTML');
      const cta = extractSection('CTA', 'FORMAT') || extractSection('CTA', 'EMBED CODE');
      
      // Auto-fill form fields
      if (blueprintContent) setBlueprint(blueprintContent);
      if (targetKeyword) setTargetKeyword(targetKeyword);
      if (niche) setNicheTopic(niche);
      if (embedCode) setEmbedCode(embedCode);
      
      // Auto-enable CTA if present
      if (cta) {
        setIncludeCta(true);
        setCtaGoal(cta);
      }

      // Show success toast
      showToast({
        type: "success",
        title: "Auto-filled successfully!",
        message: "All Content Wrapper fields populated from bundle",
      });
    } catch (error) {
      console.error('Failed to parse structured bundle:', error);
      showToast({
        type: "error",
        title: "Parse error",
        message: "Could not auto-fill fields from pasted content",
      });
    }
  };

  const handleGenerate = async () => {
    if (!blueprint || !targetKeyword || !nicheTopic) return;

    setGenerating(true);
    // Reset full page state when regenerating content
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContentPackage(data);
        
        // AUTO-SAVE: Automatically save the campaign after successful generation
        await autoSaveCampaign(data);
        
        showToast({
          type: "success",
          title: "Content generated!",
          message: "Your SEO content package is ready",
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
        message: "Failed to generate content package",
      });
    } finally {
      setGenerating(false);
    }
  };

  const autoSaveCampaign = async (contentData: ContentPackage) => {
    // Generate automatic campaign name from target keyword and timestamp
    const timestamp = new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
    const autoName = `${targetKeyword} - ${timestamp}`;

    try {
      const res = await fetch("/api/content-campaigns", {
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

      if (res.ok) {
        // Refresh campaigns list silently
        loadCampaignsAndProjects();
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      // Fail silently - user can still manually save if needed
    }
  };

  // Sanitize embed code to remove document-level tags and prevent nesting issues
  const sanitizeEmbedCode = (code: string): string => {
    if (!code) return code;

    let sanitized = code;

    // Remove DOCTYPE declaration
    sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');

    // Remove opening and closing html tags
    sanitized = sanitized.replace(/<\/?html[^>]*>/gi, '');

    // Remove head section completely
    sanitized = sanitized.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

    // Remove opening and closing body tags (but keep content)
    sanitized = sanitized.replace(/<\/?body[^>]*>/gi, '');

    // Remove Tailwind CDN script tags
    sanitized = sanitized.replace(/<script[^>]*tailwindcss[^>]*><\/script>/gi, '');

    // Remove any remaining style tags that might conflict
    sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?html\s*\{[\s\S]*?<\/style>/gi, '');
    sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?body\s*\{[\s\S]*?<\/style>/gi, '');

    // Clean up multiple whitespace/newlines
    sanitized = sanitized.replace(/\n\s*\n/g, '\n');

    return sanitized.trim();
  };

  const handleGenerateFullHtmlPage = async () => {
    if (!contentPackage) return;

    setIsBuildingPage(true);
    setIsGeneratingHtml(true);
    setFullPageGenerated(false);
    setGeneratedHtml("");

    try {
      // Step 1: Generating responsive layout
      setBuildStep("Generating responsive layout...");
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 2: Building content sections
      setBuildStep("Building content sections...");
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 3: Creating visual design
      setBuildStep("Creating visual design...");
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 4: Optimizing mobile responsiveness
      setBuildStep("Optimizing mobile responsiveness...");
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 5: Preparing live preview
      setBuildStep("Preparing live preview...");
      await new Promise(resolve => setTimeout(resolve, 700));

      // Generate the actual HTML
      const howItWorksHTML = contentPackage.how_it_works
        .map(
          (step) => `
        <div class="step-card">
          <div class="step-number">${step.step_number}</div>
          <h3>${step.title}</h3>
          <p>${step.description}</p>
        </div>
      `
        )
        .join("");

      const benefitsHTML = contentPackage.key_benefits
        .map((b, idx) => {
          // Split benefit text into title and description
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
        })
        .join("");

      const faqHTML = contentPackage.faq_section
        .map(
          (faq) => `
        <details class="faq-item">
          <summary>${faq.question}</summary>
          <div class="faq-answer">
            <p>${faq.answer}</p>
          </div>
        </details>
      `
        )
        .join("");

      const ctaContent = includeCta && ctaGoal && ctaUrl 
        ? `
  <!-- Final CTA Section -->
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
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #111827;
      line-height: 1.6;
    }
    
    .page-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    
    section {
      width: 100%;
    }
    
    /* Hero Section */
    .hero {
      width: 100%;
      text-align: center;
      padding: 120px 32px 100px;
      position: relative;
      background: linear-gradient(180deg, #fafbff 0%, #ffffff 100%);
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(124, 92, 252, 0.12) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    
    .hero > * {
      position: relative;
      z-index: 1;
    }
    
    .hero h1 {
      font-size: clamp(42px, 6vw, 72px);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 24px;
      color: #111827;
      letter-spacing: -0.02em;
    }
    
    .hero .gradient-text {
      background: linear-gradient(135deg, #7C5CFC 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: inline-block;
    }
    
    .hero .subheadline {
      font-size: clamp(18px, 2.5vw, 22px);
      color: #64748b;
      max-width: 720px;
      margin: 0 auto 48px;
      line-height: 1.7;
      font-weight: 400;
    }
    
    .hero-cta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      margin-bottom: 48px;
    }
    
    .btn-primary {
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, #7C5CFC 0%, #a78bfa 100%);
      color: white;
      box-shadow: 0 4px 20px rgba(124, 92, 252, 0.3);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(124, 92, 252, 0.4);
    }
    
    .btn-secondary {
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      border: 2px solid #e5e5e5;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
      background: white;
      color: #1a1a1a;
    }
    
    .btn-secondary:hover {
      border-color: #7C5CFC;
      background: #faf9ff;
    }
    
    .trust-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 32px;
      justify-content: center;
      color: #666;
      font-size: 14px;
    }
    
    .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .trust-badge::before {
      content: '✓';
      color: #7C5CFC;
      font-weight: bold;
      font-size: 16px;
    }
    
    /* Tool Section */
    .tool-section {
      width: 100%;
      padding: 100px 0;
      background: #ffffff;
    }
    
    .tool-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 56px;
    }
    
    .tool-header h2 {
      font-size: clamp(36px, 5vw, 48px);
      font-weight: 700;
      margin-bottom: 20px;
      color: #111827;
      letter-spacing: -0.02em;
    }
    
    .tool-header p {
      font-size: 18px;
      color: #64748b;
      line-height: 1.8;
    }
    
    .tool-card {
      width: 100%;
      max-width: 1100px;
      min-width: 0;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 10% 0%, rgba(124, 92, 252, 0.12), transparent 34%),
        radial-gradient(circle at 92% 18%, rgba(37, 99, 235, 0.10), transparent 32%),
        rgba(255, 255, 255, 0.88);
      border-radius: 32px;
      padding: 16px;
      box-shadow: 0 30px 80px rgba(15, 23, 42, 0.10);
      border: 1px solid rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(18px);
    }
    
    .tool-wrapper {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(226, 232, 240, 0.95);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      padding: clamp(22px, 4vw, 36px);
    }

    .tool-wrapper > * {
      max-width: 100% !important;
    }

    .tool-wrapper h1,
    .tool-wrapper h2,
    .tool-wrapper h3 {
      color: #0f172a !important;
      letter-spacing: -0.03em !important;
    }

    .tool-wrapper h2 {
      font-size: clamp(26px, 4vw, 38px) !important;
      line-height: 1.05 !important;
      margin-bottom: 10px !important;
    }

    .tool-wrapper p {
      color: #64748b !important;
      line-height: 1.75 !important;
    }

    .tool-wrapper form,
    .tool-wrapper .form-grid,
    .tool-wrapper [class*="form"] {
      width: 100% !important;
    }

    .tool-wrapper form {
      margin-top: 24px !important;
      padding: clamp(18px, 3vw, 28px) !important;
      border-radius: 26px !important;
      border: 1px solid #e5e7eb !important;
      background:
        linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.92)) !important;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.07) !important;
    }

    .tool-wrapper .form-grid,
    .tool-wrapper form > div:first-child {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)) !important;
      gap: 16px !important;
    }

    .tool-wrapper label {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin-bottom: 8px !important;
      color: #475569 !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      letter-spacing: 0.08em !important;
      text-transform: uppercase !important;
    }

    .tool-wrapper input,
    .tool-wrapper select,
    .tool-wrapper textarea {
      width: 100% !important;
      min-height: 50px !important;
      padding: 14px 16px !important;
      border-radius: 18px !important;
      border: 1px solid #e2e8f0 !important;
      background: rgba(255, 255, 255, 0.94) !important;
      color: #0f172a !important;
      font: 600 14px/1.4 Inter, system-ui, sans-serif !important;
      outline: none !important;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease !important;
    }

    .tool-wrapper select {
      appearance: none !important;
      background-image:
        linear-gradient(45deg, transparent 50%, #6d5dfb 50%),
        linear-gradient(135deg, #6d5dfb 50%, transparent 50%) !important;
      background-position:
        calc(100% - 20px) 22px,
        calc(100% - 14px) 22px !important;
      background-size: 6px 6px, 6px 6px !important;
      background-repeat: no-repeat !important;
      padding-right: 44px !important;
    }

    .tool-wrapper input:hover,
    .tool-wrapper select:hover,
    .tool-wrapper textarea:hover {
      border-color: #c7d2fe !important;
      transform: translateY(-1px) !important;
    }

    .tool-wrapper input:focus,
    .tool-wrapper select:focus,
    .tool-wrapper textarea:focus {
      border-color: #7c5cfc !important;
      box-shadow: 0 0 0 4px rgba(124, 92, 252, 0.14), 0 16px 34px rgba(15, 23, 42, 0.08) !important;
      background: #ffffff !important;
    }

    .tool-wrapper button,
    .tool-wrapper input[type="submit"] {
      min-height: 52px !important;
      border: 0 !important;
      border-radius: 18px !important;
      background: linear-gradient(135deg, #6d5dfb, #111827) !important;
      color: #ffffff !important;
      font: 800 14px/1 Inter, system-ui, sans-serif !important;
      letter-spacing: -0.01em !important;
      box-shadow: 0 18px 34px rgba(109, 93, 251, 0.24) !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease !important;
    }

    .tool-wrapper button:hover,
    .tool-wrapper input[type="submit"]:hover {
      transform: translateY(-2px) !important;
      filter: brightness(1.04) !important;
      box-shadow: 0 24px 44px rgba(109, 93, 251, 0.32) !important;
    }

    .tool-wrapper #result,
    .tool-wrapper #results,
    .tool-wrapper .result,
    .tool-wrapper .results {
      margin-top: 24px !important;
      padding: clamp(18px, 3vw, 28px) !important;
      border-radius: 24px !important;
      border: 1px solid rgba(124, 92, 252, 0.20) !important;
      border-left: 1px solid rgba(124, 92, 252, 0.20) !important;
      background:
        radial-gradient(circle at 0% 0%, rgba(124, 92, 252, 0.12), transparent 34%),
        linear-gradient(180deg, #ffffff, #f8faff) !important;
      box-shadow: 0 22px 48px rgba(15, 23, 42, 0.08) !important;
      color: #0f172a !important;
    }

    .tool-wrapper #resultContent,
    .tool-wrapper #resultsContent {
      display: grid !important;
      gap: 14px !important;
    }

    .tool-wrapper footer,
    .tool-wrapper [class*="footer"] {
      display: none !important;
    }

    /* How It Works Section */
    .how-it-works-section {
      width: 100%;
      padding: 100px 0;
      background: linear-gradient(180deg, #fafbff 0%, #ffffff 100%);
    }
    
    .section-header {
      text-align: center;
      margin-bottom: 72px;
    }
    
    .section-header h2 {
      font-size: clamp(36px, 5vw, 48px);
      font-weight: 700;
      margin-bottom: 20px;
      color: #111827;
      letter-spacing: -0.02em;
    }
    
    .section-header p {
      font-size: 18px;
      color: #64748b;
      max-width: 680px;
      margin: 0 auto;
      line-height: 1.8;
    }
    
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
    }
    
    .step-card {
      width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 36px 32px;
      transition: all 0.3s ease;
      position: relative;
      text-align: left;
    }
    
    .step-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 50px rgba(124, 92, 252, 0.15);
      border-color: #7C5CFC;
    }
    
    .step-number {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #7C5CFC 0%, #a78bfa 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 24px;
      margin-bottom: 24px;
    }
    
    .step-card h3 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #111827;
    }
    
    .step-card p {
      color: #64748b;
      line-height: 1.8;
      font-size: 16px;
    }
    
    /* Benefits Section */
    .benefits-section {
      width: 100%;
      padding: 100px 0;
      background: #ffffff;
    }
    
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 28px;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
    }
    
    .benefit-card {
      width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 32px;
      display: flex;
      gap: 20px;
      transition: all 0.3s ease;
      align-items: flex-start;
    }
    
    .benefit-card:hover {
      border-color: #7C5CFC;
      box-shadow: 0 12px 40px rgba(124, 92, 252, 0.12);
      transform: translateY(-2px);
    }
    
    .benefit-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #7C5CFC 0%, #a78bfa 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 22px;
      flex-shrink: 0;
    }
    
    .benefit-content {
      flex: 1;
      min-width: 0;
    }
    
    .benefit-content h3 {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .benefit-content p {
      color: #64748b;
      font-size: 16px;
      line-height: 1.7;
    }
    
    /* FAQ Section */
    .faq-section {
      width: 100%;
      padding: 100px 0;
      background: linear-gradient(180deg, #fafbff 0%, #ffffff 100%);
    }
    
    .faq-item {
      width: 100%;
      max-width: 900px;
      min-width: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      margin-bottom: 16px;
      margin-left: auto;
      margin-right: auto;
      transition: all 0.3s ease;
    }
    
    .faq-item:hover {
      border-color: #7C5CFC;
      box-shadow: 0 4px 20px rgba(124, 92, 252, 0.08);
    }
    
    .faq-item summary {
      width: 100%;
      padding: 28px 32px;
      cursor: pointer;
      font-weight: 600;
      font-size: 18px;
      color: #111827;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      user-select: none;
    }
    
    .faq-item summary::-webkit-details-marker {
      display: none;
    }
    
    .faq-item summary::after {
      content: '+';
      font-size: 28px;
      font-weight: 300;
      color: #7C5CFC;
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }
    
    .faq-item[open] summary::after {
      transform: rotate(45deg);
    }
    
    .faq-answer {
      width: 100%;
      padding: 0 32px 32px;
      color: #64748b;
      line-height: 1.8;
      font-size: 16px;
      animation: slideDown 0.3s ease;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Final CTA Section */
    .final-cta {
      width: 100%;
      padding: 120px 32px;
      background: linear-gradient(135deg, #7C5CFC 0%, #a78bfa 100%);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .final-cta::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .cta-content {
      max-width: 720px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    
    .cta-content h2 {
      font-size: clamp(36px, 5vw, 52px);
      font-weight: 700;
      color: white;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }
    
    .cta-content p {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 40px;
      line-height: 1.7;
    }
    
    .cta-button {
      padding: 20px 48px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 14px;
      background: white;
      color: #7C5CFC;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
    }
    
    /* Responsive Design */
    @media (max-width: 1024px) {
      .steps-grid,
      .benefits-grid {
        grid-template-columns: 1fr !important;
      }
      
      .hero h1 {
        font-size: 40px !important;
      }
      
      .section-header h2,
      .tool-header h2,
      .cta-content h2 {
        font-size: 36px !important;
      }
      
      .hero,
      .how-it-works-section,
      .benefits-section,
      .faq-section {
        padding: 60px 24px !important;
      }
      
      .tool-section {
        padding: 60px 0 !important;
      }
    }
    
    @media (max-width: 768px) {
      .page-container {
        padding: 0 20px;
      }
      
      .hero h1 {
        font-size: 36px !important;
      }
      
      .hero .subheadline {
        font-size: 18px;
      }
      
      .hero {
        padding: 60px 20px 40px !important;
      }
      
      .tool-card {
        border-radius: 24px;
        padding: 10px;
      }

      .tool-wrapper {
        border-radius: 20px;
        padding: 18px;
      }
      
      .tool-section {
        padding: 60px 0 !important;
      }
      
      .tool-header h2,
      .section-header h2,
      .cta-content h2 {
        font-size: 32px !important;
      }
      
      .how-it-works-section,
      .benefits-section,
      .faq-section {
        padding: 60px 0 !important;
      }
      
      .final-cta {
        padding: 60px 20px !important;
      }
      
      .steps-grid,
      .benefits-grid {
        grid-template-columns: 1fr !important;
      }
      
      .step-card,
      .benefit-card,
      .faq-item {
        min-width: 0;
      }
      
      .hero-cta {
        flex-direction: column;
        align-items: stretch;
      }
      
      .btn-primary,
      .btn-secondary {
        width: 100%;
        text-align: center;
      }
    }
    
    /* Loading State for Build Process */
    .build-loading-card {
      width: 100%;
      padding: 80px 40px;
      border-radius: 24px;
      background: white;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
    }

    .spinner {
      width: 52px;
      height: 52px;
      border-radius: 999px;
      border: 4px solid #ececec;
      border-top-color: #7c3aed;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Hero Section -->
    <section class="hero">
      <h1>${contentPackage.page_h1.replace(/\b(\w+)\s*$/, '<span class="gradient-text">$1</span>')}</h1>
      <p class="subheadline">${contentPackage.introduction}</p>
      <div class="hero-cta">
        <a href="#tool" class="btn-primary">Start Using the Tool</a>
        <a href="#how-it-works" class="btn-secondary">Learn More</a>
      </div>
      <div class="trust-badges">
        <div class="trust-badge">Free Tool</div>
        <div class="trust-badge">No Signup Required</div>
        <div class="trust-badge">Instant Results</div>
      </div>
    </section>
  </div>

  <!-- Tool Section -->
  <section class="tool-section" id="tool">
    <div class="page-container">
      <div class="tool-header">
        <h2>Use the ${targetKeyword || 'Business Opportunity Asset'}</h2>
        <p>Enter your information below to get instant, personalized strategy recommendations.</p>
      </div>
      <div class="tool-card">
        <div class="tool-wrapper">
          ${sanitizeEmbedCode(embedCode) || '<p style="text-align: center; color: #999;">Tool embed code will appear here</p>'}
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="how-it-works-section" id="how-it-works">
    <div class="page-container">
      <div class="section-header">
        <h2>How It Works</h2>
        <p>Get started in three simple steps</p>
      </div>
      <div class="steps-grid">
        ${howItWorksHTML}
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="benefits-section">
    <div class="page-container">
      <div class="section-header">
        <h2>Key Benefits</h2>
        <p>Discover what makes this tool valuable</p>
      </div>
      <div class="benefits-grid">
        ${benefitsHTML}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq-section">
    <div class="page-container">
      <div class="section-header">
        <h2>Frequently Asked Questions</h2>
        <p>Everything you need to know</p>
      </div>
      ${faqHTML}
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
        message: "Premium landing page ready to download",
      });
    } catch (error) {
      console.error("HTML generation error:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to generate HTML",
      });
    } finally {
      setIsBuildingPage(false);
      setIsGeneratingHtml(false);
      setBuildStep("");
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;

    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetKeyword.replace(/\s+/g, "-")}-full-page.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: "success",
      title: "Downloaded!",
      message: "HTML file saved successfully",
    });
  };

  const handleCopyHtml = () => {
    if (!generatedHtml) return;

    navigator.clipboard.writeText(generatedHtml);
    showToast({
      type: "success",
      title: "Copied!",
      message: "HTML copied to clipboard",
    });
  };

  const handleRegenerateHtml = () => {
    setFullPageGenerated(false);
    setGeneratedHtml("");
    
    showToast({
      type: "info",
      title: "Reset",
      message: "Click Generate Full HTML Page to create a new version",
    });
  };

  const handleCtaCheckboxChange = (checked: boolean) => {
    setIncludeCta(checked);
    
    // Clear CTA fields when unchecked
    if (!checked) {
      setCtaGoal("");
      setCtaUrl("");
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignName || !contentPackage) return;

    try {
      const res = await fetch("/api/content-campaigns", {
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

      if (res.ok) {
        setShowSaveModal(false);
        setCampaignName("");
        showToast({
          type: "success",
          title: "Saved!",
          message: "Campaign saved successfully",
        });
        loadCampaignsAndProjects();
      } else {
        showToast({
          type: "error",
          title: "Save failed",
          message: "Could not save campaign",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to save campaign",
      });
    }
  };

  const handleExportHTML = () => {
    if (!contentPackage) return;

    const howItWorksHTML = contentPackage.how_it_works
      .map(
        (step) => `
      <div class="step">
        <h3>${step.step_number}. ${step.title}</h3>
        <p>${step.description}</p>
      </div>
    `
      )
      .join("");

    const benefitsHTML = contentPackage.key_benefits
      .map((b) => `<li>${b}</li>`)
      .join("");

    const faqHTML = contentPackage.faq_section
      .map(
        (faq) => `
      <div class="faq-item">
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
      </div>
    `
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contentPackage.meta_title}</title>
  <meta name="description" content="${contentPackage.meta_description}">
</head>
<body>
  <h1>${contentPackage.page_h1}</h1>
  <div class="introduction">${contentPackage.introduction}</div>
  ${embedCode ? `<div class="tool-embed">${sanitizeEmbedCode(embedCode)}</div>` : ""}
  <div class="how-it-works">${howItWorksHTML}</div>
  <div class="benefits"><ul>${benefitsHTML}</ul></div>
  <div class="faq">${faqHTML}</div>
  ${contentPackage.cta_block || ""}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetKeyword.replace(/\s+/g, "-")}-content.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      type: "success",
      title: "Downloaded!",
      message: "HTML file ready",
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
        showToast({
          type: "success",
          title: "Deleted",
          message: "Campaign removed",
        });
        loadCampaignsAndProjects();
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Could not delete campaign",
      });
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
    
    // Restore full page HTML if it exists
    if (campaign.full_page_html) {
      setGeneratedHtml(campaign.full_page_html);
      setFullPageGenerated(true);
    } else {
      setFullPageGenerated(false);
      setGeneratedHtml("");
    }

    if (
      campaign.page_h1 &&
      campaign.introduction &&
      campaign.how_it_works &&
      campaign.key_benefits &&
      campaign.semantic_keywords &&
      campaign.faq_section
    ) {
      try {
        setContentPackage({
          page_h1: campaign.page_h1,
          introduction: campaign.introduction,
          how_it_works: JSON.parse(campaign.how_it_works),
          key_benefits: JSON.parse(campaign.key_benefits),
          semantic_keywords: JSON.parse(campaign.semantic_keywords),
          faq_section: JSON.parse(campaign.faq_section),
          meta_title: campaign.meta_title || "",
          meta_description: campaign.meta_description || "",
          cta_block: campaign.cta_block,
        });
      } catch (error) {
        console.error("Failed to parse campaign data:", error);
      }
    }
  };

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const campaignsByProject = campaigns.reduce((acc, campaign) => {
    const projectId = campaign.project_id || 0;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(campaign);
    return acc;
  }, {} as Record<number, Campaign[]>);

  return (
    <DashboardLayout>
      <div className="page-shell max-w-6xl">
        {/* Header */}
        <div className="surface-panel mb-6 p-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="icon-tile">
              <FileText className="w-5 h-5" />
            </div>
            <div className="section-eyebrow">Publishing Studio</div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Content Wrapper</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Generate an authority SEO content package, full-page HTML, and a live preview around any embedded AI business asset.
          </p>
        </div>

        {/* Tabs */}
        <div className="tab-pill mb-6 flex max-w-xl gap-1">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "generate"
                ? "bg-white text-[var(--brand)] shadow-sm"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "saved"
                ? "bg-white text-[var(--brand)] shadow-sm"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Folder className="w-4 h-4" />
            Saved Campaigns ({campaigns.length})
          </button>
        </div>

        {/* Generate Tab */}
        {activeTab === "generate" && (
          <div className="space-y-5">
            {/* Input Form */}
            <div className="premium-card space-y-5 p-6">
              {/* Blueprint */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Blueprint
                </label>
                <textarea
                  value={blueprint}
                  onChange={(e) => handleBlueprintChange(e.target.value)}
                  placeholder="Paste your generated blueprint here — or paste a 'Copy All for Content Wrapper' bundle to auto-fill everything..."
                  className="input-premium w-full px-4 py-3 text-sm resize-none transition-shadow"
                  rows={6}
                />
              </div>

              {/* Two Column Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Target Keyword
                  </label>
                  <input
                    type="text"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    placeholder="e.g., affiliate revenue engine"
                    className="input-premium w-full px-4 py-3 text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Niche / Topic
                  </label>
                  <input
                    type="text"
                    value={nicheTopic}
                    onChange={(e) => setNicheTopic(e.target.value)}
                    placeholder="e.g., personal finance"
                    className="input-premium w-full px-4 py-3 text-sm transition-shadow"
                  />
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Business Asset Embed Code{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional — auto-filled from Copy All)
                  </span>
                </label>
                <textarea
                  value={embedCode}
                  onChange={(e) => setEmbedCode(e.target.value)}
                  placeholder="Paste your widget embed code here (auto-filled when using Copy All for Content Wrapper)..."
                  className="input-premium w-full px-4 py-3 text-sm font-mono resize-none transition-shadow"
                  rows={4}
                />
              </div>

              {/* CTA Checkbox */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCta}
                    onChange={(e) => handleCtaCheckboxChange(e.target.checked)}
                    className="premium-check"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Include a Call to Action
                  </span>
                </label>
                
                {/* CTA Input Fields - only show when checkbox is enabled */}
                {includeCta && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <input
                      type="text"
                      value={ctaGoal}
                      onChange={(e) => setCtaGoal(e.target.value)}
                      placeholder="CTA goal (e.g., Sign up for free)"
                      className="input-premium w-full px-4 py-3 text-sm transition-shadow"
                    />
                    <input
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="URL"
                      className="input-premium w-full px-4 py-3 text-sm transition-shadow"
                    />
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !blueprint || !targetKeyword || !nicheTopic}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Content Package...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Content Package
                  </>
                )}
              </button>
            </div>

            {/* Output Display */}
            {contentPackage && (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const content = `SEO TITLE: ${contentPackage.meta_title}\n\nMETA DESCRIPTION: ${contentPackage.meta_description}\n\nH1: ${contentPackage.page_h1}\n\nINTRODUCTION:\n${contentPackage.introduction}`;
                      navigator.clipboard.writeText(content);
                      showToast({ type: "success", title: "Copied!", message: "Content copied to clipboard" });
                    }}
                    className="btn-secondary flex-1 rounded-2xl py-2.5 font-medium flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy All
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="btn-secondary flex-1 rounded-2xl py-2.5 font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Campaign
                  </button>
                  <button
                    onClick={handleExportHTML}
                    className="btn-primary flex-1 rounded-2xl py-2.5 font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export HTML
                  </button>
                </div>

                {/* Content Preview Card */}
                <div className="premium-card p-6 space-y-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">META TITLE</div>
                    <div className="text-sm text-foreground">{contentPackage.meta_title}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">META DESCRIPTION</div>
                    <div className="text-sm text-foreground">{contentPackage.meta_description}</div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-xs font-medium text-muted-foreground mb-2">PAGE HEADLINE</div>
                    <div className="text-xl font-bold text-foreground">{contentPackage.page_h1}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">INTRODUCTION</div>
                    <div className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: contentPackage.introduction }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      HOW IT WORKS ({contentPackage.how_it_works.length} steps)
                    </div>
                    <div className="space-y-2">
                      {contentPackage.how_it_works.map((step) => (
                        <div key={step.step_number} className="text-sm">
                          <span className="font-semibold text-foreground">{step.step_number}. {step.title}</span>
                          <p className="text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      KEY BENEFITS ({contentPackage.key_benefits.length})
                    </div>
                    <ul className="space-y-1">
                      {contentPackage.key_benefits.map((benefit, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Build Full Page Section */}
                <div className="premium-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Build a Full Page</h3>
                  
                  {!fullPageGenerated ? (
                    // STATE 1: Initial state - just the generate button
                    <div className="space-y-3">
                      {embedCode && (
                        <p className="text-sm text-muted-foreground">
                          Business asset embed code detected - will be included in the full page
                        </p>
                      )}
                      <button
                        onClick={handleGenerateFullHtmlPage}
                        disabled={isGeneratingHtml}
                        className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGeneratingHtml ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Full HTML Page...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate Full HTML Page
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    // STATE 2: After generation - show download/copy/preview
                    <div className="space-y-4">
                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleDownloadHtml}
                          className="btn-primary flex-1 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download as HTML File
                        </button>
                        <button
                          onClick={handleCopyHtml}
                          className="btn-secondary flex-1 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
                        >
                          <Copy className="w-5 h-5" />
                          Copy HTML
                        </button>
                        <button
                          onClick={handleRegenerateHtml}
                          className="btn-secondary rounded-2xl px-6 py-3 font-semibold flex items-center justify-center gap-2"
                        >
                          Re-generate
                        </button>
                      </div>

                      {/* WordPress helper notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                          <strong>WordPress:</strong> Copy the HTML and paste it into a new page using the Custom HTML block, or upload the file to your theme's template directory.
                        </p>
                      </div>

                      {/* Live Preview section */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Live Preview</h4>
                        
                        {/* Show loading state while building */}
                        {isBuildingPage ? (
                          <div className="build-loading-card">
                            <div className="spinner" />
                            <h3 className="text-xl font-bold text-foreground">Building Your HTML Page</h3>
                            <p className="text-sm text-muted-foreground">{buildStep}</p>
                          </div>
                        ) : fullPageGenerated && generatedHtml ? (
                          <div className="browser-frame w-full">
                            {/* Browser Chrome Header */}
                            <div className="h-14 bg-slate-50 border-b border-border flex items-center px-5 gap-4">
                              <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              </div>
                              <div className="text-sm text-muted-foreground font-medium">
                                Preview Mode
                              </div>
                            </div>
                            
                            {/* Preview Container */}
                            <div className="w-full h-[700px] bg-white overflow-hidden">
                              <iframe
                                srcDoc={generatedHtml}
                                title="Live Preview"
                                sandbox="allow-scripts allow-same-origin"
                                className="w-full h-full border-none block bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full rounded-3xl bg-muted/20 border border-border p-12 text-center">
                            <FileCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                            <p className="text-sm text-muted-foreground">
                              Click "Generate Full HTML Page" to build and preview your content
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Publish to WordPress section */}
                      <div className="premium-card rounded-2xl p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Publish to WordPress</h4>
                        <p className="text-sm text-muted-foreground">
                          Use the WordPress REST API or plugins like WP All Import to publish this page directly to your site. Download the HTML file or copy the code above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Campaigns Tab */}
        {activeTab === "saved" && (
          <div>
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
              </div>
            ) : Object.keys(campaignsByProject).length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No saved campaigns yet</h3>
                <p className="text-sm text-muted-foreground">
                  Generate a content package and save it to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(campaignsByProject).map(([projectIdStr, projectCampaigns]) => {
                  const projectId = Number(projectIdStr);
                  const project = projects.find((p) => p.id === projectId);
                  const projectName = project?.name || "Unassigned";
                  const isExpanded = expandedProjects.has(projectId);

                  return (
                    <div key={projectId} className="premium-card overflow-hidden rounded-2xl">
                      {/* Project Header */}
                      <button
                        onClick={() => toggleProject(projectId)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold text-foreground">{projectName}</span>
                        </div>
                        <div className="px-2.5 py-0.5 bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-medium rounded-full">
                          {projectCampaigns.length} campaign{projectCampaigns.length !== 1 ? "s" : ""}
                        </div>
                      </button>

                      {/* Campaigns List */}
                      {isExpanded && (
                        <div className="bg-muted/10">
                          {projectCampaigns.map((campaign) => (
                            <div
                              key={campaign.id}
                              className="px-4 py-3.5 flex items-center justify-between border-t border-border/50 group relative"
                            >
                              <button
                                onClick={() => handleLoadCampaign(campaign)}
                                className="flex-1 text-left hover:bg-[var(--brand-soft)] -mx-4 -my-3.5 px-4 py-3.5 rounded-xl transition-all"
                              >
                                <div className="font-semibold text-sm text-foreground mb-1 group-hover:text-[var(--brand)] transition-colors">
                                  {campaign.name}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {campaign.tool_name && (
                                    <span className="font-medium">{campaign.tool_name}</span>
                                  )}
                                  <span>
                                    {new Date(campaign.created_at).toLocaleDateString("en-US", {
                                      month: "numeric",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                  {campaign.page_h1 && (
                                    <div className="flex items-center gap-1.5 text-green-600">
                                      <Check className="w-3.5 h-3.5" />
                                      <span className="font-medium">Has content</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCampaign(campaign.id);
                                }}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors ml-2 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Save Modal */}
        {showSaveModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setShowSaveModal(false)}
          >
            <div
              className="premium-card p-6 max-w-md w-full rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Save Campaign</h3>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name..."
                className="input-premium mb-5 w-full px-4 py-3 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && campaignName) {
                    handleSaveCampaign();
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="btn-secondary flex-1 rounded-2xl px-6 py-2.5 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCampaign}
                  disabled={!campaignName}
                  className="btn-primary flex-1 rounded-2xl px-6 py-2.5 font-medium disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
