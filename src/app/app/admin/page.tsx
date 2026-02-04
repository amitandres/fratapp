import { requireRole } from "@/lib/auth";

export default async function AdminPage() {
  await requireRole("admin");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-sm text-neutral-600">Admin-only area.</p>
    </main>
  );
}
