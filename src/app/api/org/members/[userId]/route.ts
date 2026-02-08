import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireExecRole } from "@/lib/auth";

const updateSchema = z.object({
  role: z.enum(["member", "treasurer", "exec", "admin"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireExecRole();
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

  const isDemotingFromExec =
    (profile.role === "exec" || profile.role === "admin") &&
    parsed.data.role !== "exec" &&
    parsed.data.role !== "admin";
  if (isDemotingFromExec) {
    const execCount = await prisma.profiles.count({
      where: { org_id: session.orgId, role: { in: ["exec", "admin"] } },
    });
    if (execCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last exec/admin." },
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
  const session = await requireExecRole();
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
