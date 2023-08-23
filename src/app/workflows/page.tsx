"use client";

import getApiBase from "@/utils/api-helper";
import useInProgressDashboard from "@/hooks/useInProgressDashboard";
import useSavedDashboards from "@/hooks/useSavedDashboards";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { QuickSelectionToolbar } from "./quick-selection-toolbar";
import { WorkFlowTable } from "./workflow-table";
import type { Workflow } from "@/lib/types/types";

type SearchParams = {
  repos: string;
};

type WorkflowResponse = {
  repoWithOwner: string;
  workflows: Workflow[];
};

export type WorkflowRecord = Record<string, Workflow[]>;

async function getWorkflowsAsRecord(params: string): Promise<WorkflowRecord> {
  const res = await fetch(`${getApiBase()}/workflows?repos=${params}`, {
    cache: "no-store",
  });
  const data = (await res.json()) as WorkflowResponse[];
  return data.reduce((acc, curr) => {
    const { repoWithOwner, workflows } = curr;
    (acc[repoWithOwner] = acc[repoWithOwner] || []).push(...workflows);
    return acc;
  }, {} as WorkflowRecord);
}

export default function WorkflowsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get an instance of router
  const router = useRouter();

  // All workflows
  const [allWorkflows, setAllWorkflows] = useState({} as WorkflowRecord);

  // Search and filtering hooks
  const [filtered, setFiltered] = useState({} as WorkflowRecord);
  const [selected, setSelected] = useState({} as Record<string, number[]>);
  const [search, setSearch] = useState("");

  // Custom hooks for saved dashboard and state
  const { addDashboard } = useSavedDashboards();
  const [inProgress, setInProgress, clearInProgress] = useInProgressDashboard();

  // Extract query params
  const params = (searchParams as SearchParams).repos;

  // Navigate to runs page
  function navigateToRuns() {
    let searchParam = "";

    if (inProgress) {
      searchParam = `saved=${inProgress.name}`;
      addDashboard(inProgress);
      clearInProgress();
    } else {
      Object.keys(selected).forEach((k) => {
        if (selected[k].length > 0) {
          searchParam += `${k}[${selected[k].join(",")}],`;
        }
      });
      searchParam = `workflows=${searchParam.replace(/,$/, "")}`;
    }

    if (searchParam !== "") {
      router.push(`/runs?${searchParam}`);
    }
  }

  // Update in progress dashboard when rows are selected
  useEffect(() => {
    if (inProgress) {
      const _state = { ...inProgress };
      _state.repos = [];
      Object.keys(selected).forEach((k) => {
        if (selected[k].length > 0) {
          _state.repos.push({
            name: k,
            workflows: selected[k].map((id) => ({ id, name: k })),
          });
        }
      });
      setInProgress(_state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Update filtered list on search
  useEffect(() => {
    const searched: WorkflowRecord = {};
    const term = search.toLowerCase();

    Object.values(allWorkflows).forEach((workflow) => {
      workflow.forEach((item) => {
        const { name, repoWithOwner } = item;
        if (
          name.toLowerCase().includes(term) ||
          repoWithOwner.toLowerCase().includes(term)
        ) {
          (searched[repoWithOwner] = searched[repoWithOwner] || []).push(item);
        }
      });
    });

    setFiltered(searched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Get list of workflows for repositories
  useEffect(() => {
    const get = async () => {
      const workflowRecords = await getWorkflowsAsRecord(params);
      setAllWorkflows(workflowRecords);
      setFiltered(workflowRecords);
      setSelected(
        Object.keys(workflowRecords).reduce(
          (acc, curr) => {
            acc[curr] = [];
            return acc;
          },
          {} as Record<string, number[]>,
        ),
      );
    };
    get();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="relative container mx-auto py-5 max-w-screen-xl">
      <p className="text-base">Select workflows to see runs</p>
      <div className="sticky top-[64px] z-40 bg-background">
        <div className="flex items-center justify-end py-4 gap-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            <Input
              placeholder="Search across runs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div>
            <Button size="sm" onClick={navigateToRuns}>
              Continue
            </Button>
          </div>
        </div>
        <QuickSelectionToolbar
          allWorkflows={allWorkflows}
          filtered={filtered}
          selected={selected}
          setSelected={setSelected}
        />
      </div>
      <WorkFlowTable
        filtered={filtered}
        selected={selected}
        setSelected={setSelected}
      />
    </div>
  );
}
