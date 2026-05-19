export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function buildAssistantWidgetSnippet(
  origin: string,
  publicId: string,
  assetKey: string,
  theme = "violet",
  position = "bottom-right",
): string {
  const o = origin.replace(/\/$/, "");
  return `\n<!-- Magnet AI Assistant — ${escapeAttr(publicId)} -->\n<script src="${escapeAttr(o)}/api/assistant/widget.js" async data-assistant="${escapeAttr(publicId)}" data-asset="${escapeAttr(assetKey)}" data-theme="${escapeAttr(theme)}" data-position="${escapeAttr(position)}"></script>\n`;
}

export function injectAssistantWidgetIntoHtml(
  html: string,
  origin: string,
  publicId: string,
  assetKey: string,
  theme?: string,
  position?: string,
): string {
  const snippet = buildAssistantWidgetSnippet(origin, publicId, assetKey, theme, position);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${snippet}</body>`);
  return `${html}${snippet}`;
}
