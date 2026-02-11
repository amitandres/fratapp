import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 per email per hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  // Rate limit: count recent tokens for this email
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.password_reset_tokens.count({
    where: {
      user: { email },
      created_at: { gte: since },
    },
  });
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json({
      message: "If that email exists, we sent a reset link.",
    });
  }

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({
      message: "If that email exists, we sent a reset link.",
    });
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.password_reset_tokens.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : request.headers.get("origin") ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const sent = await sendPasswordResetEmail(email, resetUrl);
  if (!sent) {
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "If that email exists, we sent a reset link.",
  });
}
