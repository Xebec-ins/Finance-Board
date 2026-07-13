"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveMonthlyBudget } from "@/app/actions/budgets";
import type { MonthlyBudget } from "@/lib/types";
import { type CurrencyCode, currencySymbol } from "@/lib/currency";

function derivePercentage(budget: MonthlyBudget | null): string {
  if (!budget || !budget.income_amount) return "";
  return String(
    Math.round((budget.savings_goal_amount / budget.income_amount) * 100),
  );
}

export function BudgetForm({
  month,
  budget,
  currency,
}: {
  month: string;
  budget: MonthlyBudget | null;
  currency: CurrencyCode;
}) {
  const [result, formAction, isPending] = useActionState(
    saveMonthlyBudget,
    undefined,
  );

  const [incomeAmount, setIncomeAmount] = useState(
    budget?.income_amount ? String(budget.income_amount) : "",
  );
  const [savingsPct, setSavingsPct] = useState(derivePercentage(budget));

  const income = Number(incomeAmount) || 0;
  const pct = Number(savingsPct) || 0;
  const derivedSavings = Math.round(income * (pct / 100) * 100) / 100;

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="savings_goal_amount" value={derivedSavings} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="income_amount"
            className="block text-sm font-medium text-neutral-700"
          >
            Spending budget
          </label>
          <input
            id="income_amount"
            name="income_amount"
            type="number"
            step="0.01"
            min="0"
            required
            value={incomeAmount}
            onChange={(e) => setIncomeAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="savings_pct"
            className="block text-sm font-medium text-neutral-700"
          >
            Savings goal (%)
          </label>
          <input
            id="savings_pct"
            type="number"
            step="1"
            min="0"
            max="100"
            required
            value={savingsPct}
            onChange={(e) => setSavingsPct(e.target.value)}
            placeholder="e.g. 20"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          {income > 0 && pct > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              {pct}% of {currencySymbol(currency)} {income.toFixed(2)} ={" "}
              {currencySymbol(currency)} {derivedSavings.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
