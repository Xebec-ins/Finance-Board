"use client";

import { useQuickTemplate } from "@/app/actions/quick-templates";
import type { QuickTemplateWithCategory } from "@/lib/types";

export function QuickAddSection({
  templates,
  sym,
}: {
  templates: QuickTemplateWithCategory[];
  sym: string;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-900">Quick add</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {templates.map((t) => (
          <form key={t.id} action={useQuickTemplate}>
            <input type="hidden" name="id" value={t.id} />
            <button
              type="submit"
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 transition"
            >
              <span className="flex items-center gap-1.5">
                {t.category && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.category.color }}
                  />
                )}
                {t.label}
                <span className="text-neutral-400">
                  {sym} {t.amount.toFixed(2)}
                </span>
              </span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
