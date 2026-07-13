import { startOfMonth, format } from "date-fns";

/** Returns today's month as an ISO date string for the 1st, e.g. "2026-07-01". */
export function currentMonthKey(): string {
  return format(startOfMonth(new Date()), "yyyy-MM-dd");
}

export function monthKey(date: Date): string {
  return format(startOfMonth(date), "yyyy-MM-dd");
}

export function formatMonthLabel(monthKeyStr: string): string {
  return format(new Date(monthKeyStr), "MMMM yyyy");
}
