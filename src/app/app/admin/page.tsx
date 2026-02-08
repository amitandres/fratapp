import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { AdminReceiptsList } from "@/components/AdminReceiptsList";
import { AdminReceiptStatusTabs } from "@/components/AdminReceiptStatusTabs";

const STATUS_VALUES = ["submitted", "approved", "paid", "rejected", "needs_review"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }> | { status?: string };
}) {
  const session = await requireAdminRole();
  const params = "then" in searchParams && typeof (searchParams as Promise<unknown>).then === "function"
    ? await (searchParams as Promise<{ status?: string }>)
    : (searchParams as { status?: string });
  const statusFilter =
    params.status && STATUS_VALUES.includes(params.status as (typeof STATUS_VALUES)[number])
      ? (params.status as (typeof STATUS_VALUES)[number])
      : "submitted";

  const receipts = await prisma.receipts.findMany({
    where: { org_id: session.orgId, status: statusFilter },
    include: {
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
    },
    orderBy: { created_at: "desc" },
  });

  const allReceipts = await prisma.receipts.findMany({
    where: { org_id: session.orgId },
    select: { status: true, amount_cents: true },
  });
  const totalAll = allReceipts.reduce((sum, r) => sum + r.amount_cents, 0);
  const totalByStatus = allReceipts.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + r.amount_cents;
      return acc;
    },
    {} as Record<string, number>
  );
  const outstanding = totalByStatus.approved || 0;

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Admin receipts</h1>
          <p className="mt-0.5 text-sm text-neutral-600">
            Approve, reject, or mark receipts as paid.
          </p>
        </div>
        <a
          href="/app/settings"
          className="shrink-0 text-sm font-medium text-neutral-600 hover:text-black"
        >
          Settings →
        </a>
      </div>

      {/* Stat cards: Submitted, Approved, Outstanding, Paid, Total */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card padding="sm">
          <p className="text-xs text-neutral-500">Submitted</p>
          <p className="text-lg font-semibold">
            {formatCurrency(totalByStatus.submitted || 0)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-neutral-500">Approved</p>
          <p className="text-lg font-semibold">
            {formatCurrency(totalByStatus.approved || 0)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-neutral-500">Outstanding</p>
          <p className="text-lg font-semibold">{formatCurrency(outstanding)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-neutral-500">Paid</p>
          <p className="text-lg font-semibold">
            {formatCurrency(totalByStatus.paid || 0)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-neutral-500">Total</p>
          <p className="text-lg font-semibold">{formatCurrency(totalAll)}</p>
        </Card>
      </div>

      {/* Status tabs + Export (secondary) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminReceiptStatusTabs currentStatus={statusFilter} />
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-neutral-600 hover:text-black">
            Export CSV
          </summary>
          <form
            action="/api/admin/receipts/export"
            method="get"
            className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
          >
            <input type="hidden" name="status" value={statusFilter} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">From</label>
              <input
                type="date"
                name="from"
                className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">To</label>
              <input
                type="date"
                name="to"
                className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300"
            >
              Download
            </button>
          </form>
        </details>
      </div>

      {receipts.length === 0 ? (
        <Card className="flex flex-col items-center py-12 text-center">
          <span className="text-4xl">🧾</span>
          <p className="mt-3 text-sm font-medium text-neutral-900">
            No receipts yet
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Receipts submitted by members will appear here.
          </p>
        </Card>
      ) : (
        <AdminReceiptsList receipts={receipts} />
      )}
    </div>
  );
}
