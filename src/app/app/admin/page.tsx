import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminReceiptsList } from "@/components/AdminReceiptsList";

export default async function AdminPage() {
  const session = await requireRole("admin");

  const receipts = await prisma.receipts.findMany({
    where: { org_id: session.orgId },
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

  const totalAll = receipts.reduce((sum, r) => sum + r.amount_cents, 0);
  const totalByStatus = receipts.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + r.amount_cents;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatCurrency = (cents: number) =>
    `$${(cents / 100).toFixed(2)}`;

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
          href="/app/admin/org"
          className="shrink-0 text-sm font-medium text-neutral-600 hover:text-black"
        >
          Org settings →
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card padding="sm">
          <p className="text-xs text-neutral-500">Total</p>
          <p className="text-lg font-semibold">{formatCurrency(totalAll)}</p>
        </Card>
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
          <p className="text-xs text-neutral-500">Paid</p>
          <p className="text-lg font-semibold">
            {formatCurrency(totalByStatus.paid || 0)}
          </p>
        </Card>
      </div>

      {/* Filter bar + Export */}
      <Card padding="sm">
        <form
          action="/api/admin/receipts/export"
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Status</label>
            <select
              name="status"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              defaultValue=""
            >
              <option value="">All</option>
              <option value="submitted">submitted</option>
              <option value="approved">approved</option>
              <option value="paid">paid</option>
              <option value="rejected">rejected</option>
              <option value="needs_review">needs_review</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">From</label>
            <input
              type="date"
              name="from"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">To</label>
            <input
              type="date"
              name="to"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Export CSV
          </Button>
        </form>
      </Card>

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
