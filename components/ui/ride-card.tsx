"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RouteLine, type RouteStop } from "@/components/ui/route-line"

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
  className,
  index = 0,
}: RideCardProps) {
  const content = (
    <Card tappable className={cn("p-5", className)}>
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <span className="font-mono text-sm text-fg tabular-nums">
          {arrivalTime ? `${departureTime} — ${arrivalTime}` : departureTime}
        </span>
        <span className="font-mono text-base font-medium text-fg tabular-nums">{price}</span>
      </div>

      <RouteLine
        origin={origin}
        destination={destination}
        stops={stops}
        meta={routeMeta}
        compact
      />

      <Separator className="my-4" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar src={driverAvatar} name={driverName} size="sm" />
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-fg">{driverName}</span>
            {verified && <Badge verified>verificato</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 font-mono text-sm text-muted">
          {rating !== undefined && <span className="tabular-nums">{rating}</span>}
          {seatsLabel && <span>{seatsLabel}</span>}
        </div>
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