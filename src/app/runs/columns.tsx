"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, GitBranchIcon, Timer } from "lucide-react";
import { Owner } from "@/lib/types/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConclusionBadge } from "./conclusion-badge";
import { StatusBadge } from "./status-badge";

export type RunsTable = {
  id: number;
  display_title: string;
  actorName: string;
  actor: Owner;
  status: string | null;
  conclusion: string | null;
  event: string;
  head_branch: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
};

export const columns: ColumnDef<RunsTable>[] = [
  {
    accessorKey: "display_title",
    header: () => <div className="w-80 max-w-xs">Title</div>,
    cell: ({ row }) => {
      const display_title: string = row.getValue("display_title");
      const url = row.original.html_url;
      return (
        <a target={"_blank"} href={url} className="flex items-center">
          <div className="w-80 max-w-xs text-sky-600">{display_title}</div>;
        </a>
      );
    },
  },
  {
    accessorKey: "actorName",
    header: "Triggered by",
    cell: ({ row }) => {
      const actorName: string = row.getValue("actorName");
      const actor = row.original.actor;
      return (
        <div className="text-left font-small flex gap-0.5 text-slate-400 items-center">
          <Avatar className="scale-50 p-0">
            <AvatarImage src={actor.avatar_url ?? ""}></AvatarImage>
            <AvatarFallback>
              {actorName.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {actorName}
        </div>
      );
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: "head_branch",
    header: "Branch",
    cell: ({ row }) => {
      const head_branch = row.getValue<string>("head_branch");
      return (
        <div className="text-left font-small flex gap-1 text-slate-500 items-center w-24 truncate">
          <GitBranchIcon className="scale-75" /> {head_branch}
        </div>
      );
    },
  },
  {
    accessorKey: "event",
    header: "Event",
  },
  {
    accessorKey: "created_at",
    header: "Started at",
    cell: ({ row }) => {
      const created_at = row.getValue<string>("created_at");
      const date = new Date(created_at);
      return (
        <div className="text-left font-small flex gap-1 items-center">
          <Timer className="scale-75" /> {date.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: "conclusion",
    header: "Conclusion",
    cell: ({ row }) => {
      const conclusion = row.getValue<string>("conclusion");
      return <ConclusionBadge conclusion={conclusion} />;
    },
  },
];
