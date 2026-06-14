"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

export function ActivityChart({ data, driverLabel, passengerLabel }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#fff" }}
        />
        <Bar dataKey="driver" name={driverLabel} fill="#e63946" radius={[4, 4, 0, 0]} />
        <Bar dataKey="passenger" name={passengerLabel} fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}