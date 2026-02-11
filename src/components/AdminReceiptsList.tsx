"use client";

import { useState, useEffect } from "react";
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
  rejection_reason?: string | null;
  rejected_at?: Date | string | null;
  rejected_by_user?: {
    profile?: { first_name: string; last_name: string } | null;
    email?: string;
  } | null;
  user: {
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
      payment_method?: string;
      payment_handle?: string | null;
    } | null;
  };
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const REJECTION_PRESETS = [
  "Missing itemized receipt",
  "Wrong category",
  "Not eligible for reimbursement",
  "Duplicate receipt",
] as const;

function formatPaymentInfo(method?: string, handle?: string | null) {
  if (!handle?.trim()) return null;
  const m = (method ?? "").toLowerCase();
  if (m === "venmo") return `Venmo @${handle.replace(/^@/, "")}`;
  if (m === "cashapp") return `CashApp $${handle.replace(/^\$/, "")}`;
  if (m === "zelle") return `Zelle ${handle}`;
  if (m === "paypal") return `PayPal ${handle}`;
  return handle;
}

export function AdminReceiptsList({
  receipts,
}: {
  receipts: Receipt[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const [rightPanelPhotoUrl, setRightPanelPhotoUrl] = useState<string | null>(null);
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
    await runBulkApproveFor(Array.from(checkedIds));
  };

  const runBulkApproveFor = async (receiptIds: string[]) => {
    if (receiptIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/receipts/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds }),
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
  const allSubmitted = receipts.length > 0 && receipts.every((r) => r.status === "submitted");
  const canBulkApprove = checkedIds.size > 0 && Array.from(checkedIds).every((id) => submittedIds.includes(id));
  const canBulkPaid = checkedIds.size > 0 && Array.from(checkedIds).every((id) => approvedIds.includes(id));
  const canBulkReject = checkedIds.size > 0 && Array.from(checkedIds).every((id) => submittedIds.includes(id));

  const openPhoto = async (key: string) => {
    const res = await fetch(`/api/storage/view-url?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.signedUrl) setPhotoViewUrl(data.signedUrl);
  };

  const fetchPhotoForPanel = async (key: string) => {
    const res = await fetch(`/api/storage/view-url?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    setRightPanelPhotoUrl(data.signedUrl ?? null);
  };

  const handleSelectReceipt = (receipt: Receipt) => {
    setSelectedId(receipt.id);
    fetchPhotoForPanel(receipt.photo_key);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      {receipts.length > 0 && (
        <div
          className="mb-3 flex flex-wrap items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkedIds.size === receipts.length && receipts.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600">Select all on page</span>
          </div>
          {allSubmitted && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (confirm(`Approve all ${receipts.length} receipt(s)?`)) {
                    runBulkApproveFor(receipts.map((r) => r.id));
                  }
                }}
                disabled={isSubmitting}
              >
                Approve all
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCheckedIds(new Set(receipts.map((r) => r.id)));
                  setBulkAction("reject");
                }}
              >
                Reject all
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-3 pb-24 md:pb-0">
        {receipts.map((receipt) => {
          const submitterName =
            receipt.user.profile?.first_name && receipt.user.profile?.last_name
              ? `${receipt.user.profile.first_name} ${receipt.user.profile.last_name}`
              : receipt.user.email;
          const paymentInfo = formatPaymentInfo(
            receipt.user.profile?.payment_method,
            receipt.user.profile?.payment_handle
          );

          return (
            <Card
              key={receipt.id}
              className={`flex cursor-pointer transition-shadow hover:shadow-md ${selectedId === receipt.id ? "ring-2 ring-black" : ""}`}
              padding="md"
              onClick={() => handleSelectReceipt(receipt)}
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
                  <div className="mt-2 rounded-md bg-neutral-100 px-2 py-1 inline-block">
                    <p className="text-sm font-medium text-neutral-800">
                      Submitted by {submitterName}
                    </p>
                    {paymentInfo && (
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {paymentInfo}
                      </p>
                    )}
                  </div>
                  {receipt.status === "rejected" && receipt.rejection_reason && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-red-600">Reason: {receipt.rejection_reason}</p>
                      <p className="text-xs text-neutral-500">
                        {receipt.rejected_at
                          ? `Rejected ${new Date(receipt.rejected_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : "Rejected"}
                        {receipt.rejected_by_user?.profile
                          ? ` by ${receipt.rejected_by_user.profile.first_name} ${receipt.rejected_by_user.profile.last_name}`
                          : receipt.rejected_by_user?.email
                            ? ` by ${receipt.rejected_by_user.email}`
                            : ""}
                      </p>
                    </div>
                  )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      openPhoto(receipt.photo_key);
                    }}
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

      {selected && (
        <div className="hidden md:block w-[340px] shrink-0 sticky top-24">
          <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            {rightPanelPhotoUrl ? (
              <img
                src={rightPanelPhotoUrl}
                alt={selected.description}
                className="w-full aspect-[3/4] object-contain bg-neutral-100"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-500 text-sm">
                Loading…
              </div>
            )}
            <div className="p-3 border-t border-neutral-200">
              <p className="font-medium text-neutral-900 truncate">{selected.description}</p>
              <p className="text-lg font-semibold mt-1">{formatCurrency(selected.amount_cents)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => openPhoto(selected.photo_key)}>
                  Full screen
                </Button>
                <QuickActions receipt={selected} onRejectSuccess={() => router.refresh()} />
              </div>
            </div>
          </div>
        </div>
      )}

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
              Reject {checkedIds.size} receipt(s). Reason is required (min 3 characters). Select a preset or type your own.
            </p>
            <div className="flex flex-wrap gap-2">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    rejectReason === preset
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              label="Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Or type a custom reason…"
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
        className="md:hidden"
      >
        {selected && (
          <AdminReceiptDrawer
            receipt={selected}
            onViewPhoto={() => openPhoto(selected.photo_key)}
            onSuccess={() => router.refresh()}
            showPhotoInline
          />
        )}
      </Drawer>

      <PhotoModal imageUrl={photoViewUrl} onClose={() => setPhotoViewUrl(null)} />
    </div>
  );
}

function AdminReceiptDrawer({
  receipt,
  onViewPhoto,
  onSuccess,
  showPhotoInline,
}: {
  receipt: Receipt;
  onViewPhoto: () => void;
  onSuccess?: () => void;
  showPhotoInline?: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [inlinePhotoUrl, setInlinePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (showPhotoInline && receipt.photo_key) {
      fetch(`/api/storage/view-url?key=${encodeURIComponent(receipt.photo_key)}`)
        .then((r) => r.json())
        .then((d) => setInlinePhotoUrl(d.signedUrl ?? null));
    }
  }, [showPhotoInline, receipt.photo_key]);

  const submitterName =
    receipt.user.profile?.first_name && receipt.user.profile?.last_name
      ? `${receipt.user.profile.first_name} ${receipt.user.profile.last_name}`
      : receipt.user.email;
  const paymentInfo = formatPaymentInfo(
    receipt.user.profile?.payment_method,
    receipt.user.profile?.payment_handle
  );

  return (
    <div className="space-y-4">
      {showPhotoInline && (
        <div className="-mx-4 -mt-2 mb-2">
          {inlinePhotoUrl ? (
            <img
              src={inlinePhotoUrl}
              alt={receipt.description}
              className="w-full aspect-[3/4] object-contain bg-neutral-100 cursor-pointer"
              onClick={onViewPhoto}
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-500 text-sm">
              Loading…
            </div>
          )}
          <p className="text-xs text-neutral-500 mt-1 text-center">Tap to full screen</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Badge status={receipt.status as never} />
        <p className="text-2xl font-semibold">
          {formatCurrency(receipt.amount_cents)}
        </p>
      </div>
      {receipt.status === "rejected" && (receipt.rejection_reason || receipt.rejected_at) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
          {receipt.rejection_reason && (
            <p className="text-sm text-red-800 font-medium">Reason: {receipt.rejection_reason}</p>
          )}
          <p className="text-xs text-red-700">
            {receipt.rejected_at
              ? `Rejected ${new Date(receipt.rejected_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
              : "Rejected"}
            {receipt.rejected_by_user?.profile
              ? ` by ${receipt.rejected_by_user.profile.first_name} ${receipt.rejected_by_user.profile.last_name}`
              : receipt.rejected_by_user?.email
                ? ` by ${receipt.rejected_by_user.email}`
                : ""}
          </p>
        </div>
      )}
      <p className="text-sm text-neutral-600">
        {receipt.category} · {new Date(receipt.created_at).toLocaleDateString()}
      </p>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-sm font-medium text-neutral-800">
          Submitted by {submitterName}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">{receipt.user.email}</p>
        {paymentInfo && (
          <p className="text-sm font-medium text-neutral-700 mt-2">
            Pay via {paymentInfo}
          </p>
        )}
      </div>
      <Button variant="secondary" fullWidth onClick={onViewPhoto}>
        View receipt photo
      </Button>
      <div className="pt-2">
        <QuickActions receipt={receipt} onRejectSuccess={onSuccess} />
      </div>

      <Button
        variant="danger"
        fullWidth
        onClick={() => setShowDeleteConfirm(true)}
        className="mt-4"
      >
        Delete receipt
      </Button>

      {showDeleteConfirm && (
        <Drawer
          open
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirm("");
          }}
          title="Delete receipt"
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This cannot be undone. Type DELETE to confirm.
            </p>
            <Input
              label="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="danger"
                fullWidth
                disabled={deleteConfirm !== "DELETE" || isDeleting}
                onClick={async () => {
                  if (deleteConfirm !== "DELETE") return;
                  setIsDeleting(true);
                  try {
                    const res = await fetch(`/api/admin/receipts/${receipt.id}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ confirm: "DELETE" }),
                    });
                    if (res.ok) {
                      setShowDeleteConfirm(false);
                      setDeleteConfirm("");
                      onSuccess?.();
                    } else {
                      const d = await res.json().catch(() => ({}));
                      alert(d.error ?? "Failed to delete");
                    }
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "Deleting…" : "Delete permanently"}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirm("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Drawer>
      )}

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
