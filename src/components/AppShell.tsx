"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/app", label: "Home", icon: "🏠" },
  { href: "/app/upload", label: "Upload", icon: "📤" },
  { href: "/app/receipts", label: "Receipts", icon: "🧾" },
  { href: "/app/admin", label: "Admin", icon: "⚙️", adminOnly: true },
  { href: "/app/admin/org", label: "Org", icon: "🏛️", adminOnly: true, desktopOnly: true },
  { href: "/app/settings", label: "Settings", icon: "👤" },
];

export function AppShell({
  children,
  orgName,
  role,
  isAdmin,
}: {
  children: React.ReactNode;
  orgName: string;
  role?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((i) => !i.adminOnly || isAdmin);
  const mobileItems = visibleItems.filter((i) => !(i as { desktopOnly?: boolean }).desktopOnly);
  const desktopItems = visibleItems;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 pb-20 md:pb-0">
      {/* Top nav - desktop */}
      <header className="sticky top-0 z-10 hidden border-b border-neutral-200 bg-white md:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">
              {orgName}
            </h1>
            <p className="text-xs text-neutral-500">{role ?? "member"}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 border-t border-neutral-100 px-4 py-2">
          {desktopItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-neutral-100 text-black"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 md:mx-auto md:w-full md:max-w-3xl md:px-6 md:py-8">
        {children}
      </main>

      {/* Bottom tab bar - mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-xs ${
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "text-black font-semibold"
                : "text-neutral-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
