import Link from "next/link";
import { logout } from "@/app/actions/auth";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/recurring", label: "Recurring" },
  { href: "/charts", label: "Charts" },
  { href: "/compare", label: "Compare" },
  { href: "/annual", label: "Annual" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-neutral-900">Budget</span>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <div className="hidden items-center gap-3 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-neutral-900">
                  {link.label}
                </Link>
              ))}
            </div>
            <form action={logout}>
              <button type="submit" className="hover:text-neutral-900">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white lg:hidden">
        <div className="flex items-center justify-around py-2 overflow-x-auto">
          {NAV_LINKS.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/transactions/new"
            className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap"
          >
            + Add
          </Link>
        </div>
        <div className="flex items-center justify-around pb-2">
          {NAV_LINKS.slice(4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
