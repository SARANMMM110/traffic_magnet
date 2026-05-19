import { useState } from "react";
import { Rocket, Loader2, Check, AlertCircle } from "lucide-react";
import { DeploymentDetails } from "./DeploymentDetails";

interface PublishAssetButtonProps {
  assetType: "tool" | "landing_page" | "content_wrapper" | "assistant";
  assetId: number;
  assetTitle: string;
  htmlContent?: string;
  flowId?: number;
  onPublished?: (data: PublishedAssetData) => void;
}

export interface PublishedAssetData {
  assetId: number;
  slug: string;
  publicUrl: string;
  embedCode: string;
  widgetCode: string;
  flowPublicId: string;
}

export function PublishAssetButton({
  assetType,
  assetId,
  assetTitle,
  htmlContent,
  flowId,
  onPublished,
}: PublishAssetButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedData, setPublishedData] = useState<PublishedAssetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      // Generate slug from title
      const slug = assetTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Create published asset
      const publishResponse = await fetch("/api/published", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          asset_type: assetType,
          title: assetTitle,
          html_content: htmlContent || "",
          source_tool_id: assetType === "tool" ? assetId : undefined,
          source_campaign_id: assetType === "content_wrapper" ? assetId : undefined,
          assistant_id: assetType === "assistant" ? assetId : undefined,
          audience_flow_id: flowId || null,
        }),
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        throw new Error(errorData.error || "Failed to publish asset");
      }

      const { asset } = await publishResponse.json();
      const publicUrl = `${window.location.origin}/p/${slug}`;

      // Get flow public ID if flow is deployed
      let flowPublicId = "";
      if (flowId) {
        const flowResponse = await fetch(`/api/audience/flows/${flowId}`);
        if (flowResponse.ok) {
          const flowData = await flowResponse.json();
          flowPublicId = flowData.flow.publicId;
        }
      }

      const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;
      const widgetCode = flowPublicId
        ? `<script src="${window.location.origin}/api/audience/widget.js" data-flow="${flowPublicId}" data-asset="${slug}" async></script>`
        : "";

      const data: PublishedAssetData = {
        assetId: asset.id,
        slug,
        publicUrl,
        embedCode,
        widgetCode,
        flowPublicId,
      };

      setPublishedData(data);
      onPublished?.(data);
    } catch (err) {
      console.error("Publish error:", err);
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  if (publishedData) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <Check className="w-5 h-5" />
            <h3 className="font-semibold">Successfully Published!</h3>
          </div>
          <p className="text-sm text-green-700">
            Your {assetType.replace("_", " ")} is now live and accessible.
          </p>
        </div>

        <DeploymentDetails
          publicUrl={publishedData.publicUrl}
          embedCode={publishedData.embedCode}
          widgetCode={publishedData.widgetCode}
          flowPublicId={publishedData.flowPublicId}
          assetSlug={publishedData.slug}
        />

        <button
          onClick={() => setPublishedData(null)}
          className="text-sm text-slate-600 hover:text-slate-800 underline"
        >
          Publish again with new settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {isPublishing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Publish to Web
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Make this {assetType.replace("_", " ")} publicly accessible with a unique URL
      </p>
    </div>
  );
}
