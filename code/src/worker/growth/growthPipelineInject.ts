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

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function buildAudienceSnippet(origin: string, flowPublicId: string, assetKey: string): string {
  const o = origin.replace(/\/$/, "");
  return `\n<!-- Audience Growth Engine — flow ${escapeAttr(flowPublicId)} -->\n<script src="${escapeAttr(o)}/api/audience/widget.js" async data-flow="${escapeAttr(flowPublicId)}" data-asset="${escapeAttr(assetKey)}"></script>\n`;
}

export function buildAssistantSnippet(
  origin: string,
  publicId: string,
  assetKey: string,
  theme: string,
  position: string,
): string {
  const o = origin.replace(/\/$/, "");
  return `\n<!-- Magnet AI Assistant -->\n<script src="${escapeAttr(o)}/api/assistant/widget.js" async data-assistant="${escapeAttr(publicId)}" data-asset="${escapeAttr(assetKey)}" data-theme="${escapeAttr(theme)}" data-position="${escapeAttr(position)}"></script>\n`;
}

export function buildAnalyticsSnippet(origin: string, deploymentPublicId: string, assetKey: string): string {
  const o = origin.replace(/\/$/, "");
  return `\n<!-- Magnet Growth Analytics -->\n<script>(function(){var API="${escapeAttr(o)}";var pid="${escapeAttr(deploymentPublicId)}";var ak="${escapeAttr(assetKey)}";function ev(t,m){fetch(API+"/api/growth-pipeline/public/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deploymentPublicId:pid,eventType:t,assetKey:ak,meta:m||{}})}).catch(function(){});}ev("page_view",{url:location.href,ref:document.referrer||"direct"});})();</script>\n`;
}

export function injectGrowthStackIntoHtml(html: string, config: GrowthInjectConfig): string {
  if (!html?.trim()) return html;
  const parts: string[] = [];
  if (config.audienceFlowPublicId) {
    parts.push(buildAudienceSnippet(config.origin, config.audienceFlowPublicId, config.assetKey));
  }
  if (config.assistantPublicId) {
    parts.push(
      buildAssistantSnippet(
        config.origin,
        config.assistantPublicId,
        config.assetKey,
        config.assistantTheme || "violet",
        config.assistantPosition || "bottom-right",
      ),
    );
  }
  if (config.analyticsEnabled !== false && config.deploymentPublicId) {
    parts.push(buildAnalyticsSnippet(config.origin, config.deploymentPublicId, config.assetKey));
  }
  if (parts.length === 0) return html;
  const bundle = `\n<!-- Magnet Growth Deployment Pipeline -->\n${parts.join("")}`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${bundle}</body>`);
  return `${html}${bundle}`;
}
