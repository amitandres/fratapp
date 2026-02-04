import { NextResponse } from "next/server";
import { z } from "zod";
import { storageService } from "@/lib/storage";
import { requireCurrentUserAndProfile } from "@/lib/auth";

const uploadSchema = z.object({
  contentType: z.string().min(3),
  receiptId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { orgId } = await requireCurrentUserAndProfile();
  const receiptId = parsed.data.receiptId ?? crypto.randomUUID();

  const { key, signedUrl } = await storageService.createSignedUploadUrl(
    orgId,
    receiptId,
    parsed.data.contentType
  );

  return NextResponse.json({ receiptId, key, signedUrl });
}
