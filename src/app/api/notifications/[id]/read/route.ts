import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCurrentUserAndProfile();
  const { id } = await params;

  await prisma.notifications.updateMany({
    where: {
      id,
      org_id: session.orgId,
      user_id: session.userId,
    },
    data: { read_at: new Date() },
  });

  return NextResponse.json({ ok: true });
}
