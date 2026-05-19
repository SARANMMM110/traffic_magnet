export const PIPELINE_DEPLOY_STORAGE_KEY = "magnet_pipeline_deploy_v1";

/** Unified growth deployment handoff payload (Content Wrapper → WordPress / export) */
export type PipelineDeployPayload = {
  html: string;
  source: "content-wrapper" | "growth-pipeline" | "tool" | "landing";
  growthDeploymentId?: number | null;
  growthDeploymentPublicId?: string | null;
  audienceFlowPublicId: string | null;
  audienceAssetKey: string;
  assistantPublicId?: string | null;
  assistantAssetKey?: string;
  analyticsEnabled?: boolean;
  conversionTrackingEnabled?: boolean;
  publishTarget?: string;
  wordpressSiteId?: number | null;
  pageTitle?: string;
  savedAt: number;
};

export function writePipelineDeploy(payload: Omit<PipelineDeployPayload, "savedAt">): void {
  try {
    const full: PipelineDeployPayload = { ...payload, savedAt: Date.now() };
    sessionStorage.setItem(PIPELINE_DEPLOY_STORAGE_KEY, JSON.stringify(full));
  } catch {
    /* quota / private mode */
  }
}

export function readPipelineDeploy(maxAgeMs = 24 * 60 * 60 * 1000): PipelineDeployPayload | null {
  try {
    const raw = sessionStorage.getItem(PIPELINE_DEPLOY_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PipelineDeployPayload;
    if (!data.html || typeof data.savedAt !== "number") return null;
    if (Date.now() - data.savedAt > maxAgeMs) {
      sessionStorage.removeItem(PIPELINE_DEPLOY_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearPipelineDeploy(): void {
  try {
    sessionStorage.removeItem(PIPELINE_DEPLOY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
