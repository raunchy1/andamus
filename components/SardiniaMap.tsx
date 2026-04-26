"use client";

import { useState } from "react";

const CITIES = [
  { name: "Sassari",     cx: "30%", cy: "25%", major: true },
  { name: "Olbia",       cx: "75%", cy: "20%", major: true },
  { name: "Alghero",     cx: "15%", cy: "30%", major: false },
  { name: "Nuoro",       cx: "65%", cy: "40%", major: true },
  { name: "Oristano",    cx: "25%", cy: "55%", major: false },
  { name: "Cagliari",    cx: "55%", cy: "85%", major: true },
  { name: "Tortolì",     cx: "80%", cy: "58%", major: false },
  { name: "Carbonia",    cx: "30%", cy: "88%", major: false },
];

const ROUTES = [
  ["30%", "25%", "75%", "20%"],   // Sassari → Olbia
  ["30%", "25%", "25%", "55%"],   // Sassari → Oristano
  ["25%", "55%", "55%", "85%"],   // Oristano → Cagliari
  ["75%", "20%", "65%", "40%"],   // Olbia → Nuoro
  ["65%", "40%", "55%", "85%"],   // Nuoro → Cagliari
  ["65%", "40%", "80%", "58%"],   // Nuoro → Tortolì
  ["55%", "85%", "30%", "88%"],   // Cagliari → Carbonia
];

interface SardiniaMapProps {
  className?: string;
  mode?: "mobile" | "desktop";
  onRouteClick?: (e: React.MouseEvent, from: string, to: string) => void;
  onCityClick?: (city: string) => void;
}

export function SardiniaMap({
  className,
  mode = "desktop",
  onRouteClick,
  onCityClick,
}: SardiniaMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const isMobile = mode === "mobile";

  const cityByName = (name: string) => CITIES.find((c) => c.name === name);

  return (
    <div className={`bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 ${className || ""}`}>
      <svg
        viewBox="0 0 100 100"
        className={isMobile ? "w-full h-full" : "w-full h-auto"}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Island outline — approximate Sardinia shape */}
        <path
          d="M 35,5 Q 45,3 55,6 Q 70,8 78,15 Q 85,20 83,30 Q 88,38 85,48 Q 90,55 85,65 Q 82,73 75,78 Q 68,88 60,92 Q 52,96 45,93 Q 35,90 28,83 Q 20,75 18,65 Q 12,55 15,45 Q 12,35 18,25 Q 22,15 30,10 Z"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.8"
        />

        {/* Route lines */}
        {ROUTES.map(([x1, y1, x2, y2], i) => {
          const fromCity = CITIES.find((c) => c.cx === x1 && c.cy === y1);
          const toCity = CITIES.find((c) => c.cx === x2 && c.cy === y2);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#e63946"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.85"
              className="cursor-pointer"
              onClick={(e) => {
                if (fromCity && toCity) {
                  onRouteClick?.(e, fromCity.name, toCity.name);
                }
              }}
            />
          );
        })}

        {/* City dots + labels */}
        {CITIES.map((city) => (
          <g
            key={city.name}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredCity(city.name)}
            onMouseLeave={() => setHoveredCity(null)}
            onClick={() => onCityClick?.(city.name)}
          >
            {/* Glow ring for major cities */}
            {city.major && (
              <circle
                cx={city.cx}
                cy={city.cy}
                r="2.5"
                fill="none"
                stroke="#e63946"
                strokeWidth="0.5"
                opacity={hoveredCity === city.name ? "0.8" : "0.4"}
              />
            )}
            {/* Dot */}
            <circle
              cx={city.cx}
              cy={city.cy}
              r={city.major ? "1.5" : "1"}
              fill={city.major ? "#e63946" : "transparent"}
              stroke="#e63946"
              strokeWidth="0.6"
            />
            {/* Label */}
            <text
              x={parseFloat(city.cx) + 3 + "%"}
              y={city.cy}
              dominantBaseline="middle"
              fill="white"
              fontSize={city.major ? "4" : "3"}
              fontWeight={city.major ? "600" : "400"}
              opacity={hoveredCity === city.name ? "1" : "0.9"}
              fontFamily="Inter, sans-serif"
            >
              {city.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
