import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  receiptId: z.string().uuid(),
  status: z.enum(["submitted", "approved", "paid", "rejected", "needs_review"]),
  amount: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["food", "drinks", "hardware", "lights", "other"]),
  paidVia: z.enum(["venmo", "zelle", "paypal", "cash"]).optional().or(z.literal("")),
  paidNote: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireRole("admin");
  const body = await request.formData();
  const parsed = updateSchema.safeParse({
    receiptId: body.get("receiptId"),
    status: body.get("status"),
    amount: body.get("amount"),
    description: body.get("description"),
    category: body.get("category"),
    paidVia: body.get("paidVia"),
    paidNote: body.get("paidNote") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const amountNumber = Number(parsed.data.amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const receipt = await prisma.receipts.findFirst({
    where: {
      id: parsed.data.receiptId,
      org_id: session.orgId,
    },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const amountCents = Math.round(amountNumber * 100);
  const paidVia = parsed.data.paidVia === "" ? null : parsed.data.paidVia ?? null;
  const paidAt =
    parsed.data.status === "paid" ? receipt.paid_at ?? new Date() : null;

  const updates = {
    status: parsed.data.status,
    amount_cents: amountCents,
    description: parsed.data.description,
    category: parsed.data.category,
    paid_via: paidVia,
    paid_note: parsed.data.paidNote ?? null,
    paid_at: paidAt,
  };

  await prisma.receipts.update({
    where: { id: receipt.id },
    data: updates,
  });

  const auditEntries = [
    receipt.status !== updates.status
      ? { field: "status", old: receipt.status, next: updates.status }
      : null,
    receipt.amount_cents !== updates.amount_cents
      ? {
          field: "amount_cents",
          old: String(receipt.amount_cents),
          next: String(updates.amount_cents),
        }
      : null,
    receipt.description !== updates.description
      ? { field: "description", old: receipt.description, next: updates.description }
      : null,
    receipt.category !== updates.category
      ? { field: "category", old: receipt.category, next: updates.category }
      : null,
    receipt.paid_via !== updates.paid_via
      ? { field: "paid_via", old: receipt.paid_via ?? "", next: updates.paid_via ?? "" }
      : null,
    receipt.paid_note !== updates.paid_note
      ? { field: "paid_note", old: receipt.paid_note ?? "", next: updates.paid_note ?? "" }
      : null,
    receipt.paid_at?.toISOString() !== updates.paid_at?.toISOString()
      ? {
          field: "paid_at",
          old: receipt.paid_at?.toISOString() ?? "",
          next: updates.paid_at?.toISOString() ?? "",
        }
      : null,
  ].filter(Boolean) as Array<{ field: string; old: string; next: string }>;

  if (auditEntries.length > 0) {
    await prisma.receipt_edits.createMany({
      data: auditEntries.map((entry) => ({
        receipt_id: receipt.id,
        editor_user_id: session.userId,
        field_name: entry.field,
        old_value: entry.old,
        new_value: entry.next,
      })),
    });
  }

  return NextResponse.redirect(new URL("/app/admin", request.url));
}
