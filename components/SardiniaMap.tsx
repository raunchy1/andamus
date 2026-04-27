"use client";

import { useState, useMemo } from "react";

const SARDINIA_PATH = "M109.2,568.9L113,570.8L115.5,569.2L110.1,574.8L106.7,588.4L100.1,596.8L95.6,593.4L80.6,571.7L79.7,564.6L90.4,561.1L109.2,568.9Z M68.9,539.4L68.9,561.3L55.2,560.6L49.3,551.5L52.7,542.4Z M150.7,598.1L140.5,583.7L132.9,574.4L123.5,570.3L116.4,567.2L113.9,560.6L105.5,557.9L103.7,546.1L97.6,543.7L95.6,544.1L93.9,537.5L88.9,535.9L88,528.4L98.4,507.3L87.2,493.7L94.6,485.4L93.7,477L99.5,471.8L111.8,471.6L129.3,468.9L149.2,482.2L159.5,492.6L176.4,496.5L175,504.8L179.4,514.9L184.3,518.8L189.7,536.3L204.3,546.1L207.8,551.8L209.4,559.9L213,570.8L186.7,574.8L176.2,579.6L168,576.5L160.3,587.3Z M60.6,80.1L53,95.8L46.3,90.7L48.2,84L60.8,77.1L61.4,68.2L68.9,67.4L74.4,63.2L76,68.2L78.4,76Z M92.1,239.1L88.8,225.2L75.9,214.8L70.6,198.2L44.9,200L44.9,189.8L31.4,196.2L26.4,194.5L29.2,184.9L37.4,173L39.8,170.3L33.5,168.9L26,161.8L44.6,123.5L38.4,113.8L38.6,103.2L43.9,103.3L50.2,105.4L48.4,113.6L70.1,131.1L121.3,137.5L152.8,127.2L177.2,113.8L192.1,115.5L223.4,110.7L239.3,104.7L246.3,105.9L250.2,118.2L229.3,122.1L227.9,126.2L231.3,130.3L250.3,130.8L262.3,147.7L260.5,165.2L258,172.4L290.8,180.8L302.7,179.4L307.8,193.2L305.3,205.9L306.8,214.3L324.7,216.2L329.1,223.1L318.1,231.7L309.2,242.1L304.5,249.2L262.8,265.4L239.6,248.8L216.1,243.4L212.9,239.1L208.6,238.9L206.7,245.2L203.1,251.3L166.8,264.2L157.6,264.4L151.6,260.7L140,248.4L121.3,236L108.1,242.6L92.1,239.1Z M456.4,177.9L459.8,195.9L466.3,198.8L475.6,208.5L474.2,216.8L470.2,228.4L456.5,247.7L443.5,253.7L428.6,267.7L423.1,279.6L410.3,292L396.5,286.8L394.3,291.6L384.6,298.7L344.6,325.2L335.9,330.1L334.4,334.4L340.3,337.8L337.8,346.1L331.6,353.5L330.6,361L308.5,365.7L309.1,383.5L297.5,373.9L277,368.2L252.1,357.4L244,341.2L262.5,331.4L267,323.4L260.2,304.5L253.3,289.5L245.8,287.6L171.8,288.8L166.4,280.2L152.9,272.6L153.4,262.1L160.4,265.2L177.5,256.6L204.9,250.2L205.9,242.7L210.1,238.6L214.1,240.1L217.3,244L255.4,262.5L266.8,261.2L305.5,248L315.1,239.7L319.9,228.6L330.6,220.9L312.2,216.8L306,211.6L353.8,199.2L362.3,187.8L372.5,178.2L390.6,180.9L417,168.5L433.3,175L441.6,174.1L453.8,175.8Z M204.6,108.8L221.8,92.3L224.7,89L232,86.2L239.2,79.2L248.8,73.9L262,62.5L291.7,54.8L299.2,48.9L306.3,32.4L317.8,31.8L324.5,32.7L330,46.2L329.1,41.9L333,42.8L331.9,46.2L339.2,44.7L345.3,42.1L359.5,48L366,49.7L367.3,52L365,54.8L371.5,59.6L372.6,65.8L378.9,64.6L380.2,61.1L381.3,58.2L391.7,59.7L396,57.4L398.8,62.7L403.7,63.2L406.1,64.4L407,67.9L401.9,75.1L400.1,71.6L398.2,90.2L404.1,85.7L405.1,91.9L405.6,90.2L409.2,91.9L428.3,91.4L426.1,96.1L413.1,95.3L407.4,106.9L392.8,110.4L390.7,112.3L397.3,114.2L407.6,116.8L418.5,114.5L426.4,116L420.2,119L431.4,124.8L435.7,129.1L443.1,131.2L440.9,134.6L440.5,140.9L432,143.6L436.8,146.3L447.1,161.5L456.4,177.9L444.2,173.8L435.7,176.5L426.6,169.3L394.9,179.6L377.3,178.3L363.6,185.7L358.6,195.9L306.2,208.4L307.2,198.3L304.2,181.2L294.4,178.7L260.4,173.5L256.9,168.9L262.6,150.1L252,131.8L233,130.7L228.6,127.9L228.2,122.8L246.7,120.7L249.7,109.5L240.3,104.9L226.8,110L204.6,108.8Z M382.8,36.1L384,40.8L382.8,50.1L377.9,49.7L372.6,48.4L375.2,40L381,34.8Z M371,38.9L361.4,42.4L355.5,37.6L360.5,34.9L363.3,30.8L368.6,30L370.9,35.7Z M134.1,415.1L122.2,409.3L130.6,397.1L130.5,395.8L125.9,399.2L134.2,388.1L135.4,374.2L119.5,362.2L105.5,367.1L109.2,365.6L106.2,369.3L104.3,371L95.2,364.6L92.7,362.2L94.2,357.1L92.7,343.5L92.7,331.7L90.1,330.3L103.6,328.1L112.6,325.3L118.4,314.9L111.2,300.4L114.6,268.7L98.4,255.6L89.8,249L102.4,243L119.2,236.7L129,239.2L145.9,257.3L150.9,264.9L155.3,274.7L167.1,285.8L181.3,288.8L248.4,287.8L255.6,291.4L260.7,312L267.4,325.2L251.4,327.7L257.3,343.3L256.1,361L291.1,371.2L297.8,374.4L293.4,381.7L263.2,392L240.6,393.4L237.3,395.1L213.4,422.6L177.4,429.5L155.2,424.4L148.8,417L134.1,415.1Z M93.7,477L90.7,471.3L103.7,457.6L109.2,443L107.6,424.7L105.5,409.3L106.6,399.2L121,410.6L134.1,415.1L148.8,417L155.2,424.4L177.4,429.5L213.4,422.6L237.3,395.1L240.6,393.4L270.8,401.5L274.9,404L271.4,408.7L254.2,452.4L258.4,460.7L256.5,469.4L246.7,474.5L249.5,483L196.8,487.6L163,493.8L152.1,484.6L130.9,469.8L118,468.6L101.8,471.6L95.7,475.6Z M428.8,451.7L426.9,475.5L416.5,503L425.7,512.3L411.5,521.4L407.2,536.5L411,540.9L407.4,550.3L395.7,556.3L391.5,559.6L388.6,554.1L376.2,556.4L370.5,552.9L356.7,544.5L345.7,537.6L335.7,534.2L328.1,532.7L308.3,532.5L299.9,540.9L274.9,525.8L268.1,523.9L259,522L262.2,525.8L264.7,529.8L268.7,531.4L276.7,533.7L262.3,546.3L260.3,561.4L265.4,571.3L263.2,579.6L259.4,589.6L254.3,591.3L222.4,611.9L215.9,617.1L203.1,610.2L192.6,606.6L173.3,605.4L162.7,618.8L159.4,614.1L147.9,611.9L152.1,599.9L160.3,587.3L168,576.5L176.2,579.6L186.7,574.8L213,570.8L209.4,559.9L207.8,551.8L204.3,546.1L189.7,536.3L184.3,518.8L179.4,514.9L175,504.8L176.4,496.5L196.8,487.6L249.5,483L246.7,474.5L256.5,469.4L258.4,460.7L254.2,452.4L271.4,408.7L274.9,404L270.8,401.5L272.2,385.8L297,382.3L308.7,382.8L309.5,364.3L329.4,363.3L330.9,371.5L329.9,380.4L347.4,394.1L351.1,399.5L356.5,402.6L357.1,408.4L349.1,413.1L348.3,418.1L356.9,417L363.2,419.6L367.9,431.2L382.3,431.1L405.9,446L428.8,451.7Z M423.7,285.3L431.1,305L440,310.9L451.4,323.8L442.4,357L447.5,355.4L445.5,359.8L440.4,363.7L440.5,372.2L440,374.3L442.4,377.1L435.3,391.5L436.6,406.7L433.8,416.7L431.4,423.7L431.4,440.5L415.3,445.9L403.3,445.2L375.7,430L362.6,426.9L362.2,417.5L351.6,418.9L347.8,416.7L350.5,411.6L358.8,406.6L352.6,401.4L351.1,397L340.7,391.8L328.6,377.4L330.9,369.5L330.6,361L331.6,353.5L337.8,346.1L340.3,337.8L334.4,334.4L335.9,330.1L344.6,325.2L384.6,298.7L394.3,291.6L396.5,286.8L410.3,292Z";


