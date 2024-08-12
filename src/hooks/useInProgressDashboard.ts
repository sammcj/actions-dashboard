"use client";

import useLocalStorage from "./useLocalStorage";
import { SavedDashboard } from "@/lib/ui-types";

const useInProgressDashboard = (): [
  SavedDashboard | null,
  (data: SavedDashboard) => void,
  () => void,
] => {
  const [inProgress, setInProgress, removeInProgress] =
    useLocalStorage<SavedDashboard | null>("dashboard-in-progress", null);
  return [inProgress, setInProgress, removeInProgress];
};

export default useInProgressDashboard;
