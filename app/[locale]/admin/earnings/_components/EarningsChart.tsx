"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EarningsDayPoint } from "@/lib/server/payments/earnings";

const ACCENT = "#2D6A4F";
const DIM = "#5C5C58";
const LINE = "#222220";
const ELEVATED = "#1F1F1F";
const FG = "#EDEDEA";

const tooltipStyle = {
  background: ELEVATED,
  border: `1px solid ${LINE}`,
  borderRadius: "10px",
  color: FG,
  fontSize: "12px",
};

const axisTick = {
  fontSize: 11,
  fill: DIM,
  fontFamily: "var(--font-mono, monospace)",
};

interface Props {
  data: EarningsDayPoint[];
  currency: string;
}

export function EarningsChart({ data, currency }: Props) {
  const fmt = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  });

  // Recharts works in numbers, so plot euros and format on display.
  const points = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    net: d.netFeeCents / 100,
    bookings: d.bookings,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={points}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
        <XAxis
          dataKey="date"
          stroke={LINE}
          tick={axisTick}
          axisLine={{ stroke: LINE }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          stroke={LINE}
          tick={axisTick}
          axisLine={{ stroke: LINE }}
          width={64}
          tickFormatter={(v: number) => fmt.format(v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: FG }}
          formatter={(value) => [
            fmt.format(typeof value === "number" ? value : 0),
            "Commissione",
          ]}
        />
        <Bar dataKey="net" fill={ACCENT} radius={[4, 4, 0, 0]} name="Commissione" />
      </BarChart>
    </ResponsiveContainer>
  );
}
