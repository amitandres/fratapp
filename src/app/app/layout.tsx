import { getSessionUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  let orgName = "FratApp";

  let unreadCount = 0;
  if (session?.userId) {
    const profile = await prisma.profiles.findUnique({
      where: { user_id: session.userId },
      select: {
        org_id: true,
        organization: { select: { name: true } },
      },
    });
    orgName = profile?.organization?.name ?? orgName;
    if (profile?.org_id) {
      unreadCount = await prisma.notifications.count({
        where: {
          org_id: profile.org_id,
          user_id: session.userId,
          read_at: null,
        },
      });
    }
  }

  return (
    <AppShell
      orgName={orgName}
      role={session?.role}
      isAdmin={session?.role ? canAccessAdmin(session.role as "member" | "treasurer" | "exec" | "admin") : false}
      unreadNotifications={unreadCount}
    >
      {children}
    </AppShell>
  );
}
