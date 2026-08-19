"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Small line above the title: a count, a context, a route. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** One action, right of the title. Keep the label to two words so it never wraps. */
  action?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
  /** Sticks to the top while the list scrolls under it. */
  sticky?: boolean;
}

/** The header every app page opens with, so they stop each inventing their own. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  back,
  className,
  sticky = false,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-line bg-bg px-5 pb-4 pt-4",
        sticky && "sticky top-0 z-30",
        className
      )}
    >
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={1.6} />
          {back.label}
        </Link>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {eyebrow}
            </span>
          )}
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.03em] text-ink">
            {title}
          </h1>
          {subtitle && <p className="text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
    </header>
  );
}
