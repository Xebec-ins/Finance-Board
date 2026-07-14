import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, monthKey, formatMonthLabel } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import type { MonthlyBudget, TransactionWithCategory } from "@/lib/types";
import { MonthNav } from "@/components/month-nav";

type CategoryTotal = { color: string; total: number };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const supabase = await createClient();
  const month = monthParam || currentMonthKey();
  const lastMonth = monthKey(subMonths(new Date(month), 1));

  const thisStart = format(startOfMonth(new Date(month)), "yyyy-MM-dd");
  const thisEnd = format(endOfMonth(new Date(month)), "yyyy-MM-dd");
  const lastStart = format(startOfMonth(new Date(lastMonth)), "yyyy-MM-dd");
  const lastEnd = format(endOfMonth(new Date(lastMonth)), "yyyy-MM-dd");

  const [
    { data: thisBudget },
    { data: lastBudget },
    { data: thisTransactions },
    { data: lastTransactions },
    currency,
  ] = await Promise.all([
    supabase
      .from("monthly_budgets")
      .select("*")
      .eq("month", month)
      .maybeSingle<MonthlyBudget>(),
    supabase
      .from("monthly_budgets")
      .select("*")
      .eq("month", lastMonth)
      .maybeSingle<MonthlyBudget>(),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("date", thisStart)
      .lte("date", thisEnd)
      .order("date", { ascending: false })
      .returns<TransactionWithCategory[]>(),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("date", lastStart)
      .lte("date", lastEnd)
      .order("date", { ascending: false })
      .returns<TransactionWithCategory[]>(),
    getUserCurrency(),
  ]);

  const sym = currencySymbol(currency);

  function calcMonth(
    budget: MonthlyBudget | null,
    transactions: TransactionWithCategory[] | null,
  ) {
    const txns = transactions ?? [];
    const spent = txns.reduce((sum, t) => sum + t.amount, 0);
    const budgetAmount = budget?.income_amount ?? 0;
    const remaining = budgetAmount - spent;

    const byCategory = new Map<string, CategoryTotal>();
    for (const t of txns) {
      const name = t.category?.name ?? "Uncategorized";
      const existing = byCategory.get(name);
      if (existing) {
        existing.total += t.amount;
      } else {
        byCategory.set(name, {
          color: t.category?.color ?? "#6b7280",
          total: t.amount,
        });
      }
    }

    return { spent, budgetAmount, remaining, count: txns.length, byCategory };
  }

  const current = calcMonth(thisBudget ?? null, thisTransactions);
  const previous = calcMonth(lastBudget ?? null, lastTransactions);

  const hasLastMonth =
    lastBudget != null || (lastTransactions != null && lastTransactions.length > 0);

  // Spending change percentage
  const spendingChange =
    previous.spent > 0
      ? ((current.spent - previous.spent) / previous.spent) * 100
      : null;

  // Merge all category names from both months
  const allCategories = new Set<string>();
  for (const name of current.byCategory.keys()) allCategories.add(name);
  for (const name of previous.byCategory.keys()) allCategories.add(name);

  const categoryComparison = [...allCategories]
    .map((name) => {
      const cur = current.byCategory.get(name);
      const prev = previous.byCategory.get(name);
      const curTotal = cur?.total ?? 0;
      const prevTotal = prev?.total ?? 0;
      const color = cur?.color ?? prev?.color ?? "#6b7280";
      const change = prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : null;
      return { name, color, curTotal, prevTotal, change };
    })
    .sort((a, b) => b.curTotal - a.curTotal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Monthly Comparison</h1>
          <p className="text-sm text-neutral-500">
            vs {formatMonthLabel(lastMonth)}
          </p>
        </div>
        <MonthNav month={month} />
      </div>

      {!hasLastMonth ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">
            No data for last month ({formatMonthLabel(lastMonth)}).
          </p>
        </div>
      ) : (
        <>
          {/* Side-by-side month columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MonthColumn
              label="This Month"
              monthLabel={formatMonthLabel(month)}
              budgetAmount={current.budgetAmount}
              spent={current.spent}
              remaining={current.remaining}
              count={current.count}
              sym={sym}
            />
            <MonthColumn
              label="Last Month"
              monthLabel={formatMonthLabel(lastMonth)}
              budgetAmount={previous.budgetAmount}
              spent={previous.spent}
              remaining={previous.remaining}
              count={previous.count}
              sym={sym}
            />
          </div>

          {/* Changes section */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Changes</h2>

            {spendingChange !== null && (
              <div className="mt-3 text-sm">
                <span className="text-neutral-500">Spending change: </span>
                {spendingChange > 0 ? (
                  <span className="font-medium text-red-600">
                    &uarr; {Math.abs(spendingChange).toFixed(1)}% more
                  </span>
                ) : spendingChange < 0 ? (
                  <span className="font-medium text-emerald-600">
                    &darr; {Math.abs(spendingChange).toFixed(1)}% less
                  </span>
                ) : (
                  <span className="font-medium text-neutral-900">No change</span>
                )}
              </div>
            )}

            {categoryComparison.length > 0 && (
              <ul className="mt-4 space-y-2">
                {categoryComparison.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-neutral-900">{c.name}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-neutral-700">
                        {sym} {c.curTotal.toFixed(2)}
                      </span>
                      <span className="text-neutral-400">vs</span>
                      <span className="text-neutral-500">
                        {sym} {c.prevTotal.toFixed(2)}
                      </span>
                      {c.change !== null && (
                        <span
                          className={`min-w-[4.5rem] text-right font-medium ${
                            c.change > 0 ? "text-red-600" : c.change < 0 ? "text-emerald-600" : "text-neutral-500"
                          }`}
                        >
                          {c.change > 0 ? "↑" : c.change < 0 ? "↓" : ""}
                          {c.change !== 0 ? ` ${Math.abs(c.change).toFixed(1)}%` : "0%"}
                        </span>
                      )}
                      {c.change === null && (
                        <span className="min-w-[4.5rem] text-right text-neutral-400">new</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MonthColumn({
  label,
  monthLabel,
  budgetAmount,
  spent,
  remaining,
  count,
  sym,
}: {
  label: string;
  monthLabel: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  count: number;
  sym: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
      <p className="text-xs text-neutral-500">{monthLabel}</p>

      <dl className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-neutral-500">Budget</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {sym} {budgetAmount.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-neutral-500">Spent</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {sym} {spent.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-neutral-500">Remaining</dt>
          <dd
            className={`text-sm font-medium ${
              remaining >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {sym} {remaining.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-neutral-500">Transactions</dt>
          <dd className="text-sm font-medium text-neutral-900">{count}</dd>
        </div>
      </dl>
    </div>
  );
}
