"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  addMinutesToTime,
  formatDistanceKm,
  formatDurationMinutes,
} from "@/lib/routing/format";
import type { RideRoute } from "@/lib/routing/types";
import { cn } from "@/lib/utils";

export function RouteItinerary({
  route,
  departureTime,
  meetingPoint,
}: {
  route: RideRoute | null;
  departureTime: string;
  meetingPoint?: string | null;
}) {
  const t = useTranslations("ride");
  const time = departureTime.slice(0, 5);

  if (!route || route.points.length === 0) return null;

  const times: string[] = [time];
  if (route.legs.length === route.points.length - 1 && route.duration_s != null) {
    let acc = 0;
    for (const leg of route.legs) {
      acc += leg.duration_s;
      times.push(addMinutesToTime(time, acc / 60));
    }
  }

  return (
    <ol className="flex flex-col gap-0 px-4 py-4 md:px-5">
      {route.points.map((point, index) => {
        const isLast = index === route.points.length - 1;
        const isFirst = index === 0;
        const leg = !isLast ? route.legs[index] : null;
        const pointTime = times[index] || "";

        return (
          <li key={`${point.kind}-${point.name}-${index}`} className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex w-4 shrink-0 flex-col items-center pt-1.5">
                <span
                  className={cn(
                    "rounded-full",
                    isFirst && "size-3 border-2 border-green bg-sand",
                    point.kind === "stop" && "size-2 bg-ink",
                    isLast && "size-3 bg-green"
                  )}
                />
                {!isLast && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="break-words text-[15px] font-semibold tracking-[-0.015em] text-ink">
                    {point.name}
                  </p>
                  {pointTime ? (
                    <time className="shrink-0 font-mono text-sm tabular-nums text-muted">
                      {pointTime}
                    </time>
                  ) : null}
                </div>
                {isFirst && meetingPoint ? (
                  <p className="mt-1 flex items-start gap-1.5 text-[13px] leading-snug text-muted">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.6} />
                    <span>
                      <span className="text-faint">{t("pickupPoint")}: </span>
                      {meetingPoint}
                    </span>
                  </p>
                ) : null}
                {point.kind === "stop" ? (
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    {t("via")}
                  </p>
                ) : null}
              </div>
            </div>
            {leg && (leg.distance_m > 0 || leg.duration_s > 0) ? (
              <p className="mb-2 ml-7 font-mono text-[11px] tabular-nums text-faint">
                {formatDistanceKm(leg.distance_m)} · {formatDurationMinutes(leg.duration_s / 60)}
              </p>
            ) : !isLast ? (
              <div className="h-3" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function RouteJourneyStrip({
  route,
  departureTime,
}: {
  route: RideRoute | null;
  departureTime: string;
}) {
  if (!route || route.distance_m == null || route.duration_s == null) return null;
  const start = departureTime.slice(0, 5);
  const end = addMinutesToTime(start, route.duration_s / 60);
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5 font-mono text-[12px] tabular-nums text-muted md:hidden">
      <span className="text-ink">{start}</span>
      <span>{formatDurationMinutes(route.duration_s / 60)}</span>
      <span>{formatDistanceKm(route.distance_m)}</span>
      {end ? <span className="text-ink">{end}</span> : null}
    </p>
  );
}
