import type { TransactionWithCategory } from "@/lib/types";

export function transactionsToCsv(
  transactions: TransactionWithCategory[],
  currencySymbol: string,
): string {
  const header = "Date,Merchant,Category,Amount,Tags,Note,Source";
  const rows = transactions.map((t) => {
    const date = t.date;
    const merchant = escape(t.merchant ?? "");
    const category = escape(t.category?.name ?? "Uncategorized");
    const amount = `${currencySymbol} ${t.amount.toFixed(2)}`;
    const tags = escape((t.tags ?? []).join(", "));
    const note = escape(t.note ?? "");
    const source = t.source;
    return `${date},${merchant},${category},${amount},${tags},${note},${source}`;
  });
  return [header, ...rows].join("\n");
}

function escape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
