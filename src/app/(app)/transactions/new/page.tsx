import { createClient } from "@/lib/supabase/server";
import type { Category, QuickTemplateWithCategory } from "@/lib/types";
import { getUserCurrency } from "@/lib/user-prefs";
import { currencySymbol } from "@/lib/currency";
import { TransactionForm } from "./transaction-form";
import { QuickAddSection } from "./quick-add-section";

export default async function NewTransactionPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: quickTemplates }, currency] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true })
      .returns<Category[]>(),
    supabase
      .from("quick_templates")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: true })
      .returns<QuickTemplateWithCategory[]>(),
    getUserCurrency(),
  ]);

  const sym = currencySymbol(currency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Add spending</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Type it in, or snap a photo of the receipt and we&apos;ll try to read the total.
        </p>
      </div>

      {(quickTemplates ?? []).length > 0 && (
        <QuickAddSection templates={quickTemplates ?? []} sym={sym} />
      )}

      <TransactionForm categories={categories ?? []} />
    </div>
  );
}
