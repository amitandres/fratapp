"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/Drawer";
import { PhotoModal } from "@/components/PhotoModal";

type Receipt = {
  id: string;
  description: string;
  amount_cents: number;
  category: string;
  status: "submitted" | "approved" | "paid" | "rejected" | "needs_review";
  photo_key: string;
  created_at: Date;
  rejection_reason?: string | null;
  user?: {
    profile?: {
      first_name: string;
      last_name: string;
      payment_method?: string;
      payment_handle?: string | null;
    };
    email?: string;
  };
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function formatPaymentInfo(method?: string, handle?: string | null) {
  if (!handle?.trim()) return null;
  const m = (method ?? "").toLowerCase();
  if (m === "venmo") return `Venmo @${handle.replace(/^@/, "")}`;
  if (m === "zelle") return `Zelle ${handle}`;
  if (m === "paypal") return `PayPal ${handle}`;
  return handle;
}

function groupByMonth<T extends { created_at: Date }>(receipts: T[]) {
  const groups = new Map<string, T[]>();
  for (const r of receipts) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}

function formatMonthHeader(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

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
    if (data.signedUrl) setViewUrl(data.signedUrl);
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
        <div className="flex flex-col gap-4">
          {groupByMonth(receipts).map(([monthKey, monthReceipts]) => (
            <div key={monthKey}>
              <p className="mb-2 text-sm font-medium text-neutral-500">
                {formatMonthHeader(monthKey)}
              </p>
              <div className="flex flex-col gap-3">
                {monthReceipts.map((receipt) => (
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
                        {receipt.status === "rejected" && receipt.rejection_reason && (
                          <p className="mt-1 text-xs text-red-600">
                            Rejected: {receipt.rejection_reason}
                          </p>
                        )}
                        {showSubmitter && receipt.user?.profile && (
                          <div className="mt-2 rounded-md bg-neutral-100 px-2 py-1 inline-block">
                            <p className="text-sm font-medium text-neutral-800">
                              {receipt.user.profile.first_name} {receipt.user.profile.last_name}
                            </p>
                            {formatPaymentInfo(receipt.user.profile.payment_method, receipt.user.profile.payment_handle) && (
                              <p className="text-xs text-neutral-600 mt-0.5">
                                {formatPaymentInfo(receipt.user.profile.payment_method, receipt.user.profile.payment_handle)}
                              </p>
                            )}
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
                  </Card>
                ))}
              </div>
            </div>
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
            {selected.status === "rejected" && selected.rejection_reason && (
              <p className="text-sm text-red-600">
                Rejected: {selected.rejection_reason}
              </p>
            )}
            {showSubmitter && selected.user && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-sm font-medium text-neutral-800">
                  Submitted by {selected.user.profile?.first_name} {selected.user.profile?.last_name}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{selected.user.email}</p>
                {formatPaymentInfo(selected.user.profile?.payment_method, selected.user.profile?.payment_handle) && (
                  <p className="text-sm font-medium text-neutral-700 mt-2">
                    Pay via {formatPaymentInfo(selected.user.profile?.payment_method, selected.user.profile?.payment_handle)}
                  </p>
                )}
              </div>
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

      <PhotoModal imageUrl={viewUrl} onClose={() => setViewUrl(null)} />
    </>
  );
}
