"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK } from "@/lib/chart-theme";
import { CATEGORICAL_PALETTE_LIGHT } from "@/lib/palette";

export type SavingsMonth = { month: string; remaining: number; goal: number };

export function SavingsProgressChart({ data, sym }: { data: SavingsMonth[]; sym: string }) {
  const hasData = data.some((d) => d.goal > 0 || d.remaining !== 0);
  if (!hasData) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        Set a savings goal to see progress here.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
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
          width={40}
        />
        <Tooltip
          formatter={(value) => `${sym} ${Number(value).toFixed(2)}`}
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: CHART_INK.secondary }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="remaining"
          name="Saved"
          fill={CATEGORICAL_PALETTE_LIGHT[1]}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="goal"
          name="Goal"
          fill={CHART_INK.baseline}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
