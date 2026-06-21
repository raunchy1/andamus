import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    const field = (
      <input
        type={type}
        id={inputId}
        className={cn(
          "flex h-12 w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 text-base text-fg placeholder:text-dim transition-colors",
          "focus-visible:outline-none focus-visible:border-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!label) return field

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm text-muted">
          {label}
        </label>
        {field}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }