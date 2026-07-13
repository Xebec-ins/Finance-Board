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

export type MonthlyTotal = { month: string; total: number };

export function AnnualChart({
  data,
  sym,
}: {
  data: MonthlyTotal[];
  sym: string;
}) {
  if (data.every((d) => d.total === 0)) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        No spending recorded this year.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.gridline} strokeWidth={1} />
        <XAxis
          dataKey="month"
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.baseline }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.baseline }}
          tickLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value) => `${sym} ${Number(value).toFixed(2)}`}
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
        />
        <Bar
          dataKey="total"
          fill={CATEGORICAL_PALETTE_LIGHT[0]}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
