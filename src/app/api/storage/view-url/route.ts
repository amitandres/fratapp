import { NextResponse } from "next/server";
import { z } from "zod";
import { storageService } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";
import { canViewAllReceipts } from "@/lib/permissions";

const viewSchema = z.object({
  key: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = viewSchema.safeParse({ key: searchParams.get("key") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const session = await requireCurrentUserAndProfile();

  const receipt = await prisma.receipts.findFirst({
    where: {
      photo_key: parsed.data.key,
      org_id: session.orgId,
      ...(!canViewAllReceipts(session.role as "member" | "treasurer" | "exec" | "admin") ? { user_id: session.userId } : {}),
    },
    select: {
      org_id: true,
    },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const signedUrl = await storageService.createSignedViewUrl(
    session.orgId,
    parsed.data.key
  );

  return NextResponse.json({ signedUrl });
}
