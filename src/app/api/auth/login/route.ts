import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, setSessionCookieOnResponse } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Supports both:
 * - Form POST (action + method): most reliable, browser-native cookie handling.
 *   Redirects to next or /login?error= on success/failure.
 * - JSON POST: for programmatic use; returns JSON.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");

  let parsed: ReturnType<typeof loginSchema.safeParse>;
  let nextPath = "/app";

  if (isForm) {
    const formData = await request.formData();
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const next = formData.get("next")?.toString();
    if (next && next.startsWith("/")) nextPath = next;
    parsed = loginSchema.safeParse({ email, password });
  } else {
    const body = await request.json();
    parsed = loginSchema.safeParse(body);
  }

  if (!parsed.success) {
    if (isForm) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Invalid input.");
      return NextResponse.redirect(loginUrl);
    }
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
    if (isForm) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Invalid credentials.");
      loginUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const isValid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!isValid) {
    if (isForm) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Invalid credentials.");
      loginUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const payload = {
    userId: user.id,
    orgId: user.profile.org_id,
    role: user.profile.role,
  };

  if (isForm) {
    const redirectUrl = new URL(nextPath, request.url);
    const response = NextResponse.redirect(redirectUrl);
    await setSessionCookieOnResponse(response, payload);
    return response;
  }

  await setSessionCookie(payload);
  return NextResponse.json({ ok: true });
}
