import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, formatMonthLabel } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import type { Category, MonthlyBudget } from "@/lib/types";
import { BudgetForm } from "./budget-form";
import { CategoryManager } from "./category-manager";
import { CurrencyForm } from "./currency-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const month = currentMonthKey();

  const [{ data: budget }, { data: categories }, currency] = await Promise.all([
    supabase
      .from("monthly_budgets")
      .select("*")
      .eq("month", month)
      .maybeSingle<MonthlyBudget>(),
    supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true })
      .returns<Category[]>(),
    getUserCurrency(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">{formatMonthLabel(month)}</p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Currency</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Choose the currency for all amounts.
        </p>
        <CurrencyForm current={currency} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Monthly budget
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          How much you have to spend this month, and how much you want to
          save.
        </p>
        <BudgetForm month={month} budget={budget ?? null} currency={currency} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Categories</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Group your spending so charts are meaningful.
        </p>
        <CategoryManager categories={categories ?? []} />
      </section>
    </div>
  );
}
