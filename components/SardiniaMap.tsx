"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDeviceType } from "./view-mode";

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

// Geographically accurate city positions on the 500x650 viewBox (real Sardinia shape)
const CITIES: City[] = [
  { id: "cagliari", name: "Cagliari", x: 288, y: 532, labelOffset: { x: 10, y: 4 } },
  { id: "sassari", name: "Sassari", x: 136, y: 162, labelOffset: { x: -55, y: 4 } },
  { id: "olbia", name: "Olbia", x: 389, y: 113, labelOffset: { x: 8, y: -8 } },
  { id: "nuoro", name: "Nuoro", x: 344, y: 261, labelOffset: { x: 10, y: -10 } },
  { id: "oristano", name: "Oristano", x: 146, y: 364, labelOffset: { x: -65, y: 4 } },
  { id: "tortoli", name: "Tortolì", x: 432, y: 358, labelOffset: { x: 8, y: 12 } },
  { id: "alghero", name: "Alghero", x: 90, y: 188, labelOffset: { x: -62, y: -8 } },
  { id: "carbonia", name: "Carbonia", x: 202, y: 522, labelOffset: { x: -65, y: 4 } },
];

const ROUTES: RouteInfo[] = [
  {
    id: "cagliari-nuoro",
    from: "cagliari",
    to: "nuoro",
    d: "M288,532 Q316,397 344,261",
    length: 280,
    distance: "~180 km",
    duration: "~2h 15m",
    delay: 0,
  },
  {
    id: "cagliari-tortoli",
    from: "cagliari",
    to: "tortoli",
    d: "M288,532 Q360,445 432,358",
    length: 200,
    distance: "~150 km",
    duration: "~2h",
    delay: 0.3,
  },
  {
    id: "cagliari-olbia",
    from: "cagliari",
    to: "olbia",
    d: "M288,532 Q338,323 389,113",
    length: 420,
    distance: "~270 km",
    duration: "~3h 15m",
    delay: 0.6,
  },
  {
    id: "nuoro-sassari",
    from: "nuoro",
    to: "sassari",
    d: "M344,261 Q240,212 136,162",
    length: 245,
    distance: "~130 km",
    duration: "~1h 45m",
    delay: 0.9,
  },
  {
    id: "olbia-sassari",
    from: "olbia",
    to: "sassari",
    d: "M389,113 Q263,138 136,162",
    length: 280,
    distance: "~100 km",
    duration: "~1h 15m",
    delay: 1.2,
  },
  {
    id: "tortoli-olbia",
    from: "tortoli",
    to: "olbia",
    d: "M432,358 Q410,236 389,113",
    length: 260,
    distance: "~150 km",
    duration: "~1h 50m",
    delay: 1.5,
  },
  {
    id: "cagliari-oristano",
    from: "cagliari",
    to: "oristano",
    d: "M288,532 Q217,448 146,364",
    length: 195,
    distance: "~100 km",
    duration: "~1h 20m",
    delay: 1.8,
  },
  {
    id: "sassari-alghero",
    from: "sassari",
    to: "alghero",
    d: "M136,162 Q113,175 90,188",
    length: 75,
    distance: "~35 km",
    duration: "~35m",
    delay: 2.1,
  },
];

// Real Sardinia coastline path (500x650 viewBox) - accurate geographic shape
// Based on actual Sardinia island geography
const SARDINIA_PATH =
  "M 75,185 L 68,170 L 58,155 L 52,140 L 48,125 L 45,110 L 48,95 L 55,82 L 65,70 L 78,58 L 92,48 L 108,40 L 125,32 L 145,26 L 168,20 L 192,16 L 218,14 L 245,14 L 272,18 L 298,24 L 322,34 L 345,46 L 365,62 L 382,80 L 398,102 L 412,125 L 425,150 L 435,178 L 443,208 L 448,240 L 450,275 L 448,310 L 442,345 L 432,380 L 418,415 L 400,448 L 378,478 L 352,505 L 322,528 L 288,548 L 252,565 L 212,578 L 170,588 L 128,592 L 88,590 L 55,580 L 32,560 L 18,532 L 12,500 L 15,465 L 25,428 L 40,390 L 58,352 L 78,315 L 98,280 L 118,248 L 132,220 L 125,195 L 110,180 L 90,178 L 75,185 Z";

