"use client";

import { SavedDashboard } from "@/lib/ui-types";
import useLocalStorage from "./useLocalStorage";

interface DashboardsHooks {
  dashboards: SavedDashboard[];
  addDashboard: (item: SavedDashboard) => void;
  removeDashboard: (name: string) => void;
  clearDashboards: () => void;
  getQuery: (name: string) => string;
  getDashboard: (name: string) => SavedDashboard | null;
}

const storeKey = "dashboards";

const useSavedDashboards = (): DashboardsHooks => {
  const [saved, setSaved, clearSaved] = useLocalStorage<SavedDashboard[]>(
    storeKey,
    [],
  );

  const getCopy = () => JSON.parse(JSON.stringify(saved)) as SavedDashboard[];

  const remove = (name: string) => {
    const _saved = getCopy();
    const view = _saved.find((v) => v.name === name);
    if (view) {
      const filtered = _saved.filter((v) => v !== view);
      setSaved(filtered);
    }
  };

  const add = (item: SavedDashboard) => {
    const _saved = getCopy();
    const exists = _saved.find((dashboard) => dashboard.name === item.name);
    if (!exists) {
      item.created = Date.now();
      _saved.push(item);
      setSaved(_saved);
    }
  };

  const getQuery = (name: string) => {
    let params = "";
    const dash = saved.find((dashboard) => dashboard.name === name);
    if (dash) {
      dash.repos.forEach((repo) => {
        params += `${repo.name}[${repo.workflows.map((w) => w.id).join(",")}],`;
      });
    }
    return params.replace(/,$/, "");
  };

  const getDashboard = (name: string) => {
    const _saved = getCopy();
    const exists = _saved.find((dashboard) => dashboard.name === name);
    if (exists) {
      return exists;
    }
    return null;
  };

  return {
    dashboards: saved,
    addDashboard: add,
    removeDashboard: remove,
    clearDashboards: clearSaved,
    getQuery,
    getDashboard,
  };
};

export default useSavedDashboards;
