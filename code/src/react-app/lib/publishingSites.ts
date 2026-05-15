export type DeploymentStatus = "published" | "syncing" | "failed" | "scheduled" | "idle";

export interface DeploymentRecord {
  id: string;
  siteId: string;
  siteName: string;
  assetName: string;
  assetType: "campaign" | "landing" | "html" | "blueprint" | "wrapper";
  status: DeploymentStatus;
  timestamp: string;
}

const DEPLOYMENTS_KEY = "magnet-lab-publishing-deployments";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDeploymentRecords(): DeploymentRecord[] {
  return readJson<DeploymentRecord[]>(DEPLOYMENTS_KEY, []);
}

export function saveDeploymentRecords(records: DeploymentRecord[]): void {
  writeJson(DEPLOYMENTS_KEY, records);
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function appendDeployment(record: Omit<DeploymentRecord, "id" | "timestamp">): DeploymentRecord {
  const full: DeploymentRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const records = getDeploymentRecords();
  writeJson(DEPLOYMENTS_KEY, [full, ...records].slice(0, 50));
  return full;
}

export function computeSeoReachScore(params: {
  connectedSites: number;
  publishedAssets: number;
  readyCampaigns: number;
  landingPages: number;
  blueprints: number;
}): number {
  const base =
    params.publishedAssets * 4 +
    params.readyCampaigns * 3 +
    params.landingPages * 2 +
    params.blueprints +
    params.connectedSites * 8;
  return Math.min(99, Math.max(12, Math.round(base / 3)));
}
