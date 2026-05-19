/**
 * Published Assets API Client
 */

export interface PublishedAsset {
  id: number;
  user_id: string;
  project_id: number | null;
  slug: string;
  asset_type: string;
  title: string;
  description: string | null;
  html_content: string | null;
  css_content: string | null;
  js_content: string | null;
  deployment_status: string;
  public_url: string | null;
  audience_flow_id: number | null;
  assistant_id: number | null;
  wordpress_site_id: number | null;
  source_tool_id: number | null;
  source_campaign_id: number | null;
  meta_json: string;
  analytics_enabled: number;
  view_count: number;
  unlock_count: number;
  subscriber_count: number;
  last_viewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetRequest {
  project_id?: number;
  slug: string;
  asset_type: string;
  title: string;
  description?: string;
  html_content?: string;
  css_content?: string;
  js_content?: string;
  audience_flow_id?: number;
  assistant_id?: number;
  source_tool_id?: number;
  source_campaign_id?: number;
}

export interface AssetAnalytics {
  views: number;
  unlocks: number;
  subscribers: number;
  uniqueVisitors: number;
  unlockRate: number;
  eventBreakdown: Array<{ event_type: string; count: number }>;
  recentEvents: Array<{ event_type: string; visitor_session_hash: string; created_at: string }>;
}

/**
 * Fetch all published assets for current user
 */
export async function fetchPublishedAssets(): Promise<PublishedAsset[]> {
  const response = await fetch("/api/published");
  if (!response.ok) throw new Error("Failed to fetch published assets");
  
  const data = await response.json();
  return data.assets;
}

/**
 * Fetch single published asset
 */
export async function fetchPublishedAsset(id: number): Promise<PublishedAsset> {
  const response = await fetch(`/api/published/${id}`);
  if (!response.ok) throw new Error("Failed to fetch published asset");
  
  const data = await response.json();
  return data.asset;
}

/**
 * Create/publish new asset
 */
export async function createPublishedAsset(request: CreateAssetRequest): Promise<PublishedAsset> {
  const response = await fetch("/api/published", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to publish asset");
  }
  
  const data = await response.json();
  return data.asset;
}

/**
 * Update published asset
 */
export async function updatePublishedAsset(
  id: number,
  updates: Partial<PublishedAsset>
): Promise<PublishedAsset> {
  const response = await fetch(`/api/published/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) throw new Error("Failed to update published asset");
  
  const data = await response.json();
  return data.asset;
}

/**
 * Delete published asset
 */
export async function deletePublishedAsset(id: number): Promise<void> {
  const response = await fetch(`/api/published/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) throw new Error("Failed to delete published asset");
}

/**
 * Fetch asset analytics
 */
export async function fetchAssetAnalytics(id: number): Promise<AssetAnalytics> {
  const response = await fetch(`/api/published/${id}/analytics`);
  if (!response.ok) throw new Error("Failed to fetch asset analytics");
  
  return response.json();
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get public URL for asset
 */
export function getPublicAssetUrl(slug: string): string {
  return `${window.location.origin}/p/${slug}`;
}

/**
 * Get embed code for asset
 */
export function getAssetEmbedCode(slug: string, flowId?: string): string {
  const url = getPublicAssetUrl(slug);
  
  if (flowId) {
    return `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>
<script src="${window.location.origin}/api/audience/widget.js" data-flow="${flowId}" data-asset="${slug}" async></script>`;
  }
  
  return `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
}

/**
 * Get WordPress shortcode for asset
 */
export function getWordPressShortcode(slug: string, flowId?: string): string {
  if (flowId) {
    return `[audience_asset slug="${slug}" flow="${flowId}"]`;
  }
  return `[audience_asset slug="${slug}"]`;
}
