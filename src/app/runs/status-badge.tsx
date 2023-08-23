"use client";

type StatusBadgeProps = {
  status: string | null;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="rounded-full bg-sky-950 text-white px-2 py-1 text-xs capitalize">
      {status}
    </span>
  );
}
