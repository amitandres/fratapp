import LogoutButton from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <a href="/app" className="text-sm font-semibold">
            FratApp
          </a>
          <nav className="flex items-center gap-3 text-sm">
            <a href="/app" className="text-neutral-700 hover:text-black">
              Home
            </a>
            <a href="/app/upload" className="text-neutral-700 hover:text-black">
              Upload
            </a>
            <a href="/app/receipts" className="text-neutral-700 hover:text-black">
              Receipts
            </a>
            <a href="/app/settings" className="text-neutral-700 hover:text-black">
              Settings
            </a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
