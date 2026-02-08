"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: Date | null;
  created_at: Date;
};

export function NotificationsList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    router.refresh();
  };

  if (notifications.length === 0) {
    return (
      <Card className="flex flex-col items-center py-12 text-center">
        <span className="text-4xl">🔔</span>
        <p className="mt-3 text-sm font-medium text-neutral-900">No notifications</p>
        <p className="mt-1 text-sm text-neutral-600">
          You&apos;ll see updates here when your receipts are approved, rejected, or paid.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => (
        <Card
          key={n.id}
          padding="md"
          className={`cursor-pointer transition-colors hover:bg-neutral-50 ${
            !n.read_at ? "border-l-4 border-l-black" : ""
          }`}
          onClick={() => markRead(n.id)}
        >
          <p className="font-medium text-neutral-900">{n.title}</p>
          {n.body && <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>}
          <p className="mt-1 text-xs text-neutral-500">
            {new Date(n.created_at).toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
