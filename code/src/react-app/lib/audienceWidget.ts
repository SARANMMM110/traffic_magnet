  /**
   * Client-side HTML injection for the Audience widget — mirrors
   * POST /api/audience/inject-html so previews and downloads match production.
   */
  export function escapeAttr(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  export function buildAudienceWidgetSnippet(origin: string, flowPublicId: string, assetKey: string): string {
    const o = origin.replace(/\/$/, "");
    return `\n<!-- Audience Growth Engine — flow ${escapeAttr(flowPublicId)} -->\n<script src="${escapeAttr(o)}/api/audience/widget.js" async data-flow="${escapeAttr(flowPublicId)}" data-asset="${escapeAttr(assetKey)}"></script>\n`;
  }

  export function injectAudienceWidgetIntoHtml(html: string, origin: string, flowPublicId: string, assetKey: string): string {
    const snippet = buildAudienceWidgetSnippet(origin, flowPublicId, assetKey);
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${snippet}</body>`);
    return `${html}${snippet}`;
  }
