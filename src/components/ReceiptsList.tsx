"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/Drawer";

type Receipt = {
  id: string;
  description: string;
  amount_cents: number;
  category: string;
  status: "submitted" | "approved" | "paid" | "rejected" | "needs_review";
  photo_key: string;
  created_at: Date;
  user?: { profile?: { first_name: string; last_name: string }; email?: string };
};

const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function ReceiptsList({
  receipts,
  showSubmitter,
}: {
  receipts: Receipt[];
  showSubmitter: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const selected = receipts.find((r) => r.id === selectedId);

  const openPhoto = async (key: string) => {
    const res = await fetch(`/api/storage/view-url?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <>
      {receipts.length === 0 ? (
        <Card className="flex flex-col items-center py-12 text-center">
          <span className="text-4xl">🧾</span>
          <p className="mt-3 text-sm font-medium text-neutral-900">
            No receipts yet
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Upload your first receipt to get started.
          </p>
          <a href="/app/upload">
            <Button className="mt-4">Upload receipt</Button>
          </a>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {receipts.map((receipt) => (
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
                    <Badge status={receipt.status} />
                    <span className="text-xs text-neutral-500">
                      {receipt.category}
                    </span>
                  </div>
                  {showSubmitter && receipt.user?.profile && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {receipt.user.profile.first_name} {receipt.user.profile.last_name}
                    </p>
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
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.description ?? "Receipt details"}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge status={selected.status} />
              <p className="text-2xl font-semibold">
                {formatCurrency(selected.amount_cents)}
              </p>
            </div>
            <p className="text-sm text-neutral-600">
              {selected.category} · {new Date(selected.created_at).toLocaleDateString()}
            </p>
            {showSubmitter && selected.user && (
              <p className="text-sm text-neutral-600">
                Submitted by {selected.user.profile?.first_name} {selected.user.profile?.last_name} ({selected.user.email})
              </p>
            )}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => openPhoto(selected.photo_key)}
            >
              View receipt photo
            </Button>
          </div>
        )}
      </Drawer>
    </>
  );
}
