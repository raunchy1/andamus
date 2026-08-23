"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Car, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface CatalogEntry {
  model_id: string;
  make_id: string;
  make_name: string;
  model_name: string;
  label: string;
  image_url: string | null;
  image_author: string | null;
  image_license: string | null;
  image_source_url: string | null;
}

/** Commons serves any width from the same canonical URL. */
export const commonsThumb = (url: string, width = 640) =>
  url.includes("/storage/v1/") ? url : `${url}?width=${width}`;

/** Photos still served from Commons must not be proxied by our optimizer:
 *  Commons rate-limits server-side fetches, browsers it serves fine. */
export const isMirrored = (url: string) => url.includes("/storage/v1/");

interface Props {
  value: CatalogEntry | null;
  /** Free text kept from before the catalog existed, shown until they re-pick. */
  fallbackLabel?: string | null;
  onChange: (entry: CatalogEntry | null) => void;
}

export function VehiclePicker({ value, fallbackLabel, onChange }: Props) {
  const t = useTranslations("vehicles");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/catalog?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {value.image_url ? (
          <div className="relative bg-sand-deep" style={{ aspectRatio: "16 / 9" }}>
            <Image
              src={commonsThumb(value.image_url, 800)}
              alt={value.label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
              unoptimized={!isMirrored(value.image_url)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center bg-sand-deep" style={{ aspectRatio: "16 / 9" }}>
            <Car className="h-6 w-6 text-muted" strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-heading text-lg text-ink">{value.label}</p>
            {value.image_author && (
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {t("photoCredit", { author: value.image_author })}
                {value.image_license ? ` · ${value.image_license}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-sand hover:text-ink"
            aria-label={t("changeVehicle")}
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 focus-within:border-green">
        <Search className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={fallbackLabel || t("searchPlaceholder")}
          className="min-h-[44px] flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" strokeWidth={1.5} aria-hidden />}
      </div>

      {open && query.trim() !== "" && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-surface shadow-lg">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-sm text-muted">{t("noMatch")}</p>
          ) : (
            results.map((entry) => (
              <button
                key={entry.model_id}
                type="button"
                onClick={() => {
                  onChange(entry);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-line-soft px-4 py-3 text-left last:border-b-0 hover:bg-sand"
              >
                <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-deep">
                  {entry.image_url ? (
                    <Image
                      src={commonsThumb(entry.image_url, 320)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized={!isMirrored(entry.image_url)}
                    />
                  ) : (
                    <Car
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-muted"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{entry.model_name}</span>
                  <span className="block truncate text-xs text-muted">{entry.make_name}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
