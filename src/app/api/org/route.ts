import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  logoKey: z.string().min(1).optional().nullable(),
});

export async function GET() {
  const session = await requireRole("admin");

  const org = await prisma.organizations.findUnique({
    where: { id: session.orgId },
  });

  if (!org) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(org);
}

export async function PATCH(request: Request) {
  const session = await requireRole("admin");
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const data: { name?: string; logo_key?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.logoKey !== undefined) data.logo_key = parsed.data.logoKey;

  const org = await prisma.organizations.update({
    where: { id: session.orgId },
    data,
  });

  return NextResponse.json(org);
}
