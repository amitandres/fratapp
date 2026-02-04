import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      id: true,
      password_hash: true,
      profile: {
        select: {
          org_id: true,
          role: true,
        },
      },
    },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const isValid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await setSessionCookie({
    userId: user.id,
    orgId: user.profile.org_id,
    role: user.profile.role,
  });
  return NextResponse.json({ ok: true });
}
