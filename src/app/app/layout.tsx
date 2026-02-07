import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  let orgName = "FratApp";

  if (session?.userId) {
    const profile = await prisma.profiles.findUnique({
      where: { user_id: session.userId },
      select: {
        organization: { select: { name: true } },
      },
    });
    orgName = profile?.organization?.name ?? orgName;
  }

  return (
    <AppShell
      orgName={orgName}
      role={session?.role}
      isAdmin={session?.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
