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
  colors: string[];
}

export function OverviewCharts({
  usersPerDay,
  ridesPerDay,
  citiesStats,
  colors,
}: OverviewChartsProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4">Nuovi utenti (14 giorni)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={usersPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              labelStyle={{ color: "white" }}
            />
            <Line type="monotone" dataKey="count" stroke="#e63946" strokeWidth={2} dot={{ fill: "#e63946", r: 3 }} name="Utenti" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4">Corse create (14 giorni)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ridesPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            <Bar dataKey="count" fill="#e63946" radius={[4, 4, 0, 0]} name="Corse" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {citiesStats.length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Distribuzione per città</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={citiesStats} dataKey="rides" nameKey="city" cx="50%" cy="50%" outerRadius={80}>
                  {citiesStats.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1 w-full">
              {citiesStats.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-white/70 text-sm flex-1">{c.city}</span>
                  <span className="text-white font-medium text-sm">{c.rides}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}