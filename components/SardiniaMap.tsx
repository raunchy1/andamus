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

const CITIES: City[] = [
  { id: "cagliari", name: "Cagliari", x: 291, y: 555, labelOffset: { x: 10, y: 4 } },
  { id: "sassari", name: "Sassari", x: 138, y: 103, labelOffset: { x: -60, y: 4 } },
  { id: "olbia", name: "Olbia", x: 403, y: 132, labelOffset: { x: 10, y: -8 } },
  { id: "nuoro", name: "Nuoro", x: 385, y: 267, labelOffset: { x: 10, y: -10 } },
  { id: "oristano", name: "Oristano", x: 124, y: 375, labelOffset: { x: -65, y: 4 } },
  { id: "tortoli", name: "Tortoli", x: 450, y: 367, labelOffset: { x: 10, y: 12 } },
  { id: "alghero", name: "Alghero", x: 53, y: 200, labelOffset: { x: -62, y: -8 } },
  { id: "carbonia", name: "Carbonia", x: 124, y: 571, labelOffset: { x: -65, y: 4 } },
];

const ROUTES: RouteInfo[] = [
  { id: "cagliari-nuoro", from: "cagliari", to: "nuoro", d: "M291,555 C310,450 350,350 385,267", length: 290, distance: "~180 km", duration: "~2h 15m", delay: 0 },
  { id: "cagliari-tortoli", from: "cagliari", to: "tortoli", d: "M291,555 C340,500 400,430 450,367", length: 210, distance: "~150 km", duration: "~2h", delay: 0.3 },
  { id: "cagliari-olbia", from: "cagliari", to: "olbia", d: "M291,555 C320,400 370,260 403,132", length: 425, distance: "~270 km", duration: "~3h 15m", delay: 0.6 },
  { id: "nuoro-sassari", from: "nuoro", to: "sassari", d: "M385,267 C300,220 210,160 138,103", length: 260, distance: "~130 km", duration: "~1h 45m", delay: 0.9 },
  { id: "olbia-sassari", from: "olbia", to: "sassari", d: "M403,132 C310,140 220,120 138,103", length: 275, distance: "~100 km", duration: "~1h 15m", delay: 1.2 },
  { id: "tortoli-olbia", from: "tortoli", to: "olbia", d: "M450,367 C440,280 420,200 403,132", length: 250, distance: "~150 km", duration: "~1h 50m", delay: 1.5 },
  { id: "cagliari-oristano", from: "cagliari", to: "oristano", d: "M291,555 C240,500 180,440 124,375", length: 200, distance: "~100 km", duration: "~1h 20m", delay: 1.8 },
  { id: "sassari-alghero", from: "sassari", to: "alghero", d: "M138,103 C110,130 80,165 53,200", length: 130, distance: "~35 km", duration: "~35m", delay: 2.1 },
  { id: "cagliari-carbonia", from: "cagliari", to: "carbonia", d: "M291,555 C230,560 175,565 124,571", length: 170, distance: "~70 km", duration: "~1h", delay: 2.4 },
  { id: "oristano-sassari", from: "oristano", to: "sassari", d: "M124,375 C120,290 125,190 138,103", length: 275, distance: "~110 km", duration: "~1h 30m", delay: 2.7 },
];

const SARDINIA_COAST =
  "M 218,21" +
  " C 230,15 250,12 271,13" +
  " C 290,15 305,18 329,24" +
  " C 345,28 360,30 374,32" +
  " C 385,30 395,35 403,42" +
  " C 412,50 420,60 430,72" +
  " C 438,85 445,98 447,110" +
  " C 445,120 435,130 426,128" +
  " C 418,126 408,125 403,130" +
  " C 408,140 418,155 430,175" +
  " C 440,192 448,210 453,235" +
  " C 456,255 455,275 450,300" +
  " C 448,320 447,335 448,355" +
  " C 449,370 450,380 450,395" +
  " C 450,410 448,430 445,450" +
  " C 442,470 438,490 432,510" +
  " C 426,530 420,545 418,560" +
  " C 416,575 413,600 410,625" +
  " C 408,635 406,640 403,642" +
  " C 395,640 385,636 370,630" +
  " C 355,624 340,618 325,612" +
  " C 310,608 300,600 295,590" +
  " C 290,580 285,570 280,560" +
  " C 270,565 255,575 241,590" +
  " C 230,600 218,612 203,625" +
  " C 195,630 188,632 180,630" +
  " C 165,625 148,618 135,610" +
  " C 120,600 108,590 100,578" +
  " C 90,565 82,550 78,535" +
  " C 74,520 72,505 73,490" +
  " C 75,475 78,460 82,445" +
  " C 86,430 92,415 100,400" +
  " C 108,385 118,372 130,362" +
  " C 138,355 135,345 125,338" +
  " C 115,328 105,318 98,305" +
  " C 90,290 85,275 82,260" +
  " C 78,245 74,230 72,215" +
  " C 68,200 60,185 53,172" +
  " C 48,160 44,148 42,138" +
  " C 42,125 45,110 52,98" +
  " C 60,85 72,72 88,60" +
  " C 105,48 128,38 155,30" +
  " C 175,24 198,22 218,21 Z";

