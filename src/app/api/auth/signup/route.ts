import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { setSessionCookie } from "@/lib/auth";

const signupSchema = z.object({
  code: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  paymentMethod: z.enum(["venmo", "zelle", "paypal"]),
  paymentHandle: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { code, firstName, lastName, email, password, paymentMethod, paymentHandle } =
    parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.invite_codes.findUnique({
        where: { code },
        select: {
          code: true,
          org_id: true,
          role: true,
          max_uses: true,
          uses: true,
          expires_at: true,
        },
      });

      if (!invite) {
        throw new Error("INVALID_CODE");
      }

      if (invite.expires_at && invite.expires_at < new Date()) {
        throw new Error("EXPIRED_CODE");
      }

      if (invite.uses >= invite.max_uses) {
        throw new Error("USED_UP_CODE");
      }

      const normalizedEmail = email.toLowerCase();
      const existing = await tx.users.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existing) {
        throw new Error("EMAIL_EXISTS");
      }

      const passwordHash = await hashPassword(password);
      const user = await tx.users.create({
        data: {
          email: normalizedEmail,
          password_hash: passwordHash,
        },
      });

      await tx.profiles.create({
        data: {
          user_id: user.id,
          org_id: invite.org_id,
          first_name: firstName,
          last_name: lastName,
          payment_method: paymentMethod,
          payment_handle: paymentHandle,
          role: invite.role,
        },
      });

      await tx.invite_codes.update({
        where: { code: invite.code },
        data: {
          uses: { increment: 1 },
        },
      });

      return {
        userId: user.id,
        orgId: invite.org_id,
        role: invite.role,
      };
    });

    await setSessionCookie({
      userId: result.userId,
      orgId: result.orgId,
      role: result.role,
    });

    return NextResponse.json({ ok: true, redirectUrl: "/app" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    if (message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }
    if (message === "INVALID_CODE") {
      return NextResponse.json({ error: "Invite code is invalid." }, { status: 400 });
    }
    if (message === "EXPIRED_CODE") {
      return NextResponse.json({ error: "Invite code has expired." }, { status: 400 });
    }
    if (message === "USED_UP_CODE") {
      return NextResponse.json(
        { error: "Invite code has no remaining uses." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }
}
