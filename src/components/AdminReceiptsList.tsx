"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/Drawer";
import { QuickActions } from "@/components/QuickActions";
import { AuditTimeline } from "@/components/AuditTimeline";
import { Input } from "@/components/ui/Input";
import { PhotoModal } from "@/components/PhotoModal";

type Receipt = {
  id: string;
  description: string;
  amount_cents: number;
  category: string;
  status: string;
  photo_key: string;
  paid_via: string | null;
  paid_note: string | null;
  created_at: Date;
  user: {
    email: string;
    profile?: { first_name: string; last_name: string } | null;
  };
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function AdminReceiptsList({
  receipts,
}: {
  receipts: Receipt[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"approve" | "paid" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selected = receipts.find((r) => r.id === selectedId);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === receipts.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(receipts.map((r) => r.id)));
  };

  const runBulkApprove = async () => {
    if (checkedIds.size === 0) return;
    if (!confirm(`Approve ${checkedIds.size} receipt(s)?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/receipts/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds: Array.from(checkedIds) }),
      });
      if (res.ok) {
        setCheckedIds(new Set());
        setBulkAction(null);
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const runBulkPaid = async () => {
    if (checkedIds.size === 0) return;
    if (!confirm(`Mark ${checkedIds.size} receipt(s) as paid?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/receipts/bulk-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds: Array.from(checkedIds) }),
      });
      if (res.ok) {
        setCheckedIds(new Set());
        setBulkAction(null);
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const runBulkReject = async () => {
    if (checkedIds.size === 0 || !rejectReason.trim() || rejectReason.trim().length < 3) return;
    if (!confirm(`Reject ${checkedIds.size} receipt(s) with this reason?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/receipts/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds: Array.from(checkedIds), reason: rejectReason.trim() }),
      });
      if (res.ok) {
        setCheckedIds(new Set());
        setBulkAction(null);
        setRejectReason("");
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submittedIds = receipts.filter((r) => r.status === "submitted").map((r) => r.id);
  const approvedIds = receipts.filter((r) => r.status === "approved").map((r) => r.id);
  const canBulkApprove = checkedIds.size > 0 && Array.from(checkedIds).every((id) => submittedIds.includes(id));
  const canBulkPaid = checkedIds.size > 0 && Array.from(checkedIds).every((id) => approvedIds.includes(id));
  const canBulkReject = checkedIds.size > 0 && Array.from(checkedIds).every((id) => submittedIds.includes(id));

  const openPhoto = async (key: string) => {
    const res = await fetch(`/api/storage/view-url?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.signedUrl) setPhotoViewUrl(data.signedUrl);
  };

  return (
    <>
      {receipts.length > 0 && (
        <div
          className="mb-3 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={checkedIds.size === receipts.length && receipts.length > 0}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-600">Select all on page</span>
        </div>
      )}
      <div className="flex flex-col gap-3 pb-24 md:pb-0">
        {receipts.map((receipt) => {
          const submitterName =
            receipt.user.profile?.first_name && receipt.user.profile?.last_name
              ? `${receipt.user.profile.first_name} ${receipt.user.profile.last_name}`
              : receipt.user.email;

          return (
            <Card
              key={receipt.id}
              className="flex cursor-pointer transition-shadow hover:shadow-md"
              padding="md"
              onClick={() => setSelectedId(receipt.id)}
            >
              <div
                className="flex shrink-0 items-start pt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {(receipt.status === "submitted" || receipt.status === "approved") && (
                  <input
                    type="checkbox"
                    checked={checkedIds.has(receipt.id)}
                    onChange={() => toggleCheck(receipt.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                )}
                {receipt.status !== "submitted" && receipt.status !== "approved" && (
                  <span className="w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1 pl-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 truncate">
                    {receipt.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge status={receipt.status as never} />
                    <span className="text-xs text-neutral-500">
                      {receipt.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {submitterName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(receipt.amount_cents)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(receipt.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

                <div
                  className="mt-3 flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openPhoto(receipt.photo_key)}
                  >
                    View photo
                  </Button>
                  <QuickActions receipt={receipt} onRejectSuccess={() => router.refresh()} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {checkedIds.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg md:bottom-0 md:pb-4">
          <span className="text-sm font-medium text-neutral-700">
            {checkedIds.size} selected
          </span>
          <div className="flex gap-2">
            {canBulkApprove && (
              <Button
                size="sm"
                onClick={runBulkApprove}
                disabled={isSubmitting}
              >
                Approve
              </Button>
            )}
            {canBulkPaid && (
              <Button
                size="sm"
                onClick={runBulkPaid}
                disabled={isSubmitting}
              >
                Mark paid
              </Button>
            )}
            {canBulkReject && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBulkAction("reject")}
                disabled={isSubmitting}
              >
                Reject
              </Button>
            )}
          </div>
        </div>
      )}

      {bulkAction === "reject" && (
        <Drawer
          open
          onClose={() => {
            setBulkAction(null);
            setRejectReason("");
          }}
          title="Reject receipts"
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Reject {checkedIds.size} receipt(s). Reason is required (min 3 characters).
            </p>
            <Input
              label="Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Missing vendor name"
              minLength={3}
            />
            <div className="flex gap-2">
              <Button
                fullWidth
                onClick={runBulkReject}
                disabled={rejectReason.trim().length < 3 || isSubmitting}
              >
                {isSubmitting ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setBulkAction(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.description ?? "Receipt details"}
      >
        {selected && (
          <AdminReceiptDrawer
            receipt={selected}
            onViewPhoto={() => openPhoto(selected.photo_key)}
            onSuccess={() => router.refresh()}
          />
        )}
      </Drawer>

      <PhotoModal imageUrl={photoViewUrl} onClose={() => setPhotoViewUrl(null)} />
    </>
  );
}

function AdminReceiptDrawer({
  receipt,
  onViewPhoto,
  onSuccess,
}: {
  receipt: Receipt;
  onViewPhoto: () => void;
  onSuccess?: () => void;
}) {
  const submitterName =
    receipt.user.profile?.first_name && receipt.user.profile?.last_name
      ? `${receipt.user.profile.first_name} ${receipt.user.profile.last_name}`
      : receipt.user.email;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge status={receipt.status as never} />
        <p className="text-2xl font-semibold">
          {formatCurrency(receipt.amount_cents)}
        </p>
      </div>
      <p className="text-sm text-neutral-600">
        {receipt.category} · {new Date(receipt.created_at).toLocaleDateString()}
      </p>
      <p className="text-sm text-neutral-600">
        Submitted by {submitterName} ({receipt.user.email})
      </p>
      <Button variant="secondary" fullWidth onClick={onViewPhoto}>
        View receipt photo
      </Button>
      <div className="pt-2">
        <QuickActions receipt={receipt} onRejectSuccess={onSuccess} />
      </div>

      <AuditTimeline receiptId={receipt.id} />

      <details className="rounded-lg border border-neutral-200">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          Edit details
        </summary>
        <form
          action="/api/admin/receipts/update"
          method="post"
          className="space-y-3 border-t border-neutral-200 p-3"
        >
          <input type="hidden" name="receiptId" value={receipt.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Status</label>
              <select
                name="status"
                defaultValue={receipt.status}
                className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
              >
                <option value="submitted">submitted</option>
                <option value="approved">approved</option>
                <option value="paid">paid</option>
                <option value="rejected">rejected</option>
                <option value="needs_review">needs_review</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Amount</label>
              <input
                name="amount"
                defaultValue={(receipt.amount_cents / 100).toFixed(2)}
                className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Description</label>
            <input
              name="description"
              defaultValue={receipt.description}
              className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Category</label>
              <select
                name="category"
                defaultValue={receipt.category}
                className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
              >
                <option value="food">food</option>
                <option value="drinks">drinks</option>
                <option value="hardware">hardware</option>
                <option value="lights">lights</option>
                <option value="other">other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Paid via</label>
              <select
                name="paidVia"
                defaultValue={receipt.paid_via ?? ""}
                className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
              >
                <option value="">-</option>
                <option value="venmo">venmo</option>
                <option value="zelle">zelle</option>
                <option value="paypal">paypal</option>
                <option value="cash">cash</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Paid note</label>
            <input
              name="paidNote"
              defaultValue={receipt.paid_note ?? ""}
              className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            />
          </div>
          <Button type="submit" fullWidth>
            Save changes
          </Button>
        </form>
      </details>
    </div>
  );
}
