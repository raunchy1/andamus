import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    const field = (
      <textarea
        id={textareaId}
        className={cn(
          "flex min-h-[120px] w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-3 text-base text-fg placeholder:text-dim transition-colors resize-y",
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
        <label htmlFor={textareaId} className="text-sm text-muted">
          {label}
        </label>
        {field}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }