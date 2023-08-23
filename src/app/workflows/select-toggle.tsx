"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface SelectionToggleProps {
  label: string;
  match: string;
  checkedFn: (v: string) => boolean;
  visibilityFn: (v: string) => boolean;
  selectFn: (v: string) => void;
  unselectFn: (v: string) => void;
}

export default function SelectionToggle({
  label,
  match,
  checkedFn,
  selectFn,
  unselectFn,
  visibilityFn,
}: SelectionToggleProps) {
  const checked = checkedFn(match);
  const visible = visibilityFn(match);

  return (
    visible && (
      <div
        className="flex items-center gap-x-1 p-2 hover:bg-accent rounded cursor-pointer"
        onClick={() => {
          if (checked) {
            unselectFn(match);
          } else {
            selectFn(match);
          }
        }}
      >
        <Checkbox className="pointer-events-none" checked={checked} />
        <label className="text-sm pointer-events-none">{label}</label>
      </div>
    )
  );
}
