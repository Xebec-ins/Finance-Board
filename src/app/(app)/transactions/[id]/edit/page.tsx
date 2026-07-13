import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, Transaction } from "@/lib/types";
import { EditTransactionForm } from "./edit-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: transaction }, { data: categories }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle<Transaction>(),
    supabase.from("categories").select("*").order("name").returns<Category[]>(),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Edit spending</h1>
      <EditTransactionForm transaction={transaction} categories={categories ?? []} />
    </div>
  );
}
