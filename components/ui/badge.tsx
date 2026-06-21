import * as React from "react"
import { BadgeCheck } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted",
  {
    variants: {
      variant: {
        default: "border-line text-muted",
        verified: "border-line text-accent",
        ok: "border-line text-ok",
        pending: "border-line text-pending",
        bad: "border-line text-bad",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  verified?: boolean
}

function Badge({ className, variant, verified, children, ...props }: BadgeProps) {
  const resolvedVariant = verified ? "verified" : variant

  return (
    <span className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props}>
      {verified && <BadgeCheck size={12} strokeWidth={1.5} />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }