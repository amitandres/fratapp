import { NextResponse } from "next/server";
import { z } from "zod";
import { storageService } from "@/lib/storage";
import { requireRole } from "@/lib/auth";

const schema = z.object({
  contentType: z.string().min(3),
});

export async function POST(request: Request) {
  const session = await requireRole("admin");
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { key, signedUrl } = await storageService.createOrgLogoUploadUrl(
    session.orgId,
    parsed.data.contentType
  );

  return NextResponse.json({ key, signedUrl });
}
