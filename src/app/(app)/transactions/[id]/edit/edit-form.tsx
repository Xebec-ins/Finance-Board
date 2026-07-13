"use client";

import { useActionState } from "react";
import { updateTransaction } from "@/app/actions/transactions";
import type { Category, Transaction } from "@/lib/types";

export function EditTransactionForm({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) {
  const [result, formAction, isPending] = useActionState(
    updateTransaction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={transaction.id} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={transaction.amount}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={transaction.category_id ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={transaction.date}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label htmlFor="merchant" className="block text-sm font-medium text-neutral-700">
            Merchant
          </label>
          <input
            id="merchant"
            name="merchant"
            type="text"
            defaultValue={transaction.merchant ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-neutral-700">
          Note
        </label>
        <input
          id="note"
          name="note"
          type="text"
          defaultValue={transaction.note ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
