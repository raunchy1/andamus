"use client";

import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load the RouteMap component
const RouteMap = lazy(() => import("./RouteMap").then(mod => ({ default: mod.RouteMap })));

interface DynamicRouteMapProps {
  fromCity: string;
  toCity: string;
  height?: string;
}

function MapLoading() {
  return (
    <div className="w-full h-full min-h-[300px] bg-[#1e2a4a] rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#e63946]" />
        <span className="text-white/60 text-sm">Caricamento mappa...</span>
      </div>
    </div>
  );
}

export default function DynamicRouteMap({ fromCity, toCity, height }: DynamicRouteMapProps) {
  return (
    <Suspense fallback={<MapLoading />}>
      <RouteMap fromCity={fromCity} toCity={toCity} height={height} />
    </Suspense>
  );
}
