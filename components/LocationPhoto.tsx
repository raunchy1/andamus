"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { getLocationPhoto } from "@/lib/location-photos";

interface LocationPhotoProps {
  city: string;
  /** Small caption over the image — usually "partenza" / "arrivo". */
  label?: string;
  className?: string;
  /** Shows the photographer and licence under the image, as CC BY-SA requires. */
  credit?: boolean;
  priority?: boolean;
}

/**
 * A photo of the place, mirrored from Wikimedia Commons into our own bucket.
 * Towns with no usable photo fall back to their initial on sand — never a
 * picture of somewhere else.
 */
export function LocationPhoto({
  city,
  label,
  className,
  credit = false,
  priority = false,
}: LocationPhotoProps) {
  const photo = getLocationPhoto(city);
  // A mirrored file can be missing while the backfill is still running; the
  // monogram is the same fallback as for a town with no photo at all.
  const [failed, setFailed] = useState(false);
  const usable = photo && !failed ? photo : null;

  return (
    <figure className={cn("m-0 flex flex-col gap-1.5", className)}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-surface-2" style={{ aspectRatio: "8 / 5" }}>
        {usable ? (
          <Image
            src={usable.url}
            alt={city}
            fill
            sizes="(max-width: 640px) 50vw, 320px"
            priority={priority}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-2">
            <span className="text-3xl font-bold tracking-[-0.03em] text-faint">
              {city.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
          {label && (
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
              {label}
            </span>
          )}
          <span className="block truncate text-[15px] font-semibold text-white">{city}</span>
        </div>
      </div>

      {credit && usable?.author && (
        <figcaption className="truncate text-[10px] text-faint">
          {usable.source ? (
            <a href={usable.source} target="_blank" rel="noreferrer noopener" className="hover:text-muted">
              {usable.author}
            </a>
          ) : (
            usable.author
          )}
          {usable.license ? ` · ${usable.license}` : ""}
        </figcaption>
      )}
    </figure>
  );
}

/** The pair used wherever a trip is shown: departure on the left, arrival on the right. */
export function RoutePhotos({
  from,
  to,
  fromLabel,
  toLabel,
  credit = true,
  className,
}: {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  credit?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      <LocationPhoto city={from} label={fromLabel} credit={credit} priority />
      <LocationPhoto city={to} label={toLabel} credit={credit} />
    </div>
  );
}
