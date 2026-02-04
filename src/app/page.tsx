export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <h1 className="text-3xl font-semibold">FratApp</h1>
      <p className="mt-3 text-sm text-neutral-600">
        Track receipts and reimbursements for your chapter.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <a
          href="/login"
          className="rounded-md bg-black px-4 py-2 text-center text-sm font-semibold text-white"
        >
          Log in
        </a>
        <a
          href="/signup"
          className="rounded-md border border-neutral-200 px-4 py-2 text-center text-sm font-semibold"
        >
          Enter invite code
        </a>
      </div>
    </main>
  );
}
