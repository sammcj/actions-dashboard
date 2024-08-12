export interface SavedDashboard {
  name: string;
  description?: string;
  created?: number;
  updated?: number;
  repos: {
    name: string;
    workflows: {
      name?: string;
      id: number;
    }[];
  }[];
}
