"use client";

import { useState, useMemo } from "react";

const SARDINIA_PATH = "m 89.77021,559.74051 0.55,0.96 2.26,-0.65 2.12,3.57 -1.14,5.62 -1.56,0.89 -2.8,-5.35 -0.56,-2.85 1.13,-2.19 z m -3.19,-4.53 -0.13,5.46 -1.62,0.38 -1.35,-0.95 0.05,-1.69 -1.54,-0.91 2.44,-2.24 2.15,-0.05 z m 73,-115.83 0.55,0.51 -2.49,1.59 -0.53,-0.41 2.76,-2.27 -0.29,0.58 z m -77.12,-3.89 -0.56,0.57 -0.06,-1 0.62,0.43 z m 4.81,-9.65 0.27,1.13 1.24,0.83 -0.73,0.74 -0.17,1.96 -2.73,-1.27 -2.18,3.03 0.66,-0.19 0.82,1.62 -0.47,1.37 -2.3,-0.29 0.99,-2.47 -0.63,-0.09 0.16,-1.12 1.48,-0.62 0.87,-1.6 0.96,-0.11 -0.54,-1.95 2.3,-0.97 z m 59.04,-8.33 0.86,1.53 -1.24,2.08 0.86,0.23 -2.3,0.35 1.09,-4.32 0.73,0.13 z m -6.73,-0.65 0.97,0.61 -1.06,0.94 0.09,-1.55 z m -5.67,-0.46 2.52,2.07 -0.75,1.88 1.06,1.11 2.45,-0.17 0.27,-1.28 1.25,-0.14 0.54,1.82 0.57,0.15 1.98,0.02 -0.98,1.27 1.26,0.22 0.9,1.38 -0.17,2.92 1.49,-2.26 -0.28,-1.15 2.49,0.14 0.31,-1.15 0.92,1.24 -0.56,0.33 0.98,0.06 -0.27,1.23 1.33,-0.06 0.26,1.12 -1,1.52 -0.55,-0.67 -0.39,0.37 0.29,1.44 -0.83,0.52 -0.77,2.98 0.77,-0.04 0.17,-1.35 1.76,-0.53 -0.53,2.25 1.32,0.06 -0.04,-0.82 0.46,0.3 0.49,-0.79 3.55,1.83 -0.7,0.74 -2.17,-1.11 -1.38,1.19 0.58,1.04 -1.29,1.73 0.33,0.93 -2.72,-0.4 -0.91,0.41 0.9,0.47 2.12,0.05 0.86,0.35 -0.38,0.41 0.97,1.14 1.48,-2.05 1.26,0.24 -1.48,1.88 2.24,1.11 -0.53,1.36 1.67,-0.37 2.1,1.45 -0.73,0.56 -1,-0.36 -0.41,0.97 0.57,0.77 -0.88,0.46 -0.14,1.26 2.36,2.34 -0.16,2.72 2,2.51 -0.61,2.56 0.64,2.55 1.84,1.72 0.28,1.81 1.66,1.04 -3.14,9.17 -3.94,3.36 -3.24,5.54 0,3.43 1.37,4.05 2.02,2.71 2.06,1.2 -0.02,1.66 -2.37,5.82 0.16,2.12 1.23,0.31 0.21,0.75 -1.83,1.85 0.74,3.17 -1.37,4.67 0.45,4.66 -1.64,4.03 0.53,5.51 -1.25,4.44 0.72,2.68 -2.47,7.5 0.31,2.11 1.48,1.21 -1.56,0.52 -1.07,1.64 -1,4.63 0.85,1.28 -1.08,2.98 -1.02,0 -0.92,1.13 0.13,1.3 -1,-0.84 0,-1.45 -0.95,-0.36 -2.42,0.82 -7.24,-5.97 -4.44,-0.93 -2.13,1.29 -0.48,1.71 -2.56,-2.06 -2.13,0.94 -2.54,3.16 -0.05,4.15 1.47,2.05 -1.25,4.73 -0.55,-0.55 -0.73,0.37 -7.09,7.14 -1.26,-0.05 -1,-1.31 -0.65,0.85 -1.28,-2.04 -2.78,-1.59 -0.17,1.04 -2.76,0.68 0.29,1.04 -1.09,0.55 0.5,1.33 -0.86,0.29 0.29,-2.01 -2.05,0.11 0.73,-3.3 -2.54,-2.31 -0.43,-4.26 -1.66,-0.96 -2.92,-0.06 0.46,-1.85 -0.71,-1.55 -0.64,-0.6 -1.1,0.59 -0.04,-2.91 -3.48,-3.73 -0.1,-0.98 2.99,-2.8 0.53,-1.38 -0.77,-2.71 -1.38,-0.49 -0.2,-1.71 -0.82,-0.68 1.98,-3.13 -0.05,-1.18 -1.49,-0.98 0.21,-1 3.41,-5.04 0.91,-3.68 -1.1,-2.15 0.44,-2.02 -0.62,-1.13 0.51,-1.6 -0.5,-3.33 0.68,-0.84 1.78,3.07 0.78,-0.06 0.34,-2.07 1.62,-2.76 0.4,-4.28 -1.52,-2.77 -2.41,-0.15 -1.91,1.96 -2.19,-2.07 -0.25,-4.49 1.03,-2.95 -1.82,-1.06 1.3,-1.08 0.5,0.7 2.14,-0.66 1.84,-1.96 0.08,-1.51 -1.77,-4.92 1.33,-7.34 -1.18,-2.26 -1.98,-1.15 -1.95,-0.11 -0.18,-1.44 1.14,-3.36 -1.43,-5.38 -1.81,-0.64 -1.94,-6.04 -2.71,0.54 -0.14,0.92 -2.04,0.05 -0.02,-1.76 0.75,-0.52 -1.09,-1.14 -1.81,2.85 -0.56,-0.18 -0.29,-2.99 2.05,-0.94 1.08,-3.18 -1.56,-0.67 -2.16,-2.46 1.75,-2.35 -0.28,-1.94 1.36,-1.18 1.84,-5.06 -2.4,-3.34 1.4,-2.4 1.72,1.24 -0.25,2.86 4.13,4.43 3.05,0.61 2.28,-0.38 1.94,1.42 5.44,-0.8 6.83,-5.52 5.01,-0.74 4.14,-4.71 -0.11,-1.31 3.08,-1.85 4.11,-5.58 1.65,-0.89 0.65,0.73 2.59,-0.5 0.61,-1.39 1.68,-0.07 0.82,-0.92 -0.76,-1.91 0.67,-2.18 -1.29,-0.22 0.15,-0.94 1.05,0.71 1.44,-0.77 0.06,0.92 1.83,-1.76 z m 9.68,-0.66 1.46,2.36 -0.43,1.15 -2.96,0.46 -0.45,-1.26 1.48,-1.12 -0.13,-1.1 0.69,0.74 0.34,-1.23 z";


