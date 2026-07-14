import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  format,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, formatMonthLabel, monthKey } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import type { MonthlyBudget, TransactionWithCategory } from "@/lib/types";
import { CategoryBarChart, type CategorySlice } from "./category-bar-chart";
import { DailySpendChart, type DailySpend } from "./daily-spend-chart";
import { SavingsProgressChart, type SavingsMonth } from "./savings-progress-chart";
import { MonthNav } from "@/components/month-nav";

const MONTHS_OF_HISTORY = 6;

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const supabase = await createClient();
  const month = monthParam || currentMonthKey();
  const monthStart = startOfMonth(new Date(month));
  const monthEnd = endOfMonth(new Date(month));

  const historyStart = startOfMonth(subMonths(monthStart, MONTHS_OF_HISTORY - 1));

  const [{ data: monthTransactions }, { data: budgets }, { data: historyTransactions }, currency] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .returns<TransactionWithCategory[]>(),
      supabase
        .from("monthly_budgets")
        .select("*")
        .gte("month", format(historyStart, "yyyy-MM-dd"))
        .lte("month", format(monthStart, "yyyy-MM-dd"))
        .returns<MonthlyBudget[]>(),
      supabase
        .from("transactions")
        .select("date, amount")
        .gte("date", format(historyStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd")),
      getUserCurrency(),
    ]);

  const sym = currencySymbol(currency);

  const byCategory = new Map<string, CategorySlice>();
  for (const t of monthTransactions ?? []) {
    const key = t.category?.name ?? "Uncategorized";
    const existing = byCategory.get(key);
    if (existing) {
      existing.total += t.amount;
    } else {
      byCategory.set(key, {
        name: key,
        color: t.category?.color ?? "#898781",
        total: t.amount,
      });
    }
  }

  const dailyTotals = new Map<string, number>();
  for (const t of monthTransactions ?? []) {
    dailyTotals.set(t.date, (dailyTotals.get(t.date) ?? 0) + t.amount);
  }
  const dailySpend: DailySpend[] = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(
    (d) => {
      const key = format(d, "yyyy-MM-dd");
      return { day: format(d, "d"), total: dailyTotals.get(key) ?? 0 };
    },
  );

  const budgetByMonth = new Map(budgets?.map((b) => [b.month, b]) ?? []);
  const spendByMonth = new Map<string, number>();
  for (const t of historyTransactions ?? []) {
    const key = monthKey(new Date(t.date));
    spendByMonth.set(key, (spendByMonth.get(key) ?? 0) + t.amount);
  }
  const savingsProgress: SavingsMonth[] = Array.from({ length: MONTHS_OF_HISTORY }, (_, i) => {
    const d = subMonths(monthStart, MONTHS_OF_HISTORY - 1 - i);
    const key = monthKey(d);
    const b = budgetByMonth.get(key);
    const spent = spendByMonth.get(key) ?? 0;
    const remaining = Math.max(0, (b?.income_amount ?? 0) - spent);
    return { month: format(d, "MMM"), remaining, goal: b?.savings_goal_amount ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Charts</h1>
        <MonthNav month={month} />
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Spending by category</h2>
        <div className="mt-4">
          <CategoryBarChart data={[...byCategory.values()]} sym={sym} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Daily spending</h2>
        <div className="mt-4">
          <DailySpendChart data={dailySpend} sym={sym} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Savings progress ({MONTHS_OF_HISTORY} months)
        </h2>
        <div className="mt-4">
          <SavingsProgressChart data={savingsProgress} sym={sym} />
        </div>
      </section>
    </div>
  );
}
