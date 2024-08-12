"use client";

import SelectionToggle from "./select-toggle";
import { Dispatch, SetStateAction } from "react";
import { WorkflowRecord } from "./page";

interface TableStateProps {
  allWorkflows: WorkflowRecord;
  filtered: WorkflowRecord;
  selected: Record<string, number[]>;
  setSelected: Dispatch<SetStateAction<Record<string, number[]>>>;
}

export function QuickSelectionToolbar({
  allWorkflows,
  filtered,
  selected,
  setSelected,
}: TableStateProps) {
  const selectByMatch = (term: string) => {
    let copy = { ...selected };

    Object.keys(filtered).forEach((key) => {
      const workflow = filtered[key];
      const matched = workflow.filter((i) =>
        i.name.toLowerCase().includes(term),
      );
      copy[key].push(...matched.map((m) => m.id));
      copy[key] = [...new Set(copy[key])];
    });

    setSelected(copy);
  };

  const unselectByMatch = (term: string) => {
    let copy = { ...selected };

    Object.keys(filtered).forEach((key) => {
      const record = allWorkflows[key];

      const toUnmatch = record
        .filter((workflow) => !workflow.name.toLowerCase().includes(term))
        .map((workflow) => workflow.id);

      copy[key] = copy[key].filter((id) => toUnmatch.includes(id));
    });

    setSelected(copy);
  };

  const getCheckedState = (term: string) => {
    const searched: Record<string, number[]> = {};

    Object.values(filtered).forEach((workflow) => {
      workflow.forEach((item) => {
        const { name, repoWithOwner, id } = item;
        if (name.toLowerCase().includes(term)) {
          (searched[repoWithOwner] = searched[repoWithOwner] || []).push(id);
        }
      });
    });

    return Object.keys(searched)
      .map((key) => {
        return searched[key].every((id) => selected[key].includes(id));
      })
      .every(Boolean);
  };

  const getVisibilityState = (term: string) => {
    let visibility = false;

    Object.values(filtered).forEach((workflow) => {
      workflow.forEach((item) => {
        const { name } = item;
        if (name.toLowerCase().includes(term)) {
          visibility = true;
        }
      });
    });

    return visibility;
  };

  function FilterSelectionStatus() {
    let totalCount = 0;
    let filteredCount = 0;
    let selectedCount = 0;

    Object.values(selected).forEach((ids) => (selectedCount += ids.length));
    Object.values(filtered).forEach((w) => (filteredCount += w.length));
    Object.values(allWorkflows).forEach((w) => (totalCount += w.length));

    return (
      <div className="flex justify-between items-center pb-2">
        <div className="text-xs">{`Showing ${filteredCount} of ${totalCount} workflows`}</div>
        <div className="text-xs">{`Selected ${selectedCount} of ${totalCount}`}</div>
      </div>
    );
  }

  return (
    <>
      <FilterSelectionStatus />
      <div className="flex flex-wrap items-center p-1 gap-x-1 bg-slate-100 dark:bg-slate-950 border rounded-t">
        <SelectionToggle
          label="All"
          match=""
          checkedFn={getCheckedState}
          visibilityFn={getVisibilityState}
          selectFn={selectByMatch}
          unselectFn={unselectByMatch}
        />
        <SelectionToggle
          label="Deploy"
          match="deploy"
          checkedFn={getCheckedState}
          visibilityFn={getVisibilityState}
          selectFn={selectByMatch}
          unselectFn={unselectByMatch}
        />
        <SelectionToggle
          label="Build"
          match="build"
          checkedFn={getCheckedState}
          visibilityFn={getVisibilityState}
          selectFn={selectByMatch}
          unselectFn={unselectByMatch}
        />
        <SelectionToggle
          label="Lint"
          match="lint"
          checkedFn={getCheckedState}
          visibilityFn={getVisibilityState}
          selectFn={selectByMatch}
          unselectFn={unselectByMatch}
        />
      </div>
    </>
  );
}
