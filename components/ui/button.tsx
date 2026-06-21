"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border text-base font-semibold normal-case lowercase whitespace-nowrap transition-all duration-[var(--duration-fast)] outline-none select-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-accent-fg hover:opacity-90",
        primary:
          "border-transparent bg-accent text-accent-fg hover:opacity-90",
        outline:
          "border-line bg-transparent text-fg hover:border-line-strong hover:bg-surface-2",
        secondary:
          "border-line bg-transparent text-fg hover:border-line-strong hover:bg-surface-2",
        ghost:
          "border-transparent bg-transparent text-muted hover:text-fg hover:bg-surface-2",
        destructive:
          "border-transparent bg-bad/15 text-bad hover:bg-bad/25",
        link: "border-transparent text-accent underline-offset-4 hover:underline h-auto p-0",
      },
      size: {
        default: "h-12 gap-2 px-5",
        sm: "h-10 gap-1.5 px-4 text-sm",
        lg: "h-12 gap-2 px-6",
        icon: "size-12 p-0",
        "icon-sm": "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }