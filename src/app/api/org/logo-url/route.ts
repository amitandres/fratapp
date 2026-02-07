import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage";
import { requireCurrentUserAndProfile } from "@/lib/auth";

export async function GET() {
  const session = await requireCurrentUserAndProfile();

  const org = await prisma.organizations.findUnique({
    where: { id: session.orgId },
  });

  if (!org?.logo_key) {
    return NextResponse.json({ error: "No logo." }, { status: 404 });
  }

  const signedUrl = await storageService.createSignedViewUrl(
    session.orgId,
    org.logo_key
  );

  return NextResponse.json({ signedUrl });
}
