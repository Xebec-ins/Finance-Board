"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";

export function MonthNav({
  month,
  extraParams,
}: {
  month: string;
  extraParams?: Record<string, string>;
}) {
  const pathname = usePathname();
  const current = new Date(month);
  const prev = format(subMonths(current, 1), "yyyy-MM-dd");
  const next = format(addMonths(current, 1), "yyyy-MM-dd");
  const label = format(current, "MMMM yyyy");

  function buildHref(m: string) {
    const params = new URLSearchParams({ month: m, ...extraParams });
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={buildHref(prev)}
        className="rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        &larr;
      </Link>
      <span className="min-w-[10rem] text-center text-sm font-medium text-neutral-900">
        {label}
      </span>
      <Link
        href={buildHref(next)}
        className="rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        &rarr;
      </Link>
    </div>
  );
}
