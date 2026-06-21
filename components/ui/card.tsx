import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  tappable = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tappable?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-line bg-surface p-5",
        tappable &&
          "transition-colors hover:border-line-strong hover:bg-surface-2 cursor-pointer active:scale-[0.99]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 mb-4", className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-semibold text-fg tracking-[-0.02em]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-4 mt-4 border-t border-line", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }