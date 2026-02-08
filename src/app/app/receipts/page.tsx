import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";
import { canViewAllReceipts } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { ReceiptsList } from "@/components/ReceiptsList";
import { ReceiptStatusTabs } from "@/components/ReceiptStatusTabs";

const STATUS_VALUES = ["submitted", "approved", "rejected", "paid", "needs_review"] as const;

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }> | { status?: string };
}) {
  const session = await requireCurrentUserAndProfile();
  const params = "then" in searchParams && typeof (searchParams as Promise<unknown>).then === "function"
    ? await (searchParams as Promise<{ status?: string }>)
    : (searchParams as { status?: string });
  const statusFilter =
    params.status && STATUS_VALUES.includes(params.status as (typeof STATUS_VALUES)[number])
      ? (params.status as (typeof STATUS_VALUES)[number])
      : undefined;

  const receipts = await prisma.receipts.findMany({
    where: {
      org_id: session.orgId,
      ...(!canViewAllReceipts(session.role as "member" | "treasurer" | "exec" | "admin") ? { user_id: session.userId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include:
      canViewAllReceipts(session.role as "member" | "treasurer" | "exec" | "admin")
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
    !canViewAllReceipts(session.role as "member" | "treasurer" | "exec" | "admin")
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
          {canViewAllReceipts(session.role as "member" | "treasurer" | "exec" | "admin")
            ? "All receipts in your org."
            : "Your submitted receipts."}
        </p>
      </div>

      <Suspense fallback={null}>
        <ReceiptStatusTabs currentStatus={statusFilter ?? ""} />
      </Suspense>

      {memberTotals && receipts.length > 0 && (
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
        showSubmitter={canViewAllReceipts(session.role as "member" | "treasurer" | "exec" | "admin")}
      />
    </div>
  );
}
