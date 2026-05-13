import { buildStandaloneHtml } from "./buildStandalonePage";
import { deriveToolRenderSpec } from "./deriveSpec";
import { validateToolRenderSpec } from "./validateSpec";

/** Marketing landing — same renderer as standalone with `id="interactive-tool"`. */
export function buildLandingPageHtml(blueprint: Record<string, unknown>): string {
  const spec = deriveToolRenderSpec(blueprint);
  const v = validateToolRenderSpec(spec);
  if (!v.ok) {
    throw new Error(`[Platform] Invalid ToolRenderSpec: ${v.errors.join("; ")}`);
  }
  return buildStandaloneHtml(spec, "landing");
}
