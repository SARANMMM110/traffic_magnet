export interface UnifiedAsset {
  id: string;
  name: string;
  assetType: "interactive-tool" | "landing-page" | "content-wrapper" | "seo-asset" | "wordpress-page" | "ai-assistant";
  projectId: number | null;
  status: "draft" | "published" | "active" | "archived";
  category?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  deploymentType?: string;
  publishedUrl?: string;
  toolId?: number;
  campaignId?: number;
  assistantId?: number;
  wpSiteId?: number;
  hasBlueprint?: boolean;
  hasHTML?: boolean;
  hasLandingPage?: boolean;
}

export interface AssetRegistryResponse {
  assets: UnifiedAsset[];
  total: number;
  byType: {
    "interactive-tool": number;
    "content-wrapper": number;
    "ai-assistant": number;
    "wordpress-page": number;
  };
}

export async function fetchAllAssets(): Promise<AssetRegistryResponse> {
  const response = await fetch("/api/assets", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch assets");
  }
  return response.json();
}

export async function fetchAssetById(assetId: string): Promise<{ asset: UnifiedAsset }> {
  const response = await fetch(`/api/assets/${assetId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch asset");
  }
  return response.json();
}

export async function injectAudienceWidget(
  assetId: string,
  flowPublicId: string,
  triggerConfig: Record<string, any>
): Promise<{ success: boolean; injected: boolean }> {
  const response = await fetch("/api/assets/inject-html", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assetId, flowPublicId, triggerConfig }),
  });

  if (!response.ok) {
    throw new Error("Failed to inject widget");
  }

  return response.json();
}

export interface AssetAnalytics {
  assetId: string;
  visitors: number;
  unlocks: number;
  unlockRate: number;
  subscribers: number;
  eventsByType: Record<string, number>;
  deployments: Array<{
    id: number;
    flow_id: number;
    flow_name: string;
    public_id: string;
    status: string;
    deployed_at: string;
  }>;
}

export async function fetchAssetAnalytics(assetId: string): Promise<AssetAnalytics> {
  const response = await fetch(`/api/assets/${assetId}/analytics`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch asset analytics");
  }
  return response.json();
}
