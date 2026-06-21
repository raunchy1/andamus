import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    const field = (
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "flex h-12 w-full appearance-none rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 pr-10 text-base text-fg transition-colors",
            "focus-visible:outline-none focus-visible:border-accent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dim"
          size={20}
          strokeWidth={1.5}
        />
      </div>
    )

    if (!label) return field

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={selectId} className="text-sm text-muted">
          {label}
        </label>
        {field}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }