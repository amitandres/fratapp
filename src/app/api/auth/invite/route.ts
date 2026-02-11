import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ valid: false, error: "Missing code." }, { status: 400 });
  }

  const invite = await prisma.invite_codes.findUnique({
    where: { code },
    select: {
      org_id: true,
      role: true,
      max_uses: true,
      uses: true,
      expires_at: true,
      organization: { select: { name: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid code." }, { status: 404 });
  }

  if (invite.expires_at && invite.expires_at < new Date()) {
    return NextResponse.json({ valid: false, error: "Expired code." }, { status: 400 });
  }

  if (invite.uses >= invite.max_uses) {
    return NextResponse.json({ valid: false, error: "No remaining uses." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    orgName: invite.organization.name,
    role: invite.role,
    orgId: invite.org_id,
  });
}
