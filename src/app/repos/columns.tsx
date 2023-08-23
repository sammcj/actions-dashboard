"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RepoSelectTable = {
  id: number;
  name: string;
  nameWithOwner: string;
  environments?: string[];
};

export const columns: ColumnDef<RepoSelectTable>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nameWithOwner",
    header: "Owner",
    cell: ({ row }) => {
      const owner = row.getValue<string>("nameWithOwner");
      const [formatted] = owner.split("/");
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Repo Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "environments",
    header: "Environments",
    cell: ({ row }) => {
      const envs = row.getValue<string[]>("environments");
      return (
        <div className="text-left font-small flex gap-1">
          {envs.map((env) => (
            <span
              key={env}
              className="rounded-full bg-slate-500 text-white px-2 py-1 text-xs"
            >
              {env}
            </span>
          ))}
        </div>
      );
    },
  },
];
