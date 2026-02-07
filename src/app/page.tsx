import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">FratApp</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Track receipts and reimbursements for your chapter.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <a href="/login">
          <Button fullWidth size="lg">Log in</Button>
        </a>
        <a href="/signup">
          <Button variant="secondary" fullWidth size="lg">
            Enter invite code
          </Button>
        </a>
        <a href="/setup-chapter">
          <Button variant="secondary" fullWidth size="lg">
            Set up a new chapter
          </Button>
        </a>
      </div>
    </main>
  );
}
