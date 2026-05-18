export const PIPELINE_DEPLOY_STORAGE_KEY = "magnet_pipeline_deploy_v1";

export type PipelineDeployPayload = {
  html: string;
  source: "content-wrapper";
  audienceFlowPublicId: string | null;
  audienceAssetKey: string;
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
