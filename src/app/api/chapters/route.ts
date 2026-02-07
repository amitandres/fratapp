import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
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
  return NextResponse.json({ inviteCode: code, redirectUrl });
}
