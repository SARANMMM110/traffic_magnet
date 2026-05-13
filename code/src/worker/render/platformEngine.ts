import { buildContentWrapperJson } from "./buildContentWrapper";
import { buildEmbedHtml } from "./buildEmbedWidget";
import { buildLandingPageHtml } from "./buildLandingPage";
import { buildStandaloneHtml } from "./buildStandalonePage";
import { deriveToolRenderSpec } from "./deriveSpec";
import type { ContentWrapperPackage } from "./types";
import { validateToolRenderSpec } from "./validateSpec";

export function shouldUsePlatformRender(
  blueprint: Record<string, unknown>,
  opts: { requestFlag?: boolean; envFlag?: boolean }
): boolean {
  if (opts.envFlag) return true;
  if (opts.requestFlag) return true;
  if (blueprint.platform_html === true) return true;
  if (blueprint.render_engine === "platform_v1") return true;
  return false;
}

function validatedSpec(blueprint: Record<string, unknown>) {
  const spec = deriveToolRenderSpec(blueprint);
  const v = validateToolRenderSpec(spec);
  if (!v.ok) {
    throw new Error(`[Platform] Invalid ToolRenderSpec: ${v.errors.join("; ")}`);
  }
  return spec;
}

/** Deterministic HTML from blueprint JSON — no LLM layout or logic. */
export function renderPlatformBusinessAsset(
  blueprint: Record<string, unknown>,
  action: "standalone" | "embed"
): string {
  const spec = validatedSpec(blueprint);
  return action === "embed" ? buildEmbedHtml(spec) : buildStandaloneHtml(spec, "standalone");
}

export function renderPlatformLandingPage(blueprint: Record<string, unknown>): string {
  return buildLandingPageHtml(blueprint);
}

export function buildPlatformContentWrapperPackage(
  keyword: string,
  niche: string,
  blueprint: Record<string, unknown>,
  includeCta: boolean,
  ctaType: string | null,
  ctaText: string | null,
  ctaUrl: string | null
): ContentWrapperPackage {
  validatedSpec(blueprint);
  return buildContentWrapperJson(keyword, niche, blueprint, includeCta, ctaType, ctaText, ctaUrl);
}
