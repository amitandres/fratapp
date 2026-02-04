import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";

const createReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  description: z.string().min(1),
  amount: z.string().min(1),
  category: z.enum(["food", "drinks", "hardware", "lights", "other"]),
  photoKey: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const session = await requireCurrentUserAndProfile();
  const amountNumber = Number(parsed.data.amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const amountCents = Math.round(amountNumber * 100);

  const receipt = await prisma.receipts.create({
    data: {
      id: parsed.data.receiptId,
      org_id: session.orgId,
      user_id: session.userId,
      description: parsed.data.description,
      amount_cents: amountCents,
      category: parsed.data.category,
      status: "submitted",
      photo_key: parsed.data.photoKey,
    },
  });

  await prisma.receipt_edits.create({
    data: {
      receipt_id: receipt.id,
      editor_user_id: session.userId,
      field_name: "created",
      old_value: "",
      new_value: JSON.stringify({
        description: receipt.description,
        amount_cents: receipt.amount_cents,
        category: receipt.category,
        status: receipt.status,
        photo_key: receipt.photo_key,
      }),
    },
  });

  return NextResponse.json({ ok: true, receiptId: receipt.id });
}

export async function GET() {
  const session = await requireCurrentUserAndProfile();

  const receipts = await prisma.receipts.findMany({
    where: {
      org_id: session.orgId,
      ...(session.role === "member" ? { user_id: session.userId } : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      description: true,
      amount_cents: true,
      category: true,
      status: true,
      photo_key: true,
      created_at: true,
    },
  });

  return NextResponse.json({ receipts });
}
