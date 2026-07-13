"use client";

import { useActionState } from "react";
import { createRecurring } from "@/app/actions/recurring";
import type { Category } from "@/lib/types";

export function RecurringForm({ categories }: { categories: Category[] }) {
  const [result, formAction, isPending] = useActionState(
    createRecurring,
    undefined,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-neutral-700"
          >
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="category_id"
            className="block text-sm font-medium text-neutral-700"
          >
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="merchant"
            className="block text-sm font-medium text-neutral-700"
          >
            Merchant
          </label>
          <input
            id="merchant"
            name="merchant"
            type="text"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-neutral-700"
          >
            Note
          </label>
          <input
            id="note"
            name="note"
            type="text"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="day_of_month"
            className="block text-sm font-medium text-neutral-700"
          >
            Day of month
          </label>
          <input
            id="day_of_month"
            name="day_of_month"
            type="number"
            min="1"
            max="28"
            required
            placeholder="1–28"
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
        {isPending ? "Saving..." : "Add recurring bill"}
      </button>
    </form>
  );
}
