import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, formatMonthLabel } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import type { MonthlyBudget, TransactionWithCategory } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const month = currentMonthKey();
  const rangeStart = format(startOfMonth(new Date(month)), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(new Date(month)), "yyyy-MM-dd");

  const [{ data: budget }, { data: transactions }, currency] = await Promise.all([
    supabase
      .from("monthly_budgets")
      .select("*")
      .eq("month", month)
      .maybeSingle<MonthlyBudget>(),
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
  const spendingBudget = budget?.income_amount ?? 0;
  const savingsGoal = budget?.savings_goal_amount ?? 0;
  const spent = (transactions ?? []).reduce((sum, t) => sum + t.amount, 0);
  const remaining = spendingBudget - spent;
  const spentPct = spendingBudget > 0 ? Math.min(100, (spent / spendingBudget) * 100) : 0;
  const savingsPct = savingsGoal > 0 ? Math.min(100, (Math.max(0, remaining) / savingsGoal) * 100) : 0;

  const byCategory = new Map<string, { name: string; color: string; total: number }>();
  for (const t of transactions ?? []) {
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

  if (!budget) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">
          Set your budget for {formatMonthLabel(month)}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Tell us how much you have to spend and how much you want to save.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Go to settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">{formatMonthLabel(month)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Budget" value={spendingBudget} sym={sym} />
        <SummaryCard label="Spent" value={spent} sym={sym} accent={spent > spendingBudget ? "text-red-600" : undefined} />
        <SummaryCard label="Remaining" value={remaining} sym={sym} accent={remaining < 0 ? "text-red-600" : "text-emerald-600"} />
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-900">Spending budget</span>
          <span className="text-neutral-500">
            {sym} {spent.toFixed(2)} / {sym} {spendingBudget.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${spent > spendingBudget ? "bg-red-500" : "bg-neutral-900"}`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
      </section>

      {savingsGoal > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-900">Savings goal</span>
            <span className="text-neutral-500">
              {sym} {Math.max(0, remaining).toFixed(2)} / {sym} {savingsGoal.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${savingsPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Based on what you haven&apos;t spent yet this month.
          </p>
        </section>
      )}

      {categoryBreakdown.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">By category</h2>
          <ul className="mt-3 space-y-2">
            {categoryBreakdown.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className="text-neutral-700">{sym} {c.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-end">
        <Link
          href="/transactions/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Add spending
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sym,
  accent,
}: {
  label: string;
  value: number;
  sym: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ?? "text-neutral-900"}`}>
        {sym} {value.toFixed(2)}
      </p>
    </div>
  );
}
