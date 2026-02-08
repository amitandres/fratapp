import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { NotificationsList } from "@/components/NotificationsList";

export default async function NotificationsPage() {
  const session = await requireCurrentUserAndProfile();

  const notifications = await prisma.notifications.findMany({
    where: { org_id: session.orgId, user_id: session.userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Notifications</h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          Updates on your receipts.
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  );
}