type CityLabelAnchor = "start" | "middle" | "end";

interface CityMarker {
  name: string;
  svgX: number;
  svgY: number;
  labelDx: number;
  labelDy: number;
  labelAnchor?: CityLabelAnchor;
  population: string;
  isCapital: boolean;
}

// Coordinates are calibrated against the local Sardinia SVG path below.
// The path is not a plain lat/lng projection, so a geographic regression
// places coastal cities visibly offshore. Keep these as SVG-space anchors.
const cities: CityMarker[] = [
  { name: "Cagliari",     svgX: 288.0, svgY: 531.9, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "154k", isCapital: true },
  { name: "Sassari",      svgX: 136.0, svgY: 161.8, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "127k", isCapital: false },
  { name: "Olbia",        svgX: 389.3, svgY: 113.1, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "60k",  isCapital: false },
  { name: "Nuoro",        svgX: 344.2, svgY: 261.4, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "37k",  isCapital: false },
  { name: "Oristano",     svgX: 145.6, svgY: 364.4, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "32k",  isCapital: false },
  { name: "Tortolì",      svgX: 432.0, svgY: 358.4, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "11k",  isCapital: false },
  { name: "Alghero",      svgX: 72.6,  svgY: 203.2, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "44k",  isCapital: false },
  { name: "Iglesias",     svgX: 132.0, svgY: 510.3, labelDx: 12,  labelDy: 4,  labelAnchor: "start", population: "27k",  isCapital: false },
];

