import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireExecRole } from "@/lib/auth";

const ROLES = ["member", "treasurer", "exec", "admin"] as const;

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "INV-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const createSchema = z.object({
  role: z.enum(ROLES),
  maxUses: z.number().int().min(1).max(1000).default(50),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
});

export async function GET() {
  const session = await requireExecRole();

  const codes = await prisma.invite_codes.findMany({
    where: { org_id: session.orgId },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ inviteCodes: codes });
}

export async function POST(request: Request) {
  const session = await requireExecRole();
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { role, maxUses, expiresAt } = parsed.data;
  const expires_at = expiresAt ? new Date(expiresAt) : null;

  let code = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    try {
      await prisma.invite_codes.create({
        data: {
          code,
          org_id: session.orgId,
          role,
          max_uses: maxUses,
          uses: 0,
          expires_at,
        },
      });
      return NextResponse.json({ code, role, maxUses, expires_at });
    } catch {
      code = generateInviteCode();
      attempts++;
    }
  }

  return NextResponse.json(
    { error: "Failed to generate unique code. Try again." },
    { status: 500 }
  );
}
