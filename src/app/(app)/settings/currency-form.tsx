"use client";

import { useActionState } from "react";
import { saveCurrency } from "@/app/actions/preferences";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function CurrencyForm({ current }: { current: CurrencyCode }) {
  const [result, formAction, isPending] = useActionState(saveCurrency, undefined);

  return (
    <form action={formAction} className="mt-4 flex items-end gap-3">
      <div className="flex-1">
        <label htmlFor="currency" className="block text-sm font-medium text-neutral-700">
          Currency
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue={current}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          {(Object.entries(CURRENCIES) as [CurrencyCode, { symbol: string; name: string }][]).map(
            ([code, { symbol, name }]) => (
              <option key={code} value={code}>
                {symbol} — {name} ({code})
              </option>
            ),
          )}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
    </form>
  );
}
