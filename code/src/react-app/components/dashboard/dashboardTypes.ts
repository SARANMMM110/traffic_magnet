export interface DashboardStats {
  projectCount: number;
  toolCount: number;
  builtToolCount: number;
  seoPageCount: number;
  recentProjects: Array<{
    id: number;
    name: string;
    niche: string;
    goal: string | null;
    tool_count: number;
    created_at: string;
  }>;
}

export interface DashboardProject {
  id: number;
  name: string;
  niche: string;
  goal: string | null;
  tool_count: number;
  created_at: string;
}
