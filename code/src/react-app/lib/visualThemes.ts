/** Matches worker `resolveVisualThemeKey` / landing HTML generation. */
export const VISUAL_THEMES = [
  {
    id: "modern",
    name: "Modern",
    desc: "Clean, minimalist with bold accents",
    swatch: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
  },
  {
    id: "ocean",
    name: "Ocean",
    desc: "Cool blues with professional feel",
    swatch: "linear-gradient(90deg, #7DD3FC 0%, #0284C7 100%)",
  },
  {
    id: "forest",
    name: "Forest",
    desc: "Natural greens, earthy and trusted",
    swatch: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    desc: "Warm, energetic with vibrant gradient",
    swatch: "linear-gradient(90deg, #F97316 0%, #DC2626 100%)",
  },
  {
    id: "purple",
    name: "Purple",
    desc: "Premium, creative, sophisticated",
    swatch: "linear-gradient(90deg, #7C3AED 0%, #DB2777 100%)",
  },
  {
    id: "slate",
    name: "Slate",
    desc: "Professional grayscale with neutral accent",
    swatch: "linear-gradient(135deg, #94A3B8 0%, #334155 100%)",
  },
] as const;

export function normalizeVisualThemeId(raw: unknown): string {
  const v = String(raw ?? "modern").trim().toLowerCase();
  return VISUAL_THEMES.some((t) => t.id === v) ? v : "modern";
}