// Real lat/lng mapped to SVG coordinates via linear regression on the island path:
// svgX = 49.75 * lng - 321.92
// svgY = -66.27 * lat + 3124.9
const cities = [
  { name: "Cagliari",     svgX: 131.9, svgY: 525.5, population: "154k", isCapital: true },
  { name: "Sassari",      svgX: 103.7, svgY: 428.5, population: "127k", isCapital: false },
  { name: "Olbia",        svgX: 150.6, svgY: 412.9, population: "60k",  isCapital: false },
  { name: "Nuoro",        svgX: 142.3, svgY: 452.9, population: "37k",  isCapital: false },
  { name: "Oristano",     svgX: 105.5, svgY: 480.3, population: "32k",  isCapital: false },
  { name: "Tortolì",      svgX: 158.6, svgY: 478.9, population: "11k",  isCapital: false },
  { name: "Alghero",      svgX: 92.0,  svgY: 437.1, population: "44k",  isCapital: false },
  { name: "Carbonia",     svgX: 102.0, svgY: 529.4, population: "28k",  isCapital: false },
  { name: "Iglesias",     svgX: 102.7, svgY: 519.7, population: "27k",  isCapital: false },
  { name: "La Maddalena", svgX: 145.9, svgY: 392.7, population: "11k",  isCapital: false },
  { name: "Tempio",       svgX: 131.3, svgY: 414.5, population: "14k",  isCapital: false },
];