export function SardiniaMap({
  highlightedRoute,
  onRouteClick,
  mode: propMode,
  className = "",
}: SardiniaMapProps) {
  const deviceType = useDeviceType();
  const mode = propMode || deviceType || "desktop";
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
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${isMobile ? "max-h-[320px]" : "max-h-[520px]"} w-full overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 500 650"
        className="w-full h-auto drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cityGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="islandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="50%" stopColor="#181818" />
            <stop offset="100%" stopColor="#141414" />
          </linearGradient>
        </defs>

        {/* Background sea */}
        <rect width="500" height="600" fill="transparent" />

        {/* Island outline with gradient fill */}
        <motion.path
          d={SARDINIA_PATH}
          fill="url(#islandGradient)"
          stroke="#2a2a2a"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Inner highlight stroke for depth */}
        <path
          d={SARDINIA_PATH}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.03}
          strokeWidth={10}
        />

        {/* Routes */}
        <g>
          {ROUTES.map((route) => {
            const { isHighlighted, isHovered, isConnectedToSelected } = getRouteStatus(route);
            const active = isHighlighted || isHovered || isConnectedToSelected;
            const strokeWidth = active ? (isMobile ? 3.5 : 5) : isMobile ? 2 : 3;
            const strokeColor = active ? "#ffb3b1" : "#e63946";
            const opacity = active ? 1 : 0.6;
            const filter = active ? "url(#routeGlow)" : undefined;

            return (
              <motion.path
                key={route.id}
                d={route.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeLinecap="round"
                filter={filter}
                className="cursor-pointer"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: animationsReady ? 1 : 0,
                  opacity: opacity,
                }}
                transition={{
                  pathLength: { duration: 1.5, ease: "easeOut", delay: route.delay * 0.5 },
                  opacity: { duration: 0.3 },
                }}
                whileHover={{ strokeWidth: strokeWidth + 1 }}
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
          {visibleCities.map((city, index) => {
            const isSelected = selectedCity === city.id;
            return (
              <motion.g
                key={city.id}
                className="cursor-pointer"
                onClick={() => handleCityClick(city.id)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.8 + index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {/* Outer glow ring */}
                <motion.circle
                  cx={city.x}
                  cy={city.y}
                  r={isSelected ? (isMobile ? 12 : 16) : isMobile ? 8 : 11}
                  fill="#e63946"
                  opacity={0.15}
                  filter="url(#cityGlow)"
                  animate={{
                    r: isSelected ? (isMobile ? 12 : 16) : isMobile ? 8 : 11,
                    opacity: isSelected ? 0.25 : 0.15,
                  }}
                  transition={{ duration: 0.3 }}
                />
                {/* Core dot */}
                <motion.circle
                  cx={city.x}
                  cy={city.y}
                  r={isSelected ? (isMobile ? 6 : 8) : isMobile ? 4 : 6}
                  fill="#e63946"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                  animate={{
                    r: isSelected ? (isMobile ? 6 : 8) : isMobile ? 4 : 6,
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.2 }}
                />
                {/* Label */}
                <text
                  x={city.x + (city.labelOffset?.x ?? 8)}
                  y={city.y + (city.labelOffset?.y ?? 4)}
                  fill="#e5e2e1"
                  fontSize={isMobile ? 10 : 12}
                  fontWeight={700}
                  letterSpacing={0.1}
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)",
                    textTransform: "uppercase",
                  }}
                  className="font-sans pointer-events-none select-none"
                >
                  {city.name}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed z-50 px-4 py-2.5 rounded-xl bg-[#1c1b1b] border border-[#2a2a2a] text-[#e5e2e1] text-xs font-semibold shadow-2xl pointer-events-none backdrop-blur-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </motion.div>
      )}

      {/* Selected city hint (mobile only) */}
      {isMobile && selectedCity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-2 right-2 text-center"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-[#1c1b1b]/95 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 shadow-xl backdrop-blur-sm">
            Tocca un&apos;altra città per resettare
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
