"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useViewMode } from "./view-mode";

interface SardiniaMapProps {
  highlightedRoute?: string;
  onRouteClick?: (routeId: string, from: string, to: string) => void;
  mode?: "mobile" | "desktop";
  className?: string;
}

interface City {
  id: string;
  name: string;
  x: number;
  y: number;
  labelOffset?: { x: number; y: number };
}

interface RouteInfo {
  id: string;
  from: string;
  to: string;
  d: string;
  length: number;
  distance: string;
  duration: string;
  delay: number;
}

const CITIES: City[] = [
  { id: "cagliari", name: "Cagliari", x: 250, y: 525, labelOffset: { x: 8, y: 4 } },
  { id: "sassari", name: "Sassari", x: 128, y: 148, labelOffset: { x: -52, y: 4 } },
  { id: "olbia", name: "Olbia", x: 390, y: 98, labelOffset: { x: 8, y: -8 } },
  { id: "nuoro", name: "Nuoro", x: 348, y: 245, labelOffset: { x: 8, y: -8 } },
  { id: "oristano", name: "Oristano", x: 128, y: 345, labelOffset: { x: -62, y: 4 } },
  { id: "tortoli", name: "Tortolì", x: 435, y: 335, labelOffset: { x: 8, y: 4 } },
  { id: "alghero", name: "Alghero", x: 78, y: 175, labelOffset: { x: -58, y: -8 } },
  { id: "carbonia", name: "Carbonia", x: 178, y: 485, labelOffset: { x: -60, y: 4 } },
];

const ROUTES: RouteInfo[] = [
  {
    id: "cagliari-nuoro",
    from: "cagliari",
    to: "nuoro",
    d: "M250,525 Q285,400 348,245",
    length: 315,
    distance: "~180 km",
    duration: "~2h 15m",
    delay: 0,
  },
  {
    id: "cagliari-tortoli",
    from: "cagliari",
    to: "tortoli",
    d: "M250,525 Q320,450 435,335",
    length: 255,
    distance: "~150 km",
    duration: "~2h",
    delay: 0.3,
  },
  {
    id: "cagliari-olbia",
    from: "cagliari",
    to: "olbia",
    d: "M250,525 Q290,320 390,98",
    length: 490,
    distance: "~270 km",
    duration: "~3h 15m",
    delay: 0.6,
  },
  {
    id: "nuoro-sassari",
    from: "nuoro",
    to: "sassari",
    d: "M348,245 Q255,205 128,148",
    length: 265,
    distance: "~130 km",
    duration: "~1h 45m",
    delay: 0.9,
  },
  {
    id: "olbia-sassari",
    from: "olbia",
    to: "sassari",
    d: "M390,98 Q275,110 128,148",
    length: 290,
    distance: "~100 km",
    duration: "~1h 15m",
    delay: 1.2,
  },
  {
    id: "tortoli-olbia",
    from: "tortoli",
    to: "olbia",
    d: "M435,335 Q445,220 390,98",
    length: 280,
    distance: "~150 km",
    duration: "~1h 50m",
    delay: 1.5,
  },
  {
    id: "cagliari-oristano",
    from: "cagliari",
    to: "oristano",
    d: "M250,525 Q195,445 128,345",
    length: 235,
    distance: "~100 km",
    duration: "~1h 20m",
    delay: 1.8,
  },
  {
    id: "sassari-alghero",
    from: "sassari",
    to: "alghero",
    d: "M128,148 Q108,163 78,175",
    length: 55,
    distance: "~35 km",
    duration: "~35m",
    delay: 2.1,
  },
];

// Stylized but recognizable Sardinia coastline (500x600 viewBox)
const SARDINIA_PATH =
  "M75,105 Q95,80 115,62 L165,40 L220,32 L280,35 L335,52 Q360,65 382,82 L415,122 Q428,145 438,170 L450,225 L452,288 L445,352 Q438,385 428,415 L398,472 Q378,500 355,522 L300,555 Q270,565 240,570 L180,570 Q150,565 125,555 L80,518 Q62,490 48,465 L28,400 Q22,365 18,330 L18,258 Q20,222 25,188 L42,125 Q55,110 58,95 Z";

