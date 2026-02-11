import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { setSessionCookie, setSessionCookieOnResponse } from "@/lib/auth";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

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
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");

  let parsed: ReturnType<typeof signupSchema.safeParse>;

  if (isForm) {
    const formData = await request.formData();
    const data = {
      code: formData.get("code")?.toString() ?? "",
      firstName: formData.get("firstName")?.toString() ?? "",
      lastName: formData.get("lastName")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
      paymentMethod: (formData.get("paymentMethod")?.toString() ?? "venmo") as "venmo" | "zelle" | "paypal",
      paymentHandle: formData.get("paymentHandle")?.toString() || undefined,
    };
    parsed = signupSchema.safeParse(data);
  } else {
    const body = await request.json();
    parsed = signupSchema.safeParse(body);
  }

  if (!parsed.success) {
    if (isForm) {
      const signupUrl = new URL("/signup", request.url);
      signupUrl.searchParams.set("error", "Invalid input.");
      return NextResponse.redirect(signupUrl);
    }
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

    const payload = {
      userId: result.userId,
      orgId: result.orgId,
      role: result.role,
    };

    if (isForm) {
      const response = NextResponse.redirect(new URL("/app", request.url));
      await setSessionCookieOnResponse(response, payload);
      return response;
    }

    await setSessionCookie(payload);
    return NextResponse.json({ ok: true, redirectUrl: "/app" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    const errorMsg =
      message === "EMAIL_EXISTS"
        ? "Email already exists."
        : message === "INVALID_CODE"
          ? "Invite code is invalid."
          : message === "EXPIRED_CODE"
            ? "Invite code has expired."
            : message === "USED_UP_CODE"
              ? "Invite code has no remaining uses."
              : "Signup failed.";

    if (isForm) {
      const signupUrl = new URL("/signup", request.url);
      signupUrl.searchParams.set("error", errorMsg);
      signupUrl.searchParams.set("code", code);
      return NextResponse.redirect(signupUrl);
    }

    const status =
      message === "EMAIL_EXISTS" ? 409 :
      message === "INVALID_CODE" || message === "EXPIRED_CODE" || message === "USED_UP_CODE" ? 400 : 500;
    return NextResponse.json({ error: errorMsg }, { status });
  }
}
