import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CH-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");

  let parsed: ReturnType<typeof createSchema.safeParse>;
  if (isForm) {
    const formData = await request.formData();
    const name = formData.get("name")?.toString() ?? "";
    parsed = createSchema.safeParse({ name: name.trim() });
  } else {
    const body = await request.json();
    parsed = createSchema.safeParse(body);
  }

  if (!parsed.success) {
    if (isForm) {
      const setupUrl = new URL("/setup-chapter", request.url);
      setupUrl.searchParams.set("error", "Chapter name must be 1–100 characters.");
      return NextResponse.redirect(setupUrl);
    }
    return NextResponse.json(
      { error: "Chapter name must be 1–100 characters." },
      { status: 400 }
    );
  }

  const org = await prisma.organizations.create({
    data: {
      name: parsed.data.name,
    },
  });

  let code = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    try {
      await prisma.invite_codes.create({
        data: {
          code,
          org_id: org.id,
          role: "admin",
          max_uses: 10,
          uses: 0,
        },
      });
      break;
    } catch (e) {
      code = generateInviteCode();
      attempts++;
      if (attempts >= 5) {
        return NextResponse.json(
          { error: "Failed to create invite code. Please try again." },
          { status: 500 }
        );
      }
    }
  }

  const redirectUrl = `/signup?code=${encodeURIComponent(code)}`;

  if (isForm) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
  return NextResponse.json({ inviteCode: code, redirectUrl });
}