interface RouteData {
  from: string;
  to: string;
  waypoints: { x: number; y: number }[];
}

const routes: RouteData[] = [
  { from: "Sassari",      to: "Alghero",      waypoints: [] },
  { from: "Sassari",      to: "Olbia",        waypoints: [{ x: 255, y: 118 }] },
  { from: "Cagliari",     to: "Oristano",     waypoints: [{ x: 210, y: 450 }] },
  { from: "Cagliari",     to: "Nuoro",        waypoints: [{ x: 330, y: 430 }, { x: 340, y: 330 }] },
  { from: "Oristano",     to: "Sassari",      waypoints: [{ x: 140, y: 260 }] },
  { from: "Nuoro",        to: "Sassari",      waypoints: [{ x: 245, y: 215 }] },
  { from: "Nuoro",        to: "Olbia",        waypoints: [{ x: 372, y: 180 }] },
  { from: "Nuoro",        to: "Tortolì",      waypoints: [{ x: 395, y: 315 }] },
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
      <svg viewBox="0 0 500 650" className={isMobile ? "w-full h-full" : "w-full h-auto"} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.5">
          <line x1="0" y1="110" x2="500" y2="110" />
          <line x1="0" y1="220" x2="500" y2="220" />
          <line x1="0" y1="330" x2="500" y2="330" />
          <line x1="0" y1="440" x2="500" y2="440" />
          <line x1="0" y1="550" x2="500" y2="550" />
          <line x1="100" y1="0" x2="100" y2="650" />
          <line x1="200" y1="0" x2="200" y2="650" />
          <line x1="300" y1="0" x2="300" y2="650" />
          <line x1="400" y1="0" x2="400" y2="650" />
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
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* SARDEGNA watermark */}
        <text
          x="250"
          y="365"
          fill="rgba(255,255,255,0.03)"
          fontSize="52"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="24"
          transform="rotate(-8, 250, 365)"
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
                strokeWidth="2.5"
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
                  const svgX = (city.svgX / 500) * rect.width;
                  const svgY = (city.svgY / 650) * rect.height;
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
                  strokeWidth="1.2"
                  opacity="0.4"
                >
                  <animate attributeName="r" values="7;24" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* City dot */}
              {city.isCapital ? (
                <circle cx={city.svgX} cy={city.svgY} r="7" fill="#e63946" stroke="#0a0a0a" strokeWidth="2" />
              ) : (
                <circle cx={city.svgX} cy={city.svgY} r="5.5" fill="#0a0a0a" stroke="#e63946" strokeWidth="2.5" />
              )}

              {/* City label */}
              <text
                x={city.svgX + city.labelDx}
                y={city.svgY + city.labelDy}
                fill="rgba(255,255,255,0.7)"
                fontSize="14"
                fontWeight="500"
                textAnchor={city.labelAnchor || "start"}
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
