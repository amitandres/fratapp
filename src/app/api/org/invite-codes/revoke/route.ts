import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function DELETE(request: Request) {
  const session = await requireRole("admin");
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }

  const invite = await prisma.invite_codes.findFirst({
    where: { code, org_id: session.orgId },
  });

  if (!invite) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.invite_codes.delete({ where: { code } });
  return NextResponse.json({ ok: true });
}
