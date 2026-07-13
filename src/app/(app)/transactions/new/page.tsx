import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { TransactionForm } from "./transaction-form";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })
    .returns<Category[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">
          Add spending
        </h1>
        <p className="text-sm text-neutral-500">
          Type it in, or snap a photo of the receipt and we&apos;ll try to
          read the total.
        </p>
      </div>

      <TransactionForm categories={categories ?? []} />
    </div>
  );
}
