import { createClient } from "@/lib/supabase/server";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import {
  applyRecurringForMonth,
  toggleRecurring,
  deleteRecurring,
} from "@/app/actions/recurring";
import type { Category, RecurringTemplateWithCategory } from "@/lib/types";
import { RecurringForm } from "./recurring-form";

export default async function RecurringPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: categories }, currency] =
    await Promise.all([
      supabase
        .from("recurring_templates")
        .select("*, category:categories(*)")
        .order("day_of_month", { ascending: true })
        .returns<RecurringTemplateWithCategory[]>(),
      supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true })
        .returns<Category[]>(),
      getUserCurrency(),
    ]);

  const sym = currencySymbol(currency);
  const rows = templates ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Recurring Bills
          </h1>
          <p className="text-sm text-neutral-500">
            Templates that repeat every month.
          </p>
        </div>
        <form action={applyRecurringForMonth}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Apply recurring bills for this month
          </button>
        </form>
      </div>

      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-400">
            No recurring bills set up yet.
          </p>
        )}
        {rows.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: t.category?.color ?? "#6b7280",
                }}
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {t.merchant || t.note || "Recurring"}
                </p>
                <p className="text-xs text-neutral-500">
                  {t.category?.name ?? "Uncategorized"} &middot; Due on day{" "}
                  {t.day_of_month}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-neutral-900">
                {sym} {t.amount.toFixed(2)}
              </span>

              <form action={toggleRecurring}>
                <input type="hidden" name="id" value={t.id} />
                <input
                  type="hidden"
                  name="is_active"
                  value={String(t.is_active)}
                />
                <button
                  type="submit"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                    t.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  {t.is_active ? "Active" : "Paused"}
                </button>
              </form>

              <form action={deleteRecurring}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="text-xs text-neutral-500 hover:text-red-600"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Add recurring bill
        </h2>
        <RecurringForm categories={categories ?? []} />
      </section>
    </div>
  );
}
