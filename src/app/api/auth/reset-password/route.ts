import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { setSessionCookieOnResponse } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");

  let parsed;
  let formToken = "";
  if (isForm) {
    const formData = await request.formData();
    formToken = formData.get("token")?.toString() ?? "";
    parsed = schema.safeParse({
      token: formToken,
      password: formData.get("password")?.toString() ?? "",
    });
  } else {
    const body = await request.json().catch(() => ({}));
    parsed = schema.safeParse(body);
  }

  if (!parsed.success) {
    if (isForm) {
      const url = new URL("/reset-password", request.url);
      if (formToken) url.searchParams.set("token", formToken);
      url.searchParams.set("error", "Password must be at least 8 characters.");
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);

  const resetRecord = await prisma.password_reset_tokens.findFirst({
    where: {
      token_hash: tokenHash,
      expires_at: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          profile: {
            select: { org_id: true, role: true },
          },
        },
      },
    },
  });

  if (!resetRecord || !resetRecord.user.profile) {
    if (isForm) {
      const url = new URL("/reset-password", request.url);
      url.searchParams.set("token", parsed.data.token);
      url.searchParams.set("error", "Invalid or expired reset link. Request a new one.");
      return NextResponse.redirect(url);
    }
    return NextResponse.json(
      { error: "Invalid or expired reset link. Please request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction(async (tx) => {
    await tx.users.update({
      where: { id: resetRecord.user_id },
      data: { password_hash: passwordHash },
    });
    await tx.password_reset_tokens.delete({
      where: { id: resetRecord.id },
    });
  });

  const redirectUrl = new URL("/app", request.url);
  const response = NextResponse.redirect(redirectUrl);
  await setSessionCookieOnResponse(response, {
    userId: resetRecord.user_id,
    orgId: resetRecord.user.profile.org_id,
    role: resetRecord.user.profile.role,
  });

  return response;
}
