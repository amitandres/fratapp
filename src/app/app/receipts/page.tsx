import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ReceiptsList } from "@/components/ReceiptsList";

export default async function ReceiptsPage() {
  const session = await requireCurrentUserAndProfile();

  const receipts = await prisma.receipts.findMany({
    where: {
      org_id: session.orgId,
      ...(session.role === "member" ? { user_id: session.userId } : {}),
    },
    include:
      session.role === "admin"
        ? {
            user: {
              include: {
                profile: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          }
        : undefined,
    orderBy: { created_at: "desc" },
  });

  const memberTotals =
    session.role === "member"
      ? receipts.reduce(
          (acc, r) => {
            acc.total += r.amount_cents;
            if (r.status === "submitted") acc.submitted += r.amount_cents;
            if (r.status === "approved") acc.approved += r.amount_cents;
            if (r.status === "paid") acc.paid += r.amount_cents;
            return acc;
          },
          { total: 0, submitted: 0, approved: 0, paid: 0 }
        )
      : null;

  const formatCurrency = (cents: number) =>
    `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Receipts</h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          {session.role === "admin"
            ? "All receipts in your org."
            : "Your submitted receipts."}
        </p>
      </div>

      {session.role === "member" && memberTotals && receipts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card padding="sm">
            <p className="text-xs text-neutral-500">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(memberTotals.total)}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-neutral-500">Pending</p>
            <p className="text-lg font-semibold">{formatCurrency(memberTotals.submitted)}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-neutral-500">Approved</p>
            <p className="text-lg font-semibold">{formatCurrency(memberTotals.approved)}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-neutral-500">Paid</p>
            <p className="text-lg font-semibold">{formatCurrency(memberTotals.paid)}</p>
          </Card>
        </div>
      )}

      <ReceiptsList
        receipts={receipts as never[]}
        showSubmitter={session.role === "admin"}
      />
    </div>
  );
}
