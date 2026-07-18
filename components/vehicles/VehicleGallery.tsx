"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Car } from "lucide-react";
import type { VehicleImage } from "@/lib/types/vehicle";

interface VehicleGalleryProps {
  images: VehicleImage[];
  vehicleName?: string;
  onTrackView?: () => void;
}

export function VehicleGallery({
  images,
  vehicleName = "Veicolo",
  onTrackView,
}: VehicleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const sortedImages = [...images].sort(
    (a, b) => a.order_index - b.order_index
  );

  const openLightbox = useCallback(
    (index: number) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
      onTrackView?.();
    },
    [onTrackView]
  );

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prevLightbox = useCallback(
    () =>
      setLightboxIndex(
        (i) => (i - 1 + sortedImages.length) % sortedImages.length
      ),
    [sortedImages.length]
  );

  const nextLightbox = useCallback(
    () => setLightboxIndex((i) => (i + 1) % sortedImages.length),
    [sortedImages.length]
  );

  // Keyboard navigation while lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox, prevLightbox, nextLightbox]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (sortedImages.length === 0) {
    return (
      <div className="h-48 rounded-2xl bg-elevated flex flex-col items-center justify-center gap-2">
        <Car className="w-10 h-10 text-fg/20" aria-hidden="true" />
        <p className="text-xs text-fg/40">Nessuna foto disponibile</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Main gallery ─────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Primary image */}
        <div
          className="relative h-64 rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(activeIndex)}
          role="button"
          tabIndex={0}
          aria-label={`Apri galleria foto di ${vehicleName}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openLightbox(activeIndex);
          }}
        >
          <Image
            src={sortedImages[activeIndex].url}
            alt={vehicleName}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full select-none">
            {activeIndex + 1} / {sortedImages.length}
          </div>
        </div>

        {/* Thumbnail strip */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar pb-1">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Foto ${idx + 1}`}
                aria-current={idx === activeIndex ? "true" : undefined}
                className={`relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  idx === activeIndex
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-surface"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.thumbnail_url ?? img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Galleria foto ${vehicleName}`}
        >
          {/* Close button */}
          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={closeLightbox}
            aria-label="Chiudi galleria"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* Prev / Next */}
          {sortedImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightbox();
                }}
                aria-label="Foto precedente"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden="true" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightbox();
                }}
                aria-label="Foto successiva"
              >
                <ChevronRight className="w-6 h-6" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Full-size image */}
          <div
            className="relative max-w-3xl w-full max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={sortedImages[lightboxIndex].url}
              alt={`${vehicleName} — foto ${lightboxIndex + 1} di ${sortedImages.length}`}
              width={900}
              height={600}
              className="object-contain w-full max-h-[85vh] rounded-xl"
              priority
            />
          </div>

          {/* Dot indicators */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {sortedImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                  }}
                  aria-label={`Vai alla foto ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                    idx === lightboxIndex
                      ? "bg-white w-4"
                      : "bg-white/40 hover:bg-white/70 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
