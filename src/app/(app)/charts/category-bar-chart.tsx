"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK } from "@/lib/chart-theme";

export type CategorySlice = { name: string; color: string; total: number };

export function CategoryBarChart({ data }: { data: CategorySlice[] }) {
  const rows = [...data].sort((a, b) => b.total - a.total).slice(0, 8);
  const height = Math.max(160, rows.length * 40);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        No spending yet this month.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
          <CartesianGrid
            horizontal={false}
            stroke={CHART_INK.gridline}
            strokeWidth={1}
          />
          <XAxis
            type="number"
            tick={{ fill: CHART_INK.muted, fontSize: 12 }}
            axisLine={{ stroke: CHART_INK.baseline }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: CHART_INK.secondary, fontSize: 12 }}
            axisLine={{ stroke: CHART_INK.baseline }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => Number(value).toFixed(2)}
            contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {rows.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              formatter={(value: React.ReactNode) => Number(value).toFixed(2)}
              style={{ fill: CHART_INK.primary, fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
