import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteTransaction } from "@/app/actions/transactions";
import { currentMonthKey, formatMonthLabel } from "@/lib/month";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import type { TransactionWithCategory } from "@/lib/types";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
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
  const total = (transactions ?? []).reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Transactions
          </h1>
          <p className="text-sm text-neutral-500">
            {formatMonthLabel(month)} · {sym} {total.toFixed(2)} spent
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Add
        </Link>
      </div>

      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {(transactions ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-400">
            No spending recorded for this month yet.
          </p>
        )}
        {(transactions ?? []).map((t) => (
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
