"use client";

import { RepoSelectTable, columns } from "./columns";
import { DataTable } from "./data-table";
import { Repository } from "../../lib/types/types";
import getApiBase from "../../utils/api-helper";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

async function getRepos(): Promise<Repository[]> {
  const response = await fetch(`${getApiBase()}/repos`, {
    cache: "no-store",
  });
  const result = (await response.json()) as Repository[];
  return result;
}

export default function ReposPage() {
  const [repos, setRepos] = useState([] as RepoSelectTable[]);

  useEffect(() => {
    const get = async () => {
      const res = await getRepos();
      const data: RepoSelectTable[] = res.map(
        ({ id, name, nameWithOwner, environments }) => {
          return {
            id,
            name,
            nameWithOwner,
            environments: environments?.map((env) => env.name) ?? [],
          };
        },
      );
      setRepos(data);
    };
    get();
  }, []);

  return (
    <div className="container mx-auto py-5 max-w-screen-lg">
      {repos.length > 0 && (
        <>
          <p className="text-base mb-2">Select repos to see workflows:</p>
          <DataTable columns={columns} data={repos} />
        </>
      )}
      {repos.length === 0 && (
        <div className="container mx-auto py-5 flex justify-center space-x-2">
          <Loader className="animate-spin" />
          <span>Loading repos</span>
        </div>
      )}
    </div>
  );
}
