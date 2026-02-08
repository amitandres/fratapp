import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";

export async function GET() {
  const session = await requireCurrentUserAndProfile();
  const notifications = await prisma.notifications.findMany({
    where: { org_id: session.orgId, user_id: session.userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notifications.count({
    where: { org_id: session.orgId, user_id: session.userId, read_at: null },
  });
  return NextResponse.json({ notifications, unreadCount });
}
