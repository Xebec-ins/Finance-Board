"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK } from "@/lib/chart-theme";
import { CATEGORICAL_PALETTE_LIGHT } from "@/lib/palette";

export type DailySpend = { day: string; total: number };

export function DailySpendChart({ data }: { data: DailySpend[] }) {
  if (data.every((d) => d.total === 0)) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        No spending yet this month.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.gridline} strokeWidth={1} />
        <XAxis
          dataKey="day"
          tick={{ fill: CHART_INK.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_INK.baseline }}
          tickLine={false}
          interval={Math.ceil(data.length / 10)}
        />
        <YAxis
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.baseline }}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => Number(value).toFixed(2)}
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
        />
        <Bar
          dataKey="total"
          fill={CATEGORICAL_PALETTE_LIGHT[0]}
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
