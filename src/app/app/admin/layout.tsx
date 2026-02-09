import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?next=/app/admin");
  }

  const profile = await prisma.profiles.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!profile || !canAccessAdmin(profile.role as "member" | "treasurer" | "exec" | "admin")) {
    redirect("/app");
  }

  return <>{children}</>;
}
