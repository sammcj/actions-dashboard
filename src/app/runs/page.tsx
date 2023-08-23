"use client";

import { Run } from "@/lib/types/types";
import { RunsTable, columns } from "./columns";
import { DataTable } from "./data-table";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { log } from "@/lib/log";
import getApiBase from "@/utils/api-helper";
import { Button } from "@/components/ui/button";
import useSavedDashboards from "@/hooks/useSavedDashboards";
import { useToast } from "@/components/ui/use-toast";
import { SavedDashboard } from "@/lib/ui-types";
import CreateDashboard from "@/components/app/CreateDashboard";

type QueryParams = { [key: string]: string | string[] | undefined };

type SearchParams = {
  workflows?: string;
  saved?: string;
};

async function getRuns(params: string): Promise<Run[]> {
  const res = await fetch(`${getApiBase()}/runs?workflows=${params}`, {
    cache: "no-store",
  });
  const data = (await res.json()) as Run[];
  log.debug(data);
  return data;
}

export default function WorkflowsPage({
  searchParams,
}: {
  searchParams: QueryParams;
}) {
  // Setup hooks
  const [runs, setRuns] = useState([] as Run[]);
  const [search, setSearch] = useState("");
  const { addDashboard } = useSavedDashboards();
  const [dashboardItem, setDashboardItem] = useState(
    null as null | SavedDashboard,
  );
  const [shareText, setShareText] = useState("Share");

  // Custom hooks
  const { getQuery, getDashboard } = useSavedDashboards();
  const { toast } = useToast();

  // Get query
  const query = searchParams as SearchParams;

  // Share function
  const shareDashboard = () => {
    // Toast not working :(
    toast({
      description: "URL copied to clipboard",
    });

    if (query.saved) {
      navigator.clipboard.writeText(
        `${location.host}/runs?workflows=${getQuery(query.saved)}`,
      );
    } else {
      navigator.clipboard.writeText(location.href);
    }

    setShareText("URL Copied");
  };

  const onSaveDashboard = (data: SavedDashboard) => {
    addDashboard(data);
    setDashboardItem(data);
  };

  // Get params on load
  useEffect(() => {
    let params = "";
    const get = async () => {
      const res = await getRuns(params);
      setRuns(res);
    };

    if (query.saved) {
      params = getQuery(query.saved);
      setDashboardItem(getDashboard(query.saved));
    } else if (query.workflows) {
      params = query.workflows;
    }

    if (params) {
      get();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revert share text
  useEffect(() => {
    const timer = setTimeout(() => {
      setShareText("Share");
    }, 3000);
    return () => clearTimeout(timer);
  }, [shareText]);

  return (
    <div className="container mx-auto py-5 max-w-screen-2xl">
      <p className="text-xl mb-2">
        {dashboardItem ? dashboardItem.name : "Unsaved dashboard view"}
      </p>
      <div className="flex justify-between">
        <Input
          placeholder="Search across runs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          <Button onClick={shareDashboard} variant={"outline"}>
            {shareText}
          </Button>
          {!dashboardItem && (
            <CreateDashboard
              buttonLabel="Save"
              onSubmit={onSaveDashboard}
              dataQuery={query.workflows}
            />
          )}
        </div>
      </div>
      {runs.map((repoWithRuns) => {
        const { id, name, html_url } = repoWithRuns.repository;
        const data: RunsTable[] = repoWithRuns.runs.map((run) => {
          return {
            actor: run.actor,
            actorName: run.actor.login,
            conclusion: run.conclusion,
            created_at: run.created_at,
            event: run.event,
            head_branch: run.head_branch,
            html_url: run.html_url,
            id: run.id,
            display_title: run.display_title,
            status: run.status,
            updated_at: run.updated_at,
          };
        });
        return (
          <div
            className="rounded-md border my-4 flex-col overflow-hidden"
            key={id}
          >
            <div className="p-4 bg-muted">{name}</div>
            <DataTable columns={columns} data={data} search={search} />
          </div>
        );
      })}
    </div>
  );
}
