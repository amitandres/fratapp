export default function AppHome() {
  return (
    <main className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">App</h1>
      <p className="text-sm text-neutral-600">You are logged in.</p>
      <div className="mt-4 rounded-md border border-neutral-200 p-4 text-sm">
        Next: invite-only signup, receipts, and admin flows.
      </div>
    </main>
  );
}
