"use client";

import { useActionState } from "react";
import { saveMonthlyBudget } from "@/app/actions/budgets";
import type { MonthlyBudget } from "@/lib/types";

export function BudgetForm({
  month,
  budget,
}: {
  month: string;
  budget: MonthlyBudget | null;
}) {
  const [result, formAction, isPending] = useActionState(
    saveMonthlyBudget,
    undefined,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="month" value={month} />

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
            defaultValue={budget?.income_amount ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="savings_goal_amount"
            className="block text-sm font-medium text-neutral-700"
          >
            Savings goal
          </label>
          <input
            id="savings_goal_amount"
            name="savings_goal_amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={budget?.savings_goal_amount ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
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
