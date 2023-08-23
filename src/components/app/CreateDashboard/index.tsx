"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useInProgressDashboard from "@/hooks/useInProgressDashboard";
import { SavedDashboard } from "@/lib/ui-types";
import useSavedDashboards from "@/hooks/useSavedDashboards";

interface CreateDashboardProps {
  buttonLabel?: string;
  onSubmit?: Function;
  dataQuery?: string;
}

export default function CreateDashboard(props: CreateDashboardProps) {
  // React hooks
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Nextjs hooks
  const router = useRouter();

  // Custom hooks
  const [, setInProgress] = useInProgressDashboard();
  const { addDashboard } = useSavedDashboards();

  // Set name in form
  const onNameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  // Set description in form
  const onDescInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  // Utility to build a dashboard item
  // If query is passed in as
  const buildDashboardItem = (): SavedDashboard => {
    const { dataQuery: dashboardQuery } = props;
    const format = /.+?\[.+?\]/g;

    const dashboardItem: SavedDashboard = {
      name: name,
      description: description,
      repos: [],
    };

    if (dashboardQuery && format.test(dashboardQuery)) {
      dashboardItem.repos = dashboardQuery.match(format)!.map((d) => {
        const [, repo, idList] = /^,?(.*?)\[(.*)\]/g.exec(d)!;
        return {
          name: repo,
          workflows: idList.split(",").map((i) => {
            return { id: parseInt(i, 10) };
          }),
        };
      });
    }

    return dashboardItem;
  };

  const onContinue = () => {
    if (!name) {
      return;
    }

    const { onSubmit } = props;
    const dashboardItem = buildDashboardItem();

    if (typeof onSubmit === "function") {
      addDashboard(dashboardItem);
      onSubmit(dashboardItem);
    } else {
      setInProgress(dashboardItem);
      router.push("/repos");
    }

    // Close the modal
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {props.buttonLabel ?? "Create a dashboard"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {props.onSubmit ? "Save dashboard view" : "Create a dashboard view"}
          </DialogTitle>
          <DialogDescription>
            {!props.onSubmit &&
              "Create a dashboard view by selecting repositories and workflows"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              placeholder="Deployments"
              value={name}
              onInput={onNameInput}
              onKeyUp={(e) => (e.key === "Enter" ? onContinue() : null)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Description (optional)
            </Label>
            <Textarea
              id="desc"
              placeholder="Deployment workflows"
              value={description}
              className="col-span-3"
              onInput={onDescInput}
              onKeyUp={(e) => (e.key === "Enter" ? onContinue() : null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!name} onClick={onContinue}>
            {props.onSubmit ? "Save" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
