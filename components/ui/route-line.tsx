"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

export interface RouteStop {
  name: string
  time?: string
}

export interface RouteLineProps {
  origin: RouteStop
  destination: RouteStop
  stops?: RouteStop[]
  meta?: string
  dateLabel?: string
  compact?: boolean
  hero?: boolean
  animate?: boolean
  className?: string
}

function StopRow({
  stop,
  dot,
  compact,
  hero,
}: {
  stop: RouteStop
  dot: React.ReactNode
  compact?: boolean
  hero?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        hero ? "min-h-[44px]" : compact ? "min-h-[28px]" : "min-h-[36px]"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center pt-1",
          hero ? "w-5" : "w-4"
        )}
      >
        {dot}
      </div>
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
        <span
          className={cn(
            "truncate text-fg",
            hero ? "text-lg font-semibold tracking-[-0.02em]" : "font-medium"
          )}
        >
          {stop.name}
        </span>
        {stop.time && (
          <span
            className={cn(
              "shrink-0 font-mono text-muted tabular-nums",
              hero ? "text-base" : "text-sm"
            )}
          >
            {stop.time}
          </span>
        )}
      </div>
    </div>
  )
}

function RouteLine({
  origin,
  destination,
  stops = [],
  meta,
  dateLabel,
  compact = false,
  hero = false,
  animate = false,
  className,
}: RouteLineProps) {
  const allStops = [origin, ...stops, destination]
  const connectorCount = allStops.length - 1
  const metaConnectorIndex = Math.floor(connectorCount / 2)
  const connectorHeight = hero ? 32 : compact ? 16 : 24

  return (
    <div className={cn("relative", className)}>
      {dateLabel && (
        <p className="mb-4 font-mono text-xs text-dim tabular-nums">{dateLabel}</p>
      )}

      <div className="flex flex-col">
        {allStops.map((stop, index) => {
          const isFirst = index === 0
          const isLast = index === allStops.length - 1
          const isMiddle = !isFirst && !isLast
          const connectorIndex = index

          const dot = isLast ? (
            <span className={cn("block rounded-full bg-accent", hero ? "size-2.5" : "size-2")} />
          ) : isMiddle ? (
            <span
              className={cn(
                "block rounded-full bg-line-strong",
                hero ? "size-[6px]" : "size-[5px]"
              )}
            />
          ) : (
            <span
              className={cn(
                "block rounded-full border border-muted bg-transparent",
                hero ? "size-2.5" : "size-2"
              )}
            />
          )

          return (
            <div key={`${stop.name}-${index}`} className="relative">
              <StopRow stop={stop} dot={dot} compact={compact} hero={hero} />
              {!isLast && (
                <div className="flex">
                  <div
                    className={cn(
                      "relative flex justify-center",
                      hero ? "w-5" : "w-4"
                    )}
                  >
                    {animate ? (
                      <motion.div
                        className="w-px bg-line-strong"
                        initial={{ height: 0 }}
                        animate={{ height: connectorHeight }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ) : (
                      <div
                        className="w-px bg-line-strong"
                        style={{ height: connectorHeight }}
                      />
                    )}
                    {meta && connectorIndex === metaConnectorIndex && (
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-xs text-dim tabular-nums">
                        {meta}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {meta && !hero && (
        <div className="mt-2 pl-7">
          <span className="font-mono text-xs text-dim tabular-nums">{meta}</span>
        </div>
      )}
    </div>
  )
}

export { RouteLine }