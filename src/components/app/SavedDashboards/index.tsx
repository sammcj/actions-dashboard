"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { SavedDashboard } from "@/lib/ui-types";
import useSavedDashboards from "@/hooks/useSavedDashboards";
import CreateDashboard from "@/components/app/CreateDashboard";
import { Button } from "@/components/ui/button";
import { Info, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SavedDashboards = () => {
  // Hooks
  const router = useRouter();
  const { dashboards, removeDashboard } = useSavedDashboards();

  // Methods
  const navigateToRuns = (item: SavedDashboard) => {
    router.push(`/runs?saved=${item.name}`);
  };

  return (
    <>
      {dashboards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboards.map((dashboard) => {
            const { name, description, repos, created } = dashboard;
            let totalWorkflows = 0;

            repos.forEach((repo) => {
              totalWorkflows += repo.workflows.length;
            });

            return (
              <Card
                onClick={() => navigateToRuns(dashboard)}
                className="cursor-pointer hover:bg-muted-background"
                key={name}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{name}</CardTitle>
                  <div className="space-x-0">
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      className="p-2 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDashboard(name);
                      }}
                    >
                      <Trash2 className="scale-75" />
                    </Button>
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      className="p-2 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Info className="scale-75" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-sm">{description}</div>
                  <div className="text-xs text-muted-foreground">
                    {repos.length} Repositories
                    <br />
                    {totalWorkflows} Workflows
                  </div>
                  {created && (
                    <>
                      <Separator />
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(created).toLocaleDateString()} -{" "}
                        {new Date(created).toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {dashboards.length === 0 && (
        <div className="space-y-4">
          <div>You do not have any saved dashboards</div>
          <CreateDashboard />
        </div>
      )}
    </>
  );
};

export default SavedDashboards;
