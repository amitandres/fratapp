import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireRole("admin");
  const { userId } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const profile = await prisma.profiles.findFirst({
    where: {
      user_id: userId,
      org_id: session.orgId,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (parsed.data.role === "member" && profile.role === "admin") {
    const adminCount = await prisma.profiles.count({
      where: { org_id: session.orgId, role: "admin" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last admin." },
        { status: 400 }
      );
    }
  }

  await prisma.profiles.update({
    where: { id: profile.id },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireRole("admin");
  const { userId } = await params;

  const profile = await prisma.profiles.findFirst({
    where: {
      user_id: userId,
      org_id: session.orgId,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (profile.user_id === session.userId) {
    return NextResponse.json(
      { error: "Cannot remove yourself." },
      { status: 400 }
    );
  }

  await prisma.profiles.delete({
    where: { id: profile.id },
  });

  return NextResponse.json({ ok: true });
}
