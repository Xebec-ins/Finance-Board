"use client";

import { useActionState } from "react";
import { saveCategoryBudget } from "@/app/actions/category-budgets";
import type { Category, CategoryBudget } from "@/lib/types";

function CategoryBudgetRow({
  category,
  budget,
  month,
  sym,
}: {
  category: Category;
  budget: CategoryBudget | undefined;
  month: string;
  sym: string;
}) {
  const [result, formAction, isPending] = useActionState(
    saveCategoryBudget,
    undefined,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="category_id" value={category.id} />
      <input type="hidden" name="month" value={month} />
      <div className="flex items-center gap-3">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-sm text-neutral-700 w-28 truncate">
          {category.name}
        </span>
        <span className="text-sm text-neutral-500">{sym}</span>
        <input
          type="number"
          name="amount"
          min={0}
          step="0.01"
          defaultValue={budget ? budget.amount : ""}
          placeholder="0"
          className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs font-medium hover:bg-neutral-50"
        >
          {isPending ? "..." : "Set"}
        </button>
      </div>
      {result?.error && (
        <p className="mt-1 ml-8 text-xs text-red-600">{result.error}</p>
      )}
    </form>
  );
}

export function CategoryBudgets({
  categories,
  budgets,
  month,
  sym,
}: {
  categories: Category[];
  budgets: CategoryBudget[];
  month: string;
  sym: string;
}) {
  if (categories.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-sm text-neutral-400">Add categories first.</p>
      </div>
    );
  }

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b]));

  return (
    <div className="mt-4 space-y-3">
      {categories.map((category) => (
        <CategoryBudgetRow
          key={category.id}
          category={category}
          budget={budgetMap.get(category.id)}
          month={month}
          sym={sym}
        />
      ))}
      <p className="text-xs text-neutral-400">
        Set to 0 to remove a category budget.
      </p>
    </div>
  );
}
