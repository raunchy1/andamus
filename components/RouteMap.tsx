"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import Image from "next/image";
import { MapPin, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SARDINIA_CITIES,
  darkMapStyles,
  MAP_ACCENT,
  MAP_MUTED,
  staticMapDarkStyleQuery,
} from "@/lib/sardinia-cities";

interface RouteMapProps {
  fromCity: string;
  toCity: string;
  height?: string;
}

const center = {
  lat: 40.1209,
  lng: 9.0129,
};

const mapOptions = {
  styles: darkMapStyles,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const ORIGIN_MARKER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='40' height='40'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='none' stroke='%238c8c87' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='none' stroke='%238c8c87' stroke-width='1.5'/%3E%3C/svg%3E`;

const DESTINATION_MARKER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='40' height='40'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='%234FB3C9'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='%230a0a0a'/%3E%3C/svg%3E`;

function RouteMapPlaceholder({
  fromCity,
  toCity,
  height,
  children,
}: {
  fromCity: string;
  toCity: string;
  height: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden rounded-[var(--radius)] border border-line bg-surface"
      style={{ height }}
    >
      <div className="absolute inset-0 opacity-[0.035]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, var(--accent) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 px-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-6 sm:gap-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-muted bg-transparent">
              <span className="size-2.5 rounded-full border border-muted bg-transparent" />
            </div>
            <p className="text-base font-semibold text-fg">{fromCity}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-px w-16 bg-accent sm:w-20" />
            <Navigation className="my-1.5 size-4 text-accent" strokeWidth={1.5} />
            <div className="h-px w-16 bg-accent sm:w-20" />
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-accent/10">
              <span className="size-2.5 rounded-full bg-accent" />
            </div>
            <p className="text-base font-semibold text-fg">{toCity}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RouteMap({ fromCity, toCity, height = "400px" }: RouteMapProps) {
  const t = useTranslations("map");
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const calculateRoute = useCallback(() => {
    if (!isLoaded) return;

    const fromCoords = SARDINIA_CITIES[fromCity];
    const toCoords = SARDINIA_CITIES[toCity];

    if (!fromCoords || !toCoords) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: fromCoords.lat, lng: fromCoords.lng },
        destination: { lat: toCoords.lat, lng: toCoords.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);

          const route = result.routes[0];
          if (route.legs[0]) {
            setDistance(route.legs[0].distance?.text || "");
            setDuration(route.legs[0].duration?.text || "");
          }
        }
      }
    );
  }, [isLoaded, fromCity, toCity]);

  useEffect(() => {
    if (isLoaded) {
      calculateRoute();
    }
  }, [isLoaded, calculateRoute]);

  if (loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <RouteMapPlaceholder fromCity={fromCity} toCity={toCity} height={height}>
        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <p className="text-sm text-dim">{t("addApiKey")}</p>
        )}
      </RouteMapPlaceholder>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-[var(--radius)] border border-line bg-surface"
        style={{ height }}
      >
        <div className="flex items-center gap-3 text-muted">
          <div className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" />
          <span className="font-mono text-sm">{t("loadingMap")}</span>
        </div>
      </div>
    );
  }

  const fromCoords = SARDINIA_CITIES[fromCity];
  const toCoords = SARDINIA_CITIES[toCity];

  if (!fromCoords || !toCoords) {
    return (
      <RouteMapPlaceholder fromCity={fromCity} toCity={toCity} height={height}>
        <p className="text-sm text-muted">{t("noCoordinates")}</p>
      </RouteMapPlaceholder>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-line">
      {(distance || duration) && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {distance && (
            <div className="rounded-full border border-line bg-elevated/90 px-4 py-2 font-mono text-sm text-fg backdrop-blur">
              {distance}
            </div>
          )}
          {duration && (
            <div className="rounded-full border border-line bg-elevated/90 px-4 py-2 font-mono text-sm text-accent backdrop-blur">
              {duration}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10">
        <div className="rounded-[var(--radius-sm)] border border-line bg-elevated/90 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border border-muted bg-transparent" />
            <span className="text-sm font-medium text-fg">{fromCity}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <div className="rounded-[var(--radius-sm)] border border-line bg-elevated/90 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="text-sm font-medium text-fg">{toCity}</span>
          </div>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={center}
        zoom={8}
        options={mapOptions}
      >
        <Marker
          position={{ lat: fromCoords.lat, lng: fromCoords.lng }}
          icon={{
            url: ORIGIN_MARKER_SVG,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          }}
        />

        <Marker
          position={{ lat: toCoords.lat, lng: toCoords.lng }}
          icon={{
            url: DESTINATION_MARKER_SVG,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          }}
        />

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: MAP_ACCENT,
                strokeWeight: 4,
                strokeOpacity: 0.85,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

interface MiniMapProps {
  fromCity: string;
  toCity: string;
}

export function MiniMap({ fromCity, toCity }: MiniMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center rounded-[var(--radius)] border border-line bg-surface">
        <div className="flex items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded-full border border-muted bg-transparent">
            <MapPin className="size-4 text-muted" strokeWidth={1.5} />
          </div>
          <div className="h-0.5 w-12 bg-accent" />
          <div className="flex size-8 items-center justify-center rounded-full bg-accent/10">
            <MapPin className="size-4 text-accent" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    );
  }

  const from = SARDINIA_CITIES[fromCity];
  const to = SARDINIA_CITIES[toCity];

  if (!from || !to) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center rounded-[var(--radius)] border border-line bg-surface">
        <p className="font-mono text-xs text-dim">Mappa non disponibile</p>
      </div>
    );
  }

  const centerLat = (from.lat + to.lat) / 2;
  const centerLng = (from.lng + to.lng) / 2;

  const latDiff = Math.abs(from.lat - to.lat);
  const lngDiff = Math.abs(from.lng - to.lng);
  const maxDiff = Math.max(latDiff, lngDiff);
  const zoom = maxDiff > 2 ? 7 : maxDiff > 1 ? 8 : 9;

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=400x200&maptype=roadmap&markers=color:0x8c8c87%7Clabel:A%7C${from.lat},${from.lng}&markers=color:0x4FB3C9%7Clabel:B%7C${to.lat},${to.lng}&key=${apiKey}&${staticMapDarkStyleQuery}`;

  return (
    <div className="relative h-[120px] w-full overflow-hidden rounded-[var(--radius)] border border-line">
      <Image
        src={mapUrl}
        alt={`Mappa da ${fromCity} a ${toCity}`}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-muted bg-transparent" />
        <span className="text-xs font-medium text-fg drop-shadow-lg">{fromCity}</span>
      </div>
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-accent" />
        <span className="text-xs font-medium text-fg drop-shadow-lg">{toCity}</span>
      </div>
    </div>
  );
}