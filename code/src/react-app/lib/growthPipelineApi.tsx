export type GrowthDeployment = {
  id: number;
  publicId: string;
  name: string;
  status: string;
  deploymentState: string;
  assetType: string;
  assetKey: string;
  linkedToolId: number | null;
  linkedCampaignId: number | null;
  audienceFlowPublicId: string | null;
  audienceCaptureMethod: string | null;
  assistantPublicId: string | null;
  assistantId: number | null;
  wordpressSiteId: number | null;
  publishTarget: string;
  analyticsEnabled: boolean;
  conversionTrackingEnabled: boolean;
  optimizationEnabled: boolean;
  config: Record<string, unknown>;
  performance: Record<string, unknown>;
  lastDeployedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GrowthOverview = {
  totalDeployments: number;
  liveDeployments: number;
  activeRuns: number;
  totalEvents: number;
  leadsInfluenced: number;
  assistantEngagements: number;
  publishingTargets: number;
  conversionRate: number;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export function fetchGrowthOverview() {
  return api<{
    overview: GrowthOverview;
    deployments: GrowthDeployment[];
    operationsFeed: Array<{
      id: number;
      eventType: string;
      createdAt: string;
      assetKey: string;
      deploymentName?: string;
      meta?: Record<string, unknown>;
    }>;
    queue: Array<{ deploymentId: number; name: string; state: string; updatedAt: string }>;
  }>("/api/growth-pipeline/overview");
}

export function fetchGrowthDeployments() {
  return api<{ deployments: GrowthDeployment[] }>("/api/growth-pipeline/deployments");
}

export function createGrowthDeployment(body: Record<string, unknown>) {
  return api<{ deployment: GrowthDeployment }>("/api/growth-pipeline/deployments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateGrowthDeployment(id: number, body: Record<string, unknown>) {
  return api<{ deployment: GrowthDeployment }>(`/api/growth-pipeline/deployments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteGrowthDeployment(id: number) {
  return api<{ success: boolean }>(`/api/growth-pipeline/deployments/${id}`, { method: "DELETE" });
}

export function executeGrowthDeployment(id: number, body?: { html?: string }) {
  return api<{
    deployment: GrowthDeployment;
    html: string;
    steps: Array<{ step: string; status: string; message: string }>;
    handoff: Record<string, unknown>;
  }>(`/api/growth-pipeline/deployments/${id}/execute`, {
    method: "POST",
    body: JSON.stringify(body || {}),
  });
}

export function injectGrowthBundle(body: {
  html: string;
  assetKey: string;
  audienceFlowPublicId?: string | null;
  assistantPublicId?: string | null;
  deploymentPublicId?: string | null;
  analyticsEnabled?: boolean;
}) {
  return api<{ html: string }>("/api/growth-pipeline/inject-bundle", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
