import { buildAudienceWidgetSnippet } from "@/react-app/lib/audienceWidget";
import { buildAssistantWidgetSnippet } from "@/react-app/lib/assistantWidget";

export type GrowthInjectConfig = {
  origin: string;
  assetKey: string;
  audienceFlowPublicId?: string | null;
  assistantPublicId?: string | null;
  assistantTheme?: string;
  assistantPosition?: string;
  analyticsEnabled?: boolean;
  deploymentPublicId?: string | null;
};

export function buildGrowthAnalyticsSnippet(origin: string, deploymentPublicId: string, assetKey: string): string {
  const o = origin.replace(/\/$/, "");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `\n<!-- Magnet Growth Analytics -->\n<script>(function(){var API="${esc(o)}";var pid="${esc(deploymentPublicId)}";var ak="${esc(assetKey)}";function ev(t,m){fetch(API+"/api/growth-pipeline/public/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deploymentPublicId:pid,eventType:t,assetKey:ak,meta:m||{}})}).catch(function(){});}ev("page_view",{url:location.href,ref:document.referrer||"direct"});document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")ev("session_end",{});});})();</script>\n`;
}

/** Unified auto-injection: audience + assistant + analytics runtime */
export function injectGrowthStackIntoHtml(html: string, config: GrowthInjectConfig): string {
  if (!html?.trim()) return html;
  const parts: string[] = [];
  if (config.audienceFlowPublicId) {
    parts.push(buildAudienceWidgetSnippet(config.origin, config.audienceFlowPublicId, config.assetKey));
  }
  if (config.assistantPublicId) {
    parts.push(
      buildAssistantWidgetSnippet(
        config.origin,
        config.assistantPublicId,
        config.assetKey,
        config.assistantTheme || "violet",
        config.assistantPosition || "bottom-right",
      ),
    );
  }
  if (config.analyticsEnabled !== false && config.deploymentPublicId) {
    parts.push(buildGrowthAnalyticsSnippet(config.origin, config.deploymentPublicId, config.assetKey));
  }
  if (parts.length === 0) return html;
  const bundle = `\n<!-- Magnet Growth Deployment Pipeline -->\n${parts.join("")}`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${bundle}</body>`);
  return `${html}${bundle}`;
}

export const PIPELINE_STEPS = [
  { id: "asset", label: "Traffic Asset", icon: "layers" },
  { id: "audience", label: "Audience Capture", icon: "radar" },
  { id: "assistant", label: "AI Assistant", icon: "sparkles" },
  { id: "publish", label: "Publishing", icon: "globe" },
  { id: "analytics", label: "Analytics", icon: "chart" },
] as const;

export const DEPLOYMENT_STATES = [
  "idle",
  "deploying",
  "published",
  "syncing",
  "tracking",
  "optimizing",
  "error",
  "retrying",
] as const;

export type DeploymentState = (typeof DEPLOYMENT_STATES)[number];
