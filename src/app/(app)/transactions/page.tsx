import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteTransaction } from "@/app/actions/transactions";
import { currentMonthKey, formatMonthLabel } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import type { TransactionWithCategory } from "@/lib/types";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ExportButton } from "./export-button";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; q?: string; tag?: string }>;
}) {
  const { month: monthParam, q, tag } = await searchParams;
  const month = monthParam || currentMonthKey();

  const supabase = await createClient();
  const rangeStart = format(startOfMonth(new Date(month)), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(new Date(month)), "yyyy-MM-dd");

  const [{ data: transactions }, currency] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date", { ascending: false })
      .returns<TransactionWithCategory[]>(),
    getUserCurrency(),
  ]);

  const sym = currencySymbol(currency);
  const monthLabel = formatMonthLabel(month);

  let filtered = transactions ?? [];
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.merchant ?? "").toLowerCase().includes(query) ||
        (t.note ?? "").toLowerCase().includes(query) ||
        (t.category?.name ?? "").toLowerCase().includes(query),
    );
  }
  if (tag) {
    filtered = filtered.filter((t) => (t.tags ?? []).includes(tag));
  }

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  // Collect all unique tags for filter chips
  const allTags = new Set<string>();
  for (const t of transactions ?? []) {
    for (const tg of t.tags ?? []) allTags.add(tg);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Transactions
          </h1>
          <p className="text-sm text-neutral-500">
            {monthLabel} · {sym} {total.toFixed(2)} spent
            {filtered.length !== (transactions ?? []).length
              ? ` (${filtered.length} of ${(transactions ?? []).length})`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton transactions={filtered} monthLabel={monthLabel} sym={sym} />
          <Link
            href="/transactions/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <form className="flex gap-2">
        <input type="hidden" name="month" value={month} />
        <input
          name="q"
          type="text"
          placeholder="Search merchant, note, category…"
          defaultValue={q ?? ""}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Search
        </button>
        {(q || tag) && (
          <Link
            href={`/transactions?month=${month}`}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Tag filter chips */}
      {allTags.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...allTags].sort().map((t) => (
            <Link
              key={t}
              href={`/transactions?month=${month}&tag=${encodeURIComponent(t)}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                tag === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-400">
            {q || tag ? "No transactions match your search." : "No spending recorded for this month yet."}
          </p>
        )}
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: t.category?.color ?? "#6b7280" }}
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {t.merchant || t.category?.name || "Spending"}
                </p>
                <p className="text-xs text-neutral-500">
                  {format(new Date(t.date), "MMM d")}
                  {t.category?.name ? ` · ${t.category.name}` : ""}
                  {t.source === "ocr" ? " · from photo" : ""}
                </p>
                {(t.tags ?? []).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(t.tags ?? []).map((tg) => (
                      <span
                        key={tg}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-neutral-900">
                {sym} {t.amount.toFixed(2)}
              </span>
              <Link
                href={`/transactions/${t.id}/edit`}
                className="text-xs text-neutral-500 underline hover:text-neutral-900"
              >
                Edit
              </Link>
              <form action={deleteTransaction}>
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
    </div>
  );
}
