"use client";

import { transactionsToCsv, downloadCsv } from "@/lib/export";
import type { TransactionWithCategory } from "@/lib/types";

export function ExportButton({
  transactions,
  monthLabel,
  sym,
}: {
  transactions: TransactionWithCategory[];
  monthLabel: string;
  sym: string;
}) {
  function handleExport() {
    const csv = transactionsToCsv(transactions, sym);
    downloadCsv(csv, `transactions-${monthLabel.replace(/\s/g, "-").toLowerCase()}.csv`);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
    >
      Export CSV
    </button>
  );
}
