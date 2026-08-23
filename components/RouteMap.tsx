"use client";

import { useEffect, useRef } from "react";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./route-map.css";
import { Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RideRoute, RoutePoint } from "@/lib/routing/types";

interface RouteMapProps {
  fromCity: string;
  toCity: string;
  height?: string;
  route?: RideRoute | null;
}

const SARDINIA_CENTER: [number, number] = [9.0129, 40.1209];

const CARTO_POSITRON_STYLE: StyleSpecification = {
  version: 8,
  name: "Andamus Positron",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto", minzoom: 0, maxzoom: 19 }],
};

const LINE_UNDER = "#F4F1EA";
const LINE_GREEN = "#2D6A4F";

function RouteMapPlaceholder({
  fromCity,
  toCity,
  height,
  message,
}: {
  fromCity: string;
  toCity: string;
  height: string;
  message?: string;
}) {
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden bg-sand-deep"
      style={{ height }}
    >
      <div className="relative z-10 px-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-6">
          <p className="text-sm font-semibold text-fg">{fromCity}</p>
          <Navigation className="size-4 text-accent" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-fg">{toCity}</p>
        </div>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </div>
  );
}

function markerClass(kind: RoutePoint["kind"]): string {
  if (kind === "destination") return "route-marker route-marker--destination";
  if (kind === "stop") return "route-marker route-marker--stop";
  return "route-marker route-marker--origin";
}

function addMarkers(map: MapLibreMap, points: RoutePoint[]): Marker[] {
  return points.map((point) => {
    const el = document.createElement("div");
    el.className = markerClass(point.kind);
    el.innerHTML = `<span class="route-marker-pin"></span><span class="route-marker-label"></span>`;
    const label = el.querySelector(".route-marker-label");
    if (label) label.textContent = point.name;
    return new Marker({ element: el, anchor: "bottom" })
      .setLngLat([point.lng, point.lat])
      .addTo(map);
  });
}

function fitToRoute(map: MapLibreMap, route: RideRoute) {
  const bounds = new LngLatBounds();
  const coords = route.geometry?.coordinates;
  if (coords && coords.length > 1) {
    for (const [lng, lat] of coords) bounds.extend([lng, lat]);
  } else {
    for (const point of route.points) bounds.extend([point.lng, point.lat]);
  }
  if (bounds.isEmpty()) return;
  const height = map.getContainer().clientHeight;
  const pad = height < 280 ? 28 : 48;
  map.fitBounds(bounds, {
    padding: { top: pad, bottom: pad + 8, left: 36, right: 36 },
    maxZoom: 12,
    duration: 0,
  });
}

function downsample(
  coords: [number, number][],
  maxPoints = 360
): [number, number][] {
  if (coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    out.push(coords[Math.round(i * step)]);
  }
  out.push(coords[coords.length - 1]);
  return out;
}

function attachRouteSvg(map: MapLibreMap, route: RideRoute): () => void {
  const coords = route.geometry?.coordinates;
  if (!coords || coords.length < 2) return () => {};

  const samples = downsample(coords);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "route-svg-overlay");
  svg.setAttribute("aria-hidden", "true");
  const halo = document.createElementNS("http://www.w3.org/2000/svg", "path");
  halo.setAttribute("fill", "none");
  halo.setAttribute("stroke", "#F4F1EA");
  halo.setAttribute("stroke-width", "8");
  halo.setAttribute("stroke-linecap", "round");
  halo.setAttribute("stroke-linejoin", "round");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", LINE_GREEN);
  line.setAttribute("stroke-width", "3.5");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.append(halo, line);

  const host = map.getContainer();
  host.appendChild(svg);

  const redraw = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    const d = samples
      .map((coord, index) => {
        const point = map.project(coord);
        return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      })
      .join(" ");
    halo.setAttribute("d", d);
    line.setAttribute("d", d);
  };

  map.on("move", redraw);
  map.on("resize", redraw);
  redraw();

  return () => {
    map.off("move", redraw);
    map.off("resize", redraw);
    svg.remove();
  };
}

export function RouteMap({ fromCity, toCity, height = "320px", route }: RouteMapProps) {
  const t = useTranslations("map");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !route || route.points.length < 2) return;

    const map = new MapLibreMap({
      container: node,
      style: CARTO_POSITRON_STYLE,
      center: SARDINIA_CENTER,
      zoom: 7,
      minZoom: 5.5,
      maxZoom: 14,
      attributionControl: { compact: true },
      fadeDuration: 0,
      renderWorldCopies: false,
      cooperativeGestures: true,
      scrollZoom: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const markers: Marker[] = [];
    let detachSvg = () => {};

    const onLoad = () => {
      detachSvg = attachRouteSvg(map, route);
      markers.push(...addMarkers(map, route.points));
      map.resize();
      fitToRoute(map, route);
    };

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(node);

    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
      ro.disconnect();
      detachSvg();
      for (const marker of markers) marker.remove();
      map.remove();
    };
  }, [route]);

  if (!route || route.points.length < 2) {
    return (
      <RouteMapPlaceholder
        fromCity={fromCity}
        toCity={toCity}
        height={height}
        message={t("noCoordinates")}
      />
    );
  }

  return (
    <div
      className="route-map"
      style={{ height }}
      ref={containerRef}
      aria-label={`${fromCity} – ${toCity}`}
    />
  );
}

interface MiniMapProps {
  fromCity: string;
  toCity: string;
}

export function MiniMap({ fromCity, toCity }: MiniMapProps) {
  return (
    <div className="flex h-[120px] w-full items-center justify-center rounded-[var(--radius)] border border-line bg-surface">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-fg">{fromCity}</span>
        <span className="h-px w-10 bg-accent" />
        <span className="text-sm font-medium text-fg">{toCity}</span>
      </div>
    </div>
  );
}