const SAN_PIETRO = "M 42,570 C 45,565 52,563 57,565 C 62,567 63,573 60,578 C 57,583 50,584 45,581 C 41,578 40,574 42,570 Z";
const SANT_ANTIOCO = "M 82,590 C 85,584 92,580 100,582 C 108,584 112,590 110,596 C 108,602 100,606 93,604 C 86,602 82,596 82,590 Z";

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
    const isConnectedToSelected = selectedCity && (route.from === selectedCity || route.to === selectedCity);
    return { isHighlighted, isHovered, isConnectedToSelected };
  };

  const handleRouteEnter = (e: React.MouseEvent, route: RouteInfo) => {
    setHoveredRoute(route.id);
    setTooltip({ x: e.clientX + 12, y: e.clientY - 24, text: `${capitalize(route.from)} \u2192 ${capitalize(route.to)} \u00b7 ${route.distance} \u00b7 ${route.duration}` });
  };

  const handleRouteMove = (e: React.MouseEvent) => {
    if (!tooltip) return;
    setTooltip((t) => (t ? { ...t, x: e.clientX + 12, y: e.clientY - 24 } : null));
  };

  const handleRouteLeave = () => { setHoveredRoute(null); setTooltip(null); };

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
      role="img"
      aria-label="Mappa interattiva della Sardegna con le rotte Andamus"
    >
      <svg viewBox="0 0 500 650" className="w-full h-auto drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="cityGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="islandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="50%" stopColor="#181818" />
            <stop offset="100%" stopColor="#141414" />
          </linearGradient>
        </defs>

        <motion.path d={SARDINIA_COAST} fill="url(#islandGradient)" stroke="#2a2a2a" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
        <path d={SARDINIA_COAST} fill="none" stroke="#ffffff" strokeOpacity={0.03} strokeWidth={10} />
        <path d={SAN_PIETRO} fill="url(#islandGradient)" stroke="#2a2a2a" strokeWidth={1} />
        <path d={SANT_ANTIOCO} fill="url(#islandGradient)" stroke="#2a2a2a" strokeWidth={1} />

        <g>
          {ROUTES.map((route) => {
            const { isHighlighted, isHovered, isConnectedToSelected } = getRouteStatus(route);
            const active = isHighlighted || isHovered || isConnectedToSelected;
            const sw = active ? (isMobile ? 3.5 : 5) : isMobile ? 2 : 3;
            const sc = active ? "#ffb3b1" : "#e63946";
            const op = active ? 1 : 0.6;
            return (
              <motion.path key={route.id} d={route.d} fill="none" stroke={sc} strokeWidth={sw} strokeOpacity={op} strokeLinecap="round" filter={active ? "url(#routeGlow)" : undefined} className="cursor-pointer" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: animationsReady ? 1 : 0, opacity: op }} transition={{ pathLength: { duration: 1.5, ease: "easeOut", delay: route.delay * 0.5 }, opacity: { duration: 0.3 } }} whileHover={{ strokeWidth: sw + 1 }} onMouseEnter={(e) => handleRouteEnter(e, route)} onMouseMove={handleRouteMove} onMouseLeave={handleRouteLeave} onClick={() => onRouteClick?.(route.id, route.from, route.to)} />
            );
          })}
        </g>

        <g>
          {visibleCities.map((city, index) => {
            const sel = selectedCity === city.id;
            return (
              <motion.g key={city.id} className="cursor-pointer" onClick={() => handleCityClick(city.id)} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 300, damping: 20 }}>
                <motion.circle cx={city.x} cy={city.y} r={sel ? (isMobile ? 12 : 16) : isMobile ? 8 : 11} fill="#e63946" opacity={sel ? 0.25 : 0.15} filter="url(#cityGlow)" />
                <motion.circle cx={city.x} cy={city.y} r={sel ? (isMobile ? 6 : 8) : isMobile ? 4 : 6} fill="#e63946" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.3} whileHover={{ scale: 1.2 }} />
                <text x={city.x + (city.labelOffset?.x ?? 8)} y={city.y + (city.labelOffset?.y ?? 4)} fill="#e5e2e1" fontSize={isMobile ? 10 : 12} fontWeight={700} letterSpacing={0.1} style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)", textTransform: "uppercase" }} className="font-sans pointer-events-none select-none">{city.name}</text>
              </motion.g>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="fixed z-50 px-4 py-2.5 rounded-xl bg-[#1c1b1b] border border-[#2a2a2a] text-[#e5e2e1] text-xs font-semibold shadow-2xl pointer-events-none backdrop-blur-sm" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.text}</motion.div>
      )}

      {isMobile && selectedCity && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-2 left-2 right-2 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-[#1c1b1b]/95 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 shadow-xl backdrop-blur-sm">Tocca un'altra citt\u00e0 per resettare</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}