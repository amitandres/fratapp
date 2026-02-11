"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/Drawer";
import { QuickActions } from "@/components/QuickActions";
import { AuditTimeline } from "@/components/AuditTimeline";
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
  user_id?: string;
  user: {
    id?: string;
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
      payment_method?: string;
      payment_handle?: string | null;
    } | null;
  };
};

type Group = {
  userId: string;
  name: string;
  email: string;
  paymentMethod?: string;
  paymentHandle?: string | null;
  totalCents: number;
  receipts: Receipt[];
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function formatPaymentInfo(method?: string, handle?: string | null) {
  if (!handle?.trim()) return null;
  const m = (method ?? "").toLowerCase();
  if (m === "venmo") return `Venmo @${handle.replace(/^@/, "")}`;
  if (m === "cashapp") return `CashApp $${handle.replace(/^\$/, "")}`;
  if (m === "zelle") return `Zelle ${handle}`;
  if (m === "paypal") return `PayPal ${handle}`;
  return handle;
}

function groupBySubmitter(receipts: Receipt[]): Group[] {
  const map = new Map<string, Group>();
  for (const r of receipts) {
    const userId = r.user_id ?? (r.user as { id?: string })?.id ?? r.user.email;
    const name =
      r.user.profile?.first_name && r.user.profile?.last_name
        ? `${r.user.profile.first_name} ${r.user.profile.last_name}`
        : r.user.email ?? "Unknown";
    const email = r.user.email ?? "";

    if (!map.has(userId)) {
      map.set(userId, {
        userId,
        name,
        email,
        paymentMethod: r.user.profile?.payment_method,
        paymentHandle: r.user.profile?.payment_handle,
        totalCents: 0,
        receipts: [],
      });
    }
    const g = map.get(userId)!;
    g.totalCents += r.amount_cents;
    g.receipts.push(r);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function ApprovedReceiptsList({ receipts }: { receipts: Receipt[] }) {
  const router = useRouter();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);

  const groups = groupBySubmitter(receipts);
  const selected = receipts.find((r) => r.id === selectedId);

  const openPhoto = async (key: string) => {
    const res = await fetch(`/api/storage/view-url?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.signedUrl) setPhotoViewUrl(data.signedUrl);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {groups.map((group) => {
          const isExpanded = expandedUserId === group.userId;
          const paymentInfo = formatPaymentInfo(group.paymentMethod, group.paymentHandle);

          return (
            <Card
              key={group.userId}
              className="overflow-hidden"
              padding="none"
            >
              <button
                type="button"
                className="w-full px-4 py-4 text-left hover:bg-neutral-50 transition-colors flex items-center justify-between gap-4"
                onClick={() => setExpandedUserId(isExpanded ? null : group.userId)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900">{group.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{group.email}</p>
                  {paymentInfo && (
                    <p className="text-sm font-medium text-neutral-700 mt-1">
                      {paymentInfo}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(group.totalCents)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {group.receipts.length} receipt{group.receipts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-neutral-400 shrink-0">
                  {isExpanded ? "▼" : "▶"}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50/50">
                  {group.receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 last:border-b-0 hover:bg-white/50"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setSelectedId(receipt.id)}
                      >
                        <p className="font-medium text-neutral-900 truncate">
                          {receipt.description}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {receipt.category} · {new Date(receipt.created_at).toLocaleDateString()}
                        </p>
                      </button>
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="font-semibold text-neutral-900">
                          {formatCurrency(receipt.amount_cents)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPhoto(receipt.photo_key)}
                        >
                          Photo
                        </Button>
                        <QuickActions
                          receipt={receipt}
                          onRejectSuccess={() => router.refresh()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          <ApprovedReceiptDrawer
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

function ApprovedReceiptDrawer({
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
      : (receipt.user as { email?: string }).email ?? "Unknown";
  const paymentInfo = formatPaymentInfo(
    receipt.user.profile?.payment_method,
    receipt.user.profile?.payment_handle
  );

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
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-sm font-medium text-neutral-800">{submitterName}</p>
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
      <AuditTimeline receiptId={receipt.id} />
    </div>
  );
}
