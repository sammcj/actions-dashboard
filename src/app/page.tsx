"use client";

import Link from "next/link";
import SavedDashboards from "@/components/app/SavedDashboards";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreateDashboard from "@/components/app/CreateDashboard";

export default function Home() {
  return (
    <div className="container mx-auto py-5 max-w-screen-xl flex flex-col gap-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xl">Saved dashboards</div>
        <CreateDashboard />
      </div>
      <Separator className="my-3" />
      <SavedDashboards />
      <Separator className="my-3" />
      <div className="text-center text-sm space-y-2">
        <div className="text-muted-foreground">
          View workflow runs without creating a dashboard
        </div>
        <Link
          prefetch={false}
          className={buttonVariants({ variant: "outline" })}
          href={"/repos"}
        >
          View repositories
        </Link>
      </div>
    </div>
  );
}
