import { useEffect, useState } from "react";

/**
 * Serves HTML in an iframe via a blob URL so preview matches a file download
 * (same document, same parsing — no srcDoc normalization quirks).
 */
export function useBlobHtmlPreview(html: string | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!html) {
      setUrl(undefined);
      return;
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [html]);

  return url;
}
