"use client";

import { Dispatch, SetStateAction } from "react";
import { WorkflowRecord } from "./page";
import { Checkbox } from "@/components/ui/checkbox";

interface WorkflowTableProps {
  filtered: WorkflowRecord;
  selected: Record<string, number[]>;
  setSelected: Dispatch<SetStateAction<Record<string, number[]>>>;
}

export function WorkFlowTable({
  filtered,
  selected,
  setSelected,
}: WorkflowTableProps) {
  const onSelectionChange = (repo: string, id: number) => {
    const copy = { ...selected };
    if (copy[repo].includes(id)) {
      copy[repo] = copy[repo].filter((_id) => _id !== id);
    } else {
      copy[repo].push(id);
    }
    setSelected(copy);
  };

  const selectByRepo = (repo: string, checked: boolean) => {
    let copy = { ...selected };
    copy[repo] = checked ? filtered[repo].map((w) => w.id) : [];
    setSelected(copy);
  };

  return (
    <div className="relative border-x border-b rounded-b overflow-hidden">
      {Object.keys(filtered).map((key) => {
        const workflows = filtered[key];
        const [owner, repo] = key.split("/");

        return (
          <div key={key}>
            <div className="flex items-center p-3 gap-x-3 bg-sky-200/30 dark:bg-sky-950/40 border-y">
              <Checkbox
                id={`wf-${key}`}
                checked={workflows
                  .map((w) => w.id)
                  .every((_id) => selected[key].includes(_id))}
                onCheckedChange={(checked) => {
                  selectByRepo(key, checked as boolean);
                }}
              ></Checkbox>
              <label
                htmlFor={`wf-${key}`}
                className="grow text-sm text-sky-600"
              >
                {owner} &gt; {repo}
              </label>
            </div>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center gap-x-1 hover:bg-accent px-3 odd:bg-accent/40 dark:odd:bg-accent/20 dark:hover:bg-accent"
              >
                <Checkbox
                  id={`wf-${workflow.id}`}
                  checked={selected[workflow.repoWithOwner].includes(
                    workflow.id,
                  )}
                  onCheckedChange={() => {
                    onSelectionChange(workflow.repoWithOwner, workflow.id);
                  }}
                ></Checkbox>
                <label
                  htmlFor={`wf-${workflow.id}`}
                  className="grow text-sm p-3 cursor-pointer"
                >
                  {workflow.name}
                </label>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
