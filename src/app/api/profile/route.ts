import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";

const PAYMENT_METHODS = ["venmo", "cashapp", "zelle", "paypal", "other"] as const;

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(30).trim().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  paymentHandle: z.string().max(100).trim().optional().nullable(),
});

export async function GET() {
  const session = await requireCurrentUserAndProfile();

  const profile = await prisma.profiles.findUnique({
    where: { user_id: session.userId },
    select: {
      first_name: true,
      last_name: true,
      phone: true,
      payment_method: true,
      payment_handle: true,
      role: true,
      user: { select: { email: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    paymentMethod: profile.payment_method,
    paymentHandle: profile.payment_handle,
    role: profile.role,
    email: profile.user.email,
  });
}

export async function PATCH(request: Request) {
  const session = await requireCurrentUserAndProfile();
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const data: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    payment_method?: (typeof PAYMENT_METHODS)[number];
    payment_handle?: string | null;
  } = {};
  if (parsed.data.firstName !== undefined) data.first_name = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) data.last_name = parsed.data.lastName;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.paymentMethod !== undefined)
    data.payment_method = parsed.data.paymentMethod;
  if (parsed.data.paymentHandle !== undefined)
    data.payment_handle = parsed.data.paymentHandle || null;

  await prisma.profiles.update({
    where: { user_id: session.userId },
    data,
  });

  return NextResponse.json({ ok: true });
}
