"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DayStat {
  date: string;
  count: number;
}

interface CityStat {
  city: string;
  rides: number;
}

interface OverviewChartsProps {
  usersPerDay: DayStat[];
  ridesPerDay: DayStat[];
  citiesStats: CityStat[];
}

const ACCENT = "#4FB3C9";
const MUTED = "#8C8C87";
const DIM = "#5C5C58";
const LINE = "#222220";
const ELEVATED = "#1F1F1F";
const FG = "#EDEDEA";

const PIE_COLORS = [ACCENT, MUTED, DIM, "#2E2E2B", "#3A3A36"];

const tooltipStyle = {
  background: ELEVATED,
  border: `1px solid ${LINE}`,
  borderRadius: "10px",
  color: FG,
  fontSize: "12px",
};

const axisTick = { fontSize: 11, fill: DIM, fontFamily: "var(--font-mono, monospace)" };

export function OverviewCharts({
  usersPerDay,
  ridesPerDay,
  citiesStats,
}: OverviewChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <p className="text-eyebrow mb-4">nuovi utenti (14 giorni)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={usersPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
            <XAxis dataKey="date" stroke={LINE} tick={axisTick} axisLine={{ stroke: LINE }} />
            <YAxis stroke={LINE} tick={axisTick} axisLine={{ stroke: LINE }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: FG }} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={ACCENT}
              strokeWidth={2}
              dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
              name="Utenti"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <p className="text-eyebrow mb-4">corse create (14 giorni)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ridesPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
            <XAxis dataKey="date" stroke={LINE} tick={axisTick} axisLine={{ stroke: LINE }} />
            <YAxis stroke={LINE} tick={axisTick} axisLine={{ stroke: LINE }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: FG }} />
            <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} name="Corse" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {citiesStats.length > 0 && (
        <div className="rounded-[var(--radius)] border border-line bg-surface p-5 lg:col-span-2">
          <p className="text-eyebrow mb-4">distribuzione per città</p>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={citiesStats}
                  dataKey="rides"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  stroke={LINE}
                  strokeWidth={1}
                >
                  {citiesStats.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full flex-1 space-y-2">
              {citiesStats.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 text-sm text-muted">{c.city}</span>
                  <span className="font-mono text-sm font-medium text-fg">{c.rides}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}