"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/Drawer";
import { QuickActions } from "@/components/QuickActions";

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

const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function AdminReceiptsList({
  receipts,
}: {
  receipts: Receipt[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = receipts.find((r) => r.id === selectedId);

  const openPhoto = async (key: string) => {
    const res = await fetch(`/api/storage/view-url?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {receipts.map((receipt) => {
          const submitterName =
            receipt.user.profile?.first_name && receipt.user.profile?.last_name
              ? `${receipt.user.profile.first_name} ${receipt.user.profile.last_name}`
              : receipt.user.email;

          return (
            <Card
              key={receipt.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              padding="md"
              onClick={() => setSelectedId(receipt.id)}
            >
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
                <QuickActions receipt={receipt} />
              </div>
            </Card>
          );
        })}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.description ?? "Receipt details"}
      >
        {selected && (
          <AdminReceiptDrawer
            receipt={selected}
            onViewPhoto={() => openPhoto(selected.photo_key)}
          />
        )}
      </Drawer>
    </>
  );
}

function AdminReceiptDrawer({
  receipt,
  onViewPhoto,
}: {
  receipt: Receipt;
  onViewPhoto: () => void;
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
        <QuickActions receipt={receipt} />
      </div>

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
