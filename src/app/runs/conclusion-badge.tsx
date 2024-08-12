"use client";

type ConclusionBadgeProps = {
  conclusion: string | null;
};

const getBgColor = (conclusion: string | null) => {
  switch (conclusion) {
    case "success":
      return "bg-green-600";
    case "failure":
      return "bg-rose-600";
    case "cancelled":
      return "bg-slate-500";
    case "skipped":
      return "bg-slate-200";
    default:
      return "bg-slate-800";
  }
};

export function ConclusionBadge({ conclusion }: ConclusionBadgeProps) {
  return (
    <span
      className={`rounded-full ${getBgColor(
        conclusion,
      )} text-white px-2 py-1 text-xs capitalize`}
    >
      {conclusion}
    </span>
  );
}
