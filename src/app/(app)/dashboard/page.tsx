import Link from "next/link";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, formatMonthLabel, monthKey } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import type { MonthlyBudget, TransactionWithCategory, CategoryBudget } from "@/lib/types";
import { MonthNav } from "@/components/month-nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const supabase = await createClient();
  const month = monthParam || currentMonthKey();
  const rangeStart = format(startOfMonth(new Date(month)), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(new Date(month)), "yyyy-MM-dd");

  const lastMonth = monthKey(subMonths(new Date(month), 1));
  const lastStart = format(startOfMonth(new Date(lastMonth)), "yyyy-MM-dd");
  const lastEnd = format(endOfMonth(new Date(lastMonth)), "yyyy-MM-dd");

  const [
    { data: budget },
    { data: transactions },
    { data: catBudgets },
    { data: lastTransactions },
    { data: recurringTemplates },
    currency,
  ] = await Promise.all([
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
    supabase
      .from("category_budgets")
      .select("*")
      .eq("month", month)
      .returns<CategoryBudget[]>(),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("date", lastStart)
      .lte("date", lastEnd)
      .returns<TransactionWithCategory[]>(),
    supabase
      .from("recurring_templates")
      .select("*")
      .eq("is_active", true),
    getUserCurrency(),
  ]);

  const sym = currencySymbol(currency);
  const spendingBudget = budget?.income_amount ?? 0;
  const savingsGoal = budget?.savings_goal_amount ?? 0;
  const spent = (transactions ?? []).reduce((sum, t) => sum + t.amount, 0);
  const remaining = spendingBudget - spent;
  const spentPct = spendingBudget > 0 ? Math.min(100, (spent / spendingBudget) * 100) : 0;
  const savingsPct = savingsGoal > 0 ? Math.min(100, (Math.max(0, remaining) / savingsGoal) * 100) : 0;

  const byCategory = new Map<string, { id: string; name: string; color: string; total: number }>();
  for (const t of transactions ?? []) {
    const key = t.category?.id ?? "uncategorized";
    const existing = byCategory.get(key);
    if (existing) {
      existing.total += t.amount;
    } else {
      byCategory.set(key, {
        id: key,
        name: t.category?.name ?? "Uncategorized",
        color: t.category?.color ?? "#6b7280",
        total: t.amount,
      });
    }
  }
  const categoryBreakdown = [...byCategory.values()].sort((a, b) => b.total - a.total);

  // Category budget map
  const catBudgetMap = new Map((catBudgets ?? []).map((cb) => [cb.category_id, cb.amount]));

  // Budget alerts
  const alerts: string[] = [];
  if (spendingBudget > 0 && spentPct >= 100) {
    alerts.push("You've exceeded your spending budget this month!");
  } else if (spendingBudget > 0 && spentPct >= 90) {
    alerts.push("Warning: You've spent 90%+ of your budget.");
  } else if (spendingBudget > 0 && spentPct >= 80) {
    alerts.push("Heads up: You've used 80%+ of your budget.");
  }

  for (const cat of categoryBreakdown) {
    const limit = catBudgetMap.get(cat.id);
    if (limit && cat.total > limit) {
      alerts.push(`${cat.name} is over budget (${sym} ${cat.total.toFixed(2)} / ${sym} ${limit.toFixed(2)})`);
    }
  }

  // Spending insights (compare with last month)
  const lastSpent = (lastTransactions ?? []).reduce((sum, t) => sum + t.amount, 0);
  const insights: string[] = [];
  if (lastSpent > 0) {
    const change = ((spent - lastSpent) / lastSpent) * 100;
    if (change > 10) {
      insights.push(`Spending is up ${change.toFixed(0)}% compared to last month.`);
    } else if (change < -10) {
      insights.push(`Great! Spending is down ${Math.abs(change).toFixed(0)}% from last month.`);
    } else {
      insights.push("Spending is about the same as last month.");
    }

    const lastByCategory = new Map<string, number>();
    for (const t of lastTransactions ?? []) {
      const name = t.category?.name ?? "Uncategorized";
      lastByCategory.set(name, (lastByCategory.get(name) ?? 0) + t.amount);
    }
    for (const cat of categoryBreakdown.slice(0, 3)) {
      const prev = lastByCategory.get(cat.name) ?? 0;
      if (prev > 0) {
        const catChange = ((cat.total - prev) / prev) * 100;
        if (catChange > 20) {
          insights.push(`${cat.name} spending up ${catChange.toFixed(0)}% from last month.`);
        } else if (catChange < -20) {
          insights.push(`${cat.name} spending down ${Math.abs(catChange).toFixed(0)}% from last month.`);
        }
      }
    }
  }

  // Upcoming recurring bills
  const today = new Date().getDate();
  const upcomingBills = (recurringTemplates ?? [])
    .filter((t) => t.day_of_month >= today)
    .sort((a, b) => a.day_of_month - b.day_of_month)
    .slice(0, 3);

  if (!budget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
          <MonthNav month={month} />
        </div>
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            Set your budget for {formatMonthLabel(month)}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Tell us how much you have to spend and how much you want to save.
          </p>
          <Link
            href={`/settings?month=${month}`}
            className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Go to settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        <MonthNav month={month} />
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Spending Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight) => (
            <div
              key={insight}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
            >
              {insight}
            </div>
          ))}
        </div>
      )}

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

      {/* Category Breakdown with budgets */}
      {categoryBreakdown.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">By category</h2>
          <ul className="mt-3 space-y-3">
            {categoryBreakdown.map((c) => {
              const limit = catBudgetMap.get(c.id);
              const overBudget = limit ? c.total > limit : false;
              const pct = limit ? Math.min(100, (c.total / limit) * 100) : 0;
              return (
                <li key={c.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span className={overBudget ? "font-medium text-red-600" : "text-neutral-700"}>
                      {sym} {c.total.toFixed(2)}
                      {limit ? ` / ${sym} ${limit.toFixed(2)}` : ""}
                    </span>
                  </div>
                  {limit ? (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full ${overBudget ? "bg-red-400" : "bg-neutral-400"}`}
                        style={{ width: `${pct}%`, backgroundColor: overBudget ? undefined : c.color }}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Upcoming Recurring Bills */}
      {upcomingBills.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Upcoming bills</h2>
            <Link href="/recurring" className="text-xs text-neutral-500 underline hover:text-neutral-900">
              View all
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {upcomingBills.map((bill) => (
              <li key={bill.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{bill.merchant || bill.note || "Bill"}</span>
                <span className="text-neutral-500">
                  {sym} {bill.amount.toFixed(2)} · Day {bill.day_of_month}
                </span>
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
