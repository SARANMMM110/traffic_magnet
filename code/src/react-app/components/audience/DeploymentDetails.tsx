import { useState } from "react";
import { Copy, Check, ExternalLink, Code, FileCode, Globe } from "lucide-react";

interface DeploymentDetailsProps {
  publicUrl: string;
  embedCode: string;
  widgetCode: string;
  flowPublicId: string;
  assetSlug: string;
}

export function DeploymentDetails({
  publicUrl,
  embedCode,
  widgetCode,
  flowPublicId,
  assetSlug,
}: DeploymentDetailsProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Public URL */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <h4 className="font-medium text-sm">Public URL</h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(publicUrl, "_blank")}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </button>
            <button
              onClick={() => copyToClipboard(publicUrl, "url")}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
            >
              {copiedItem === "url" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <div className="bg-slate-50 rounded px-3 py-2 font-mono text-sm text-slate-700 break-all">
          {publicUrl}
        </div>
      </div>

      {/* Embed Code */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-slate-500" />
            <h4 className="font-medium text-sm">Embed Code</h4>
          </div>
          <button
            onClick={() => copyToClipboard(embedCode, "embed")}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
          >
            {copiedItem === "embed" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-slate-50 rounded px-3 py-2 font-mono text-xs text-slate-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{embedCode}</pre>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Paste this code into any website to embed the asset with an iframe.
        </p>
      </div>

      {/* Widget Code */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500" />
            <h4 className="font-medium text-sm">Audience Widget</h4>
          </div>
          <button
            onClick={() => copyToClipboard(widgetCode, "widget")}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
          >
            {copiedItem === "widget" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-slate-50 rounded px-3 py-2 font-mono text-xs text-slate-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{widgetCode}</pre>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Add this script tag to enable audience capture gates with triggers and unlocks.
        </p>
      </div>

      {/* WordPress Shortcode */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500" />
            <h4 className="font-medium text-sm">WordPress Shortcode</h4>
          </div>
          <button
            onClick={() =>
              copyToClipboard(
                `[audience_asset slug="${assetSlug}" flow="${flowPublicId}"]`,
                "shortcode"
              )
            }
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
          >
            {copiedItem === "shortcode" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-slate-50 rounded px-3 py-2 font-mono text-xs text-slate-700">
          [audience_asset slug="{assetSlug}" flow="{flowPublicId}"]
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Use this shortcode in WordPress posts or pages to embed the asset.
        </p>
      </div>
    </div>
  );
}
