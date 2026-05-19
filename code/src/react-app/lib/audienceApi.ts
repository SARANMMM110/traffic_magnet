/**
 * Audience Growth Engine API Client
 * Type-safe helpers for all audience capture endpoints
 */

export interface CaptureFlow {
  id: number;
  name: string;
  status: "draft" | "live" | "paused";
  assetType: string;
  captureMethod: string;
  config: CaptureFlowConfig;
  publicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaptureFlowConfig {
  headline?: string;
  ctaText?: string;
  unlockPercent?: number;
  blurIntensity?: number;
  triggerDelayMs?: number;
  conversionGoal?: string;
  widgetLayout?: "fullscreen" | "modal" | "sticky";
  scrollTrigger?: number;
  exitIntentEnabled?: boolean;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface CreateFlowPayload {
  name: string;
  assetType: string;
  captureMethod: string;
  status?: "draft" | "live" | "paused";
  config?: CaptureFlowConfig;
  wordpressSiteIds?: number[];
}

export interface UpdateFlowPayload {
  name?: string;
  status?: "draft" | "live" | "paused";
  config?: Partial<CaptureFlowConfig>;
  wordpressSiteIds?: number[];
}

export interface Subscriber {
  id: number;
  email: string;
  name?: string;
  provider: string;
  source_asset_type?: string;
  source_asset_key?: string;
  capture_flow_id?: number;
  traffic_source?: string;
  wordpress_site_id?: number;
  engagement_score: number;
  created_at: string;
}

export interface AudienceSummary {
  subscriberCount: number;
  subscribersLast30Days: number;
  eventsByType: Record<string, number>;
  conversionRateGateToUnlock: number;
  googleUnlocks: number;
  emailCaptures: number;
}

export interface AudienceEvent {
  id: number;
  event_type: string;
  capture_flow_id?: number;
  subscriber_id?: number;
  asset_key: string;
  created_at: string;
  meta_json?: string;
}

export interface AudienceExtendedAnalytics {
  subscriberSeries: { day: string; count: number }[];
  unlockSeries: { day: string; count: number }[];
  unlockMethods: { method: string; count: number }[];
  trafficSources: { source: string; count: number }[];
  topAssets: { assetKey: string; events: number }[];
  funnel30d: Record<string, number>;
  publishingRoi: { pageViews: number; unlocks: number; visitorToUnlockPct: number };
}

export interface InjectHtmlPayload {
  html: string;
  flowPublicId: string;
  assetKey?: string;
}

export interface InjectHtmlResponse {
  html: string;
  embedSnippet: string;
}

const BASE_URL = "/api/audience";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch all capture flows for the current user
 */
export async function getFlows(): Promise<{ flows: CaptureFlow[] }> {
  return request<{ flows: CaptureFlow[] }>("/flows");
}

/**
 * Get a single capture flow by ID
 */
export async function getFlow(id: number): Promise<{ flow: CaptureFlow; targets: unknown[] }> {
  return request<{ flow: CaptureFlow; targets: unknown[] }>(`/flows/${id}`);
}

/**
 * Create a new capture flow
 */
export async function createFlow(payload: CreateFlowPayload): Promise<{ flow: CaptureFlow }> {
  return request<{ flow: CaptureFlow }>("/flows", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing capture flow
 */
export async function updateFlow(id: number, payload: UpdateFlowPayload): Promise<{ flow: CaptureFlow }> {
  return request<{ flow: CaptureFlow }>(`/flows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a capture flow
 */
export async function deleteFlow(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/flows/${id}`, {
    method: "DELETE",
  });
}

/**
 * Duplicate an existing flow
 */
export async function duplicateFlow(id: number): Promise<{ flow: CaptureFlow }> {
  return request<{ flow: CaptureFlow }>(`/flows/${id}/duplicate`, {
    method: "POST",
  });
}

/**
 * Get all subscribers
 */
export async function getSubscribers(limit = 40): Promise<{ subscribers: Subscriber[] }> {
  return request<{ subscribers: Subscriber[] }>(`/subscribers?limit=${limit}`);
}

/**
 * Get recent audience events
 */
export async function getRecentEvents(limit = 30): Promise<{ events: AudienceEvent[] }> {
  return request<{ events: AudienceEvent[] }>(`/events/recent?limit=${limit}`);
}

/**
 * Get audience analytics summary
 */
export async function getAnalyticsSummary(): Promise<AudienceSummary> {
  return request<AudienceSummary>("/analytics/summary");
}

/**
 * Get extended audience analytics
 */
export async function getExtendedAnalytics(): Promise<AudienceExtendedAnalytics> {
  return request<AudienceExtendedAnalytics>("/analytics/extended");
}

/**
 * Get top assets by event count
 */
export async function getTopAssets(): Promise<{ assets: { assetKey: string; events: number }[] }> {
  return request<{ assets: { assetKey: string; events: number }[] }>("/analytics/assets");
}

/**
 * Inject audience capture widget into HTML
 */
export async function injectHtml(payload: InjectHtmlPayload): Promise<InjectHtmlResponse> {
  return request<InjectHtmlResponse>("/inject-html", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Generate widget embed code for a flow
 */
export function generateEmbedCode(flowPublicId: string, assetKey = ""): string {
  const origin = window.location.origin;
  return `<script src="${origin}/api/audience/widget.js" async data-flow="${flowPublicId}" data-asset="${assetKey}"></script>`;
}

/**
 * Get widget configuration URL
 */
export function getWidgetUrl(): string {
  return `${window.location.origin}/api/audience/widget.js`;
}

/**
 * Get public flow config URL (for testing/preview)
 */
export function getPublicFlowUrl(flowPublicId: string): string {
  return `${window.location.origin}/api/audience/public/flows/${flowPublicId}`;
}
