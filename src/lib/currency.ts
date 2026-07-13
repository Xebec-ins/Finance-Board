export type CurrencyCode = "INR" | "QAR";

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string }> = {
  INR: { symbol: "₹", name: "Indian Rupee" },
  QAR: { symbol: "QR", name: "Qatari Riyal" },
};

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES[code]?.symbol ?? CURRENCIES[DEFAULT_CURRENCY].symbol;
}

export function formatAmount(value: number, code: CurrencyCode): string {
  return `${currencySymbol(code)} ${value.toFixed(2)}`;
}