interface RouteData {
  from: string;
  to: string;
  waypoints: { x: number; y: number }[];
}

const routes: RouteData[] = [
  { from: "Sassari",      to: "Alghero",      waypoints: [] },
  { from: "Sassari",      to: "Olbia",        waypoints: [] },
  { from: "Cagliari",     to: "Carbonia",     waypoints: [] },
  { from: "Cagliari",     to: "Oristano",     waypoints: [{ x: 118, y: 503 }] },
  { from: "Cagliari",     to: "Nuoro",        waypoints: [{ x: 137, y: 497 }, { x: 142, y: 475 }] },
  { from: "Oristano",     to: "Sassari",      waypoints: [{ x: 104, y: 454 }] },
  { from: "Nuoro",        to: "Sassari",      waypoints: [{ x: 122, y: 441 }] },
  { from: "Nuoro",        to: "Olbia",        waypoints: [{ x: 146, y: 433 }] },
  { from: "Nuoro",        to: "Tortolì",      waypoints: [{ x: 151, y: 466 }] },
  { from: "La Maddalena", to: "Olbia",        waypoints: [] },
  { from: "Tempio",       to: "Olbia",        waypoints: [] },
];

function buildRoutePath(
  fromCity: { svgX: number; svgY: number },
  toCity: { svgX: number; svgY: number },
  waypoints: { x: number; y: number }[]
): string {
  const startX = fromCity.svgX;
  const startY = fromCity.svgY;
  const endX = toCity.svgX;
  const endY = toCity.svgY;

  if (waypoints.length === 0) {
    return `M${startX},${startY} L${endX},${endY}`;
  }

  if (waypoints.length === 1) {
    const cp = waypoints[0];
    return `M${startX},${startY} Q${cp.x},${cp.y} ${endX},${endY}`;
  }

  if (waypoints.length === 2) {
    const cp1 = waypoints[0];
    const cp2 = waypoints[1];
    return `M${startX},${startY} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${endX},${endY}`;
  }

  let d = `M${startX},${startY}`;
  const allPts = [{ x: startX, y: startY }, ...waypoints, { x: endX, y: endY }];
  for (let i = 1; i < allPts.length - 1; i++) {
    const curr = allPts[i];
    const next = allPts[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q${curr.x},${curr.y} ${midX},${midY}`;
  }
  const last = allPts[allPts.length - 1];
  d += ` L${last.x},${last.y}`;
  return d;
}

interface SardiniaMapProps {
  className?: string;
  mode?: "mobile" | "desktop";
  onRouteClick?: (e: React.MouseEvent, from: string, to: string) => void;
  onCityClick?: (city: string) => void;
}

export function SardiniaMap({ className, mode = "desktop", onRouteClick, onCityClick }: SardiniaMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const isMobile = mode === "mobile";

  const cityMap = useMemo(() => {
    const map: Record<string, { svgX: number; svgY: number }> = {};
    cities.forEach((c) => { map[c.name] = { svgX: c.svgX, svgY: c.svgY }; });
    return map;
  }, []);

  return (
    <div className={`bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 ${className || ""}`}>
      <svg viewBox="25 375 160 210" className={isMobile ? "w-full h-full" : "w-full h-auto"} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.15">
          <line x1="25" y1="405" x2="185" y2="405" />
          <line x1="25" y1="435" x2="185" y2="435" />
          <line x1="25" y1="465" x2="185" y2="465" />
          <line x1="25" y1="495" x2="185" y2="495" />
          <line x1="25" y1="525" x2="185" y2="525" />
          <line x1="25" y1="555" x2="185" y2="555" />
          <line x1="65" y1="375" x2="65" y2="585" />
          <line x1="105" y1="375" x2="105" y2="585" />
          <line x1="145" y1="375" x2="145" y2="585" />
        </g>

        {/* Island shadow */}
        <g transform="translate(1.5, 1.5)">
          <path d={SARDINIA_PATH} fill="rgba(0,0,0,0.3)" />
        </g>

        {/* Island path (from @svg-maps/italy - real cartographic data) */}
        <path
          d={SARDINIA_PATH}
          fill="#1a1a1a"
          stroke="#333"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* SARDEGNA watermark */}
        <text
          x="105"
          y="490"
          fill="rgba(255,255,255,0.03)"
          fontSize="18"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="10"
          transform="rotate(-8, 105, 490)"
        >
          SARDEGNA
        </text>

        {/* Routes — clipped to island contour */}
        <defs>
          <clipPath id="sardinia-clip">
            <path d={SARDINIA_PATH} />
          </clipPath>
        </defs>

        <g clipPath="url(#sardinia-clip)">
          {routes.map((route, i) => {
            const from = cityMap[route.from];
            const to = cityMap[route.to];
            if (!from || !to) return null;

            const pathD = buildRoutePath(from, to, route.waypoints);

            return (
              <path
                key={`route-${i}`}
                d={pathD}
                fill="none"
                stroke="#e63946"
                strokeWidth="0.8"
                opacity="0.4"
                strokeDasharray="6 3"
                strokeLinecap="round"
                className="route-line cursor-pointer"
                onClick={(e) => onRouteClick?.(e, route.from, route.to)}
              />
            );
          })}
        </g>

        {/* Cities */}
        <g>
          {cities.map((city) => (
            <g
              key={city.name}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredCity(city.name);
                const rect = e.currentTarget.closest("svg")?.getBoundingClientRect();
                if (rect) {
                  const svgX = (city.svgX - 25) / 160 * rect.width;
                  const svgY = (city.svgY - 375) / 210 * rect.height;
                  setTooltipPos({ x: rect.left + svgX, y: rect.top + svgY });
                }
              }}
              onMouseLeave={() => setHoveredCity(null)}
              onClick={() => onCityClick?.(city.name)}
            >
              {/* Capital pulse */}
              {city.isCapital && (
                <circle
                  cx={city.svgX}
                  cy={city.svgY}
                  r="3"
                  fill="none"
                  stroke="#e63946"
                  strokeWidth="0.5"
                  opacity="0.4"
                >
                  <animate attributeName="r" values="3;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* City dot */}
              {city.isCapital ? (
                <circle cx={city.svgX} cy={city.svgY} r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="0.8" />
              ) : (
                <circle cx={city.svgX} cy={city.svgY} r="2.2" fill="#0a0a0a" stroke="#e63946" strokeWidth="0.8" />
              )}

              {/* City label */}
              <text
                x={city.svgX + 5}
                y={city.svgY + 1.5}
                fill="rgba(255,255,255,0.7)"
                fontSize="5"
                fontWeight="500"
              >
                {city.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Animated routes CSS */}
      <style>{`
        .route-line {
          animation: dashMove 2s linear infinite;
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -18; }
        }
      `}</style>

      {/* Tooltip */}
      {hoveredCity && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 30,
            background: "rgba(20,20,20,0.95)",
            border: "1px solid rgba(230,57,70,0.3)",
            color: "#e5e2e1",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {hoveredCity} &middot; Pop: {cities.find((c) => c.name === hoveredCity)?.population}
        </div>
      )}
    </div>
  );
}
