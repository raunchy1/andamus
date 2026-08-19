"use client";

import { cn } from "@/lib/utils";

interface ToggleRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Drops the divider on the last row of a card. */
  last?: boolean;
}

/** A labelled switch row — the shape preferences take everywhere in the offer flow. */
export function ToggleRow({ label, hint, checked, onChange, last }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 py-3.5 text-left",
        !last && "border-b border-line-soft"
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </span>
      <span
        className={cn(
          "flex h-7 w-[46px] flex-shrink-0 items-center rounded-full px-[3px] transition-colors",
          checked ? "justify-end bg-accent" : "justify-start bg-surface-2"
        )}
      >
        <span className="size-[22px] rounded-full bg-surface shadow-[0_1px_3px_rgba(22,33,28,0.16)]" />
      </span>
    </button>
  );
}
