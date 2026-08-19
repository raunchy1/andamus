"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { type RouteStop } from "@/components/ui/route-line"

export interface RideCardProps {
  href?: string
  onClick?: () => void
  departureTime: string
  arrivalTime: string
  price: string
  origin: RouteStop
  destination: RouteStop
  stops?: RouteStop[]
  routeMeta?: string
  driverName: string
  driverAvatar?: string | null
  verified?: boolean
  rating?: string | number
  seatsLabel?: string
  /** Set when the price is zero — the amount then reads as the good news. */
  free?: boolean
  className?: string
  index?: number
}

function RideCard({
  href,
  onClick,
  departureTime,
  arrivalTime,
  price,
  origin,
  destination,
  stops,
  routeMeta,
  driverName,
  driverAvatar,
  verified = false,
  rating,
  seatsLabel,
  free = false,
  className,
  index = 0,
}: RideCardProps) {
  const stopCount = stops?.length ?? 0
  const departure = origin.time || departureTime
  const arrival = destination.time || arrivalTime

  const content = (
    <Card tappable className={cn("flex flex-col gap-3 p-4", className)}>
      <div className="flex items-start gap-3">
        {/* route markers */}
        <div className="flex flex-col items-center gap-[3px] pt-[7px]">
          <span className="size-2 rounded-full border-2 border-accent" />
          <span className="h-[26px] w-px bg-line" />
          <span className="size-2 rounded-full bg-accent" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[13px]">
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="truncate text-[17px] font-semibold tracking-[-0.01em] text-ink">
              {origin.name}
            </span>
            {departure && (
              <span className="shrink-0 font-mono text-sm tabular-nums text-ink">{departure}</span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="truncate text-[17px] font-semibold tracking-[-0.01em] text-ink">
              {destination.name}
            </span>
            {arrival && (
              <span className="shrink-0 font-mono text-sm tabular-nums text-faint">{arrival}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5 pl-1">
          <span
            className={cn(
              "text-[17px] font-bold tracking-[-0.01em]",
              free ? "text-accent" : "text-ink"
            )}
          >
            {price}
          </span>
          {seatsLabel && <span className="text-[11px] text-faint">{seatsLabel}</span>}
        </div>
      </div>

      {(routeMeta || stopCount > 0) && (
        <p className="pl-[23px] text-xs text-faint">
          {[routeMeta, stopCount > 0 ? `+${stopCount}` : null].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="h-px bg-line-soft" />

      <div className="flex items-center gap-2.5">
        <Avatar src={driverAvatar} name={driverName} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{driverName}</span>

        {verified && (
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-accent-dim px-2 py-[3px]">
            <Check className="size-[11px] text-accent" strokeWidth={2.4} />
            <span className="text-[11px] font-medium text-accent">verificato</span>
          </span>
        )}

        {rating !== undefined && (
          <span className="flex shrink-0 items-center gap-1">
            <Star className="size-3 fill-pending text-pending" strokeWidth={0} />
            <span className="font-mono text-xs tabular-nums text-muted">{rating}</span>
          </span>
        )}
      </div>
    </Card>
  )

  const motionProps = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.04 },
  }

  if (href) {
    return (
      <motion.div {...motionProps}>
        <Link href={href} className="block">
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div {...motionProps} onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      {content}
    </motion.div>
  )
}

export { RideCard }
