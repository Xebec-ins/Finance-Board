import { format, startOfYear, endOfMonth, eachMonthOfInterval } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import { monthKey } from "@/lib/month";
import type { TransactionWithCategory } from "@/lib/types";
import { AnnualChart } from "./annual-chart";

export default async function AnnualPage() {
  const supabase = await createClient();
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = startOfYear(now);
  const monthEnd = endOfMonth(now);
  const rangeStart = format(yearStart, "yyyy-MM-dd");
  const rangeEnd = format(monthEnd, "yyyy-MM-dd");

  const [{ data: transactions }, currency] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date", { ascending: false })
      .returns<TransactionWithCategory[]>(),
    getUserCurrency(),
  ]);

  const sym = currencySymbol(currency);
  const txns = transactions ?? [];

  // Total YTD spending
  const totalSpent = txns.reduce((sum, t) => sum + t.amount, 0);

  // Monthly totals
  const months = eachMonthOfInterval({ start: yearStart, end: monthEnd });
  const monthlyMap = new Map<string, number>();
  for (const m of months) {
    monthlyMap.set(monthKey(m), 0);
  }
  for (const t of txns) {
    const key = monthKey(new Date(t.date));
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + t.amount);
  }

  const chartData = months.map((m) => ({
    month: format(m, "MMM"),
    total: monthlyMap.get(monthKey(m)) ?? 0,
  }));

  // Category totals
  const byCategory = new Map<string, { name: string; color: string; total: number }>();
  for (const t of txns) {
    const key = t.category?.id ?? "uncategorized";
    const existing = byCategory.get(key);
    if (existing) {
      existing.total += t.amount;
    } else {
      byCategory.set(key, {
        name: t.category?.name ?? "Uncategorized",
        color: t.category?.color ?? "#6b7280",
        total: t.amount,
      });
    }
  }
  const categoryBreakdown = [...byCategory.values()].sort((a, b) => b.total - a.total);
  const topCategory = categoryBreakdown[0]?.name ?? "N/A";

  // Average monthly spend
  const monthsTracked = months.length;
  const monthlyAverage = monthsTracked > 0 ? totalSpent / monthsTracked : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Annual Overview</h1>
        <p className="text-sm text-neutral-500">{year} Year to Date</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Spent" value={`${sym} ${totalSpent.toFixed(2)}`} />
        <SummaryCard label="Monthly Average" value={`${sym} ${monthlyAverage.toFixed(2)}`} />
        <SummaryCard label="Top Category" value={topCategory} />
        <SummaryCard label="Months Tracked" value={String(monthsTracked)} />
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Monthly spending</h2>
        <div className="mt-3">
          <AnnualChart data={chartData} sym={sym} />
        </div>
      </section>

      {categoryBreakdown.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">By category</h2>
          <ul className="mt-3 space-y-3">
            {categoryBreakdown.map((c) => {
              const pct = totalSpent > 0 ? (c.total / totalSpent) * 100 : 0;
              return (
                <li key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="text-neutral-700">
                    {sym} {c.total.toFixed(2)}{" "}
                    <span className="text-neutral-400">({pct.toFixed(1)}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
