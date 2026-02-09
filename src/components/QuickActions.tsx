"use client";

import { useState } from "react";
import { Drawer } from "@/components/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Receipt = {
  id: string;
  status: string;
  amount_cents: number;
  description: string;
  category: string;
  paid_via: string | null;
  paid_note: string | null;
};

export function QuickActions({
  receipt,
  onRejectSuccess,
}: {
  receipt: Receipt;
  onRejectSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const submitReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 3) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/receipts/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: receipt.id, reason: rejectReason.trim() }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason("");
        (onRejectSuccess ?? (() => window.location.reload()))();
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to reject");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    if (action === "rejected") {
      setShowRejectModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("receiptId", receipt.id);
      formData.append("status", action);

      if (action === "paid" && !receipt.paid_via) {
        formData.append("paidVia", "venmo");
      }

      const response = await fetch("/api/admin/receipts/update", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        (onRejectSuccess ?? (() => window.location.reload()))();
      } else {
        const d = await response.json().catch(() => ({}));
        alert(d.error ?? "Failed to update receipt");
      }
    } catch {
      alert("Error updating receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {receipt.status === "submitted" && (
        <>
          <button
            onClick={() => handleAction("approved")}
            disabled={isSubmitting}
            className="rounded-md bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction("rejected")}
            disabled={isSubmitting}
            className="rounded-md border border-neutral-200 px-3 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}
      {receipt.status === "approved" && (
        <button
          onClick={() => handleAction("paid")}
          disabled={isSubmitting}
          className="rounded-md bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Mark Paid
        </button>
      )}
      {receipt.status === "paid" && (
        <span className="rounded-md bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600">
          Paid
        </span>
      )}
      {receipt.status === "rejected" && (
        <span className="rounded-md bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600">
          Rejected
        </span>
      )}

      <Drawer
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        title="Reject receipt"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Provide a reason for rejecting this receipt (min 3 characters).
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
              onClick={submitReject}
              disabled={rejectReason.trim().length < 3 || isSubmitting}
            >
              {isSubmitting ? "Rejecting..." : "Reject"}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
