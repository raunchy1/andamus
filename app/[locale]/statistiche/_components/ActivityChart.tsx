"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ActivityDataPoint {
  month: string;
  driver: number;
  passenger: number;
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  driverLabel: string;
  passengerLabel: string;
}

/**
 * Two series, two values of the same green. The old chart drew its axes and
 * grid in white, which was invisible once the app moved to the sand theme.
 */
const INK = "#16211C";
const MUTED = "#6B7570";
const LINE = "#E4DFD4";
const GREEN = "#2D6A4F";
const GREEN_LIGHT = "#9CBFAE";

export function ActivityChart({ data, driverLabel, passengerLabel }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={LINE} />
        <XAxis
          dataKey="month"
          stroke={LINE}
          tick={{ fill: MUTED, fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke={LINE}
          tick={{ fill: MUTED, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "rgba(22, 33, 28, 0.04)" }}
          contentStyle={{
            backgroundColor: "#FFFFFF",
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            fontSize: 12,
            color: INK,
          }}
          labelStyle={{ color: INK, fontWeight: 600 }}
        />
        <Legend
          verticalAlign="bottom"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: MUTED }}
        />
        <Bar dataKey="driver" name={driverLabel} fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="passenger" name={passengerLabel} fill={GREEN_LIGHT} radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
