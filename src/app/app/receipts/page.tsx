import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";

export default async function ReceiptsPage() {
  const session = await requireCurrentUserAndProfile();

  const receipts = await prisma.receipts.findMany({
    where: {
      org_id: session.orgId,
      ...(session.role === "member" ? { user_id: session.userId } : {}),
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {session.role === "admin"
            ? "All receipts in your org."
            : "Your submitted receipts."}
        </p>
      </div>

      {receipts.length === 0 ? (
        <p className="text-sm text-neutral-600">No receipts yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="rounded-md border border-neutral-200 p-4 text-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{receipt.description}</p>
                  <p className="text-neutral-600">
                    {receipt.category} • {receipt.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ${(receipt.amount_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {receipt.created_at.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form
                action={`/api/storage/view-url?key=${encodeURIComponent(
                  receipt.photo_key
                )}`}
                method="get"
                target="_blank"
                className="mt-3"
              >
                <button
                  type="submit"
                  className="rounded-md border border-neutral-200 px-3 py-2 text-xs font-semibold"
                >
                  View receipt image
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
