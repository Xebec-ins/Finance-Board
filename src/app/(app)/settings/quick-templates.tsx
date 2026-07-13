"use client";

import { useActionState } from "react";
import { createQuickTemplate, deleteQuickTemplate } from "@/app/actions/quick-templates";
import type { Category, QuickTemplateWithCategory } from "@/lib/types";

export function QuickTemplateManager({
  templates,
  categories,
  sym,
}: {
  templates: QuickTemplateWithCategory[];
  categories: Category[];
  sym: string;
}) {
  const [result, formAction, isPending] = useActionState(createQuickTemplate, undefined);

  return (
    <div className="mt-4 space-y-4">
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm"
            >
              {t.category && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: t.category.color }}
                />
              )}
              <span className="text-neutral-700">{t.label}</span>
              <span className="text-neutral-400">
                {sym} {t.amount.toFixed(2)}
              </span>
              <form action={deleteQuickTemplate} className="inline">
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="text-neutral-400 hover:text-red-600"
                >
                  ×
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
      {templates.length === 0 && (
        <p className="text-sm text-neutral-400">
          No quick templates yet. Add common expenses for one-tap entry.
        </p>
      )}

      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          name="label"
          type="text"
          placeholder="Label (e.g. Coffee)"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <select
          name="category_id"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>
      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
    </div>
  );
}
