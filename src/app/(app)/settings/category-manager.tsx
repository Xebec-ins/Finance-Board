"use client";

import { useActionState } from "react";
import { createCategory, deleteCategory } from "@/app/actions/categories";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [result, formAction, isPending] = useActionState(
    createCategory,
    undefined,
  );

  return (
    <div className="mt-4 space-y-4">
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
            <button
              type="button"
              onClick={() => deleteCategory(category.id)}
              className="text-neutral-400 hover:text-red-600"
              aria-label={`Delete ${category.name}`}
            >
              ×
            </button>
          </li>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-neutral-400">No categories yet.</p>
        )}
      </ul>

      <form action={formAction} className="flex items-center gap-2">
        <input
          name="name"
          type="text"
          placeholder="New category name"
          required
          className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
    </div>
  );
}