export function SardiniaMap({
  highlightedRoute,
  onRouteClick,
  mode: propMode,
  className = "",
}: SardiniaMapProps) {
  const { viewMode } = useViewMode();
  const mode = propMode || viewMode || "desktop";
  const isMobile = mode === "mobile";

  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [animationsReady, setAnimationsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimationsReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const visibleCities = useMemo(() => {
    if (isMobile) {
      return CITIES.filter((c) => ["cagliari", "sassari", "olbia", "nuoro"].includes(c.id));
    }
    return CITIES;
  }, [isMobile]);

  const getRouteStatus = (route: RouteInfo) => {
    const isHighlighted = highlightedRoute === route.id;
    const isHovered = hoveredRoute === route.id;
    const isConnectedToSelected =
      selectedCity && (route.from === selectedCity || route.to === selectedCity);
    return { isHighlighted, isHovered, isConnectedToSelected };
  };

  const handleRouteEnter = (e: React.MouseEvent, route: RouteInfo) => {
    setHoveredRoute(route.id);
    setTooltip({
      x: e.clientX + 12,
      y: e.clientY - 24,
      text: `${capitalize(route.from)} → ${capitalize(route.to)} • ${route.distance} • ${route.duration}`,
    });
  };

  const handleRouteMove = (e: React.MouseEvent) => {
    if (!tooltip) return;
    setTooltip((t) => (t ? { ...t, x: e.clientX + 12, y: e.clientY - 24 } : null));
  };

  const handleRouteLeave = () => {
    setHoveredRoute(null);
    setTooltip(null);
  };

  const handleCityClick = (cityId: string) => {
    setSelectedCity((prev) => (prev === cityId ? null : cityId));
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? "max-h-[320px]" : "max-h-[520px]"} w-full ${className}`}
    >
      <svg
        viewBox="0 0 500 600"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cityGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background sea */}
        <rect width="500" height="600" fill="transparent" />

        {/* Island outline */}
        <path
          d={SARDINIA_PATH}
          fill="#181818"
          stroke="#2a2a2a"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Inner highlight stroke for depth */}
        <path
          d={SARDINIA_PATH}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.04}
          strokeWidth={8}
        />

        {/* Routes */}
        <g>
          {ROUTES.map((route) => {
            const { isHighlighted, isHovered, isConnectedToSelected } = getRouteStatus(route);
            const active = isHighlighted || isHovered || isConnectedToSelected;
            const strokeWidth = active ? (isMobile ? 3 : 4.5) : isMobile ? 1.5 : 2.5;
            const strokeColor = active ? "#ffb3b1" : "#e63946";
            const opacity = active ? 1 : 0.55;
            const filter = active ? "url(#routeGlow)" : undefined;

            return (
              <path
                key={route.id}
                d={route.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeLinecap="round"
                filter={filter}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  strokeDasharray: route.length,
                  strokeDashoffset: animationsReady ? 0 : route.length,
                  transition: "stroke-dashoffset 2.2s ease-out, stroke-width 0.2s, stroke-opacity 0.2s",
                  transitionDelay: animationsReady ? `${route.delay}s` : "0s",
                }}
                onMouseEnter={(e) => handleRouteEnter(e, route)}
                onMouseMove={handleRouteMove}
                onMouseLeave={handleRouteLeave}
                onClick={() => onRouteClick?.(route.id, route.from, route.to)}
              />
            );
          })}
        </g>

        {/* City markers */}
        <g>
          {visibleCities.map((city) => {
            const isSelected = selectedCity === city.id;
            return (
              <g key={city.id} className="cursor-pointer" onClick={() => handleCityClick(city.id)}>
                {/* Glow ring */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={isSelected ? (isMobile ? 10 : 14) : isMobile ? 6 : 9}
                  fill="#e63946"
                  opacity={0.2}
                  filter="url(#cityGlow)"
                  className="transition-all duration-300"
                />
                {/* Core dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={isSelected ? (isMobile ? 5 : 7) : isMobile ? 3.5 : 5}
                  fill="#e63946"
                  className="transition-all duration-200"
                />
                {/* Label */}
                <text
                  x={city.x + (city.labelOffset?.x ?? 8)}
                  y={city.y + (city.labelOffset?.y ?? 4)}
                  fill="#e5e2e1"
                  fontSize={isMobile ? 9 : 11}
                  fontWeight={700}
                  letterSpacing={0.08}
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)", textTransform: "uppercase" }}
                  className="font-sans pointer-events-none select-none"
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-[#1c1b1b] border border-[#2a2a2a] text-[#e5e2e1] text-xs font-semibold shadow-xl pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Selected city hint (mobile only) */}
      {isMobile && selectedCity && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#1c1b1b]/90 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
            Tapă alt oraș pentru a reseta
          </span>
        </div>
      )}
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
