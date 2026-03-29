"use client";

import { Suspense, lazy } from "react";
import { Cloud } from "lucide-react";

// Lazy load the WeatherWidget component
const WeatherWidget = lazy(() => import("./WeatherWidget").then(mod => ({ default: mod.WeatherWidget })));

interface DynamicWeatherWidgetProps {
  city: string;
  date: string;
  variant?: "compact" | "full";
}

function WeatherLoading({ variant }: { variant?: "compact" | "full" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <Cloud className="h-4 w-4" />
        <span className="text-sm">--°C</span>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function DynamicWeatherWidget({ city, date, variant }: DynamicWeatherWidgetProps) {
  return (
    <Suspense fallback={<WeatherLoading variant={variant} />}>
      <WeatherWidget city={city} date={date} variant={variant} />
    </Suspense>
  );
}
