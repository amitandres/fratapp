import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

const updateSchema = z.object({
  receiptId: z.string().uuid(),
  status: z.enum(["submitted", "approved", "paid", "rejected", "needs_review"]),
  amount: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(["food", "drinks", "hardware", "lights", "other"]).optional(),
  paidVia: z.enum(["venmo", "zelle", "paypal", "cash"]).optional().or(z.literal("")),
  paidNote: z.string().optional(),
  rejectionReason: z.string().min(3).max(500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await requireAdminRole();
  const body = await request.formData();
  const receiptId = body.get("receiptId");
  const parsed = updateSchema.safeParse({
    receiptId,
    status: body.get("status"),
    amount: body.get("amount") ?? undefined,
    description: body.get("description") ?? undefined,
    category: body.get("category") ?? undefined,
    paidVia: body.get("paidVia") ?? undefined,
    paidNote: body.get("paidNote") ?? undefined,
    rejectionReason: body.get("rejectionReason") ?? undefined,
  });

  if (!parsed.success || typeof receiptId !== "string") {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const receipt = await prisma.receipts.findFirst({
    where: {
      id: receiptId,
      org_id: session.orgId,
    },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const amountStr = parsed.data.amount?.trim();
  const amountNumber = amountStr ? Number(amountStr) : receipt.amount_cents / 100;
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const description = parsed.data.description?.trim() || receipt.description;
  const category = parsed.data.category || receipt.category;

  const amountCents = Math.round(amountNumber * 100);
  const paidVia =
    parsed.data.paidVia === "" ? null
    : parsed.data.paidVia ?? (parsed.data.status === "paid" ? receipt.paid_via ?? "venmo" : receipt.paid_via);
  const paidAt =
    parsed.data.status === "paid" ? receipt.paid_at ?? new Date() : null;
  const rejectionReason =
    parsed.data.status === "rejected" && parsed.data.rejectionReason?.trim()
      ? parsed.data.rejectionReason.trim()
      : null;

  if (parsed.data.status === "rejected" && !rejectionReason) {
    return NextResponse.json({ error: "Rejection reason required (min 3 characters)." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    amount_cents: amountCents,
    description,
    category,
    paid_via: paidVia,
    paid_note: parsed.data.paidNote ?? null,
    paid_at: paidAt,
  };
  if (parsed.data.status === "rejected") {
    updates.rejection_reason = rejectionReason;
    updates.rejected_at = new Date();
    updates.rejected_by_user_id = session.userId;
  }

  await prisma.receipts.update({
    where: { id: receipt.id },
    data: updates as Parameters<typeof prisma.receipts.update>[0]["data"],
  });

  if (receipt.status !== parsed.data.status) {
    const action =
      parsed.data.status === "approved"
        ? "RECEIPT_APPROVED"
        : parsed.data.status === "paid"
          ? "RECEIPT_PAID"
          : parsed.data.status === "rejected"
            ? "RECEIPT_REJECTED"
            : "RECEIPT_UPDATED";
    await createAuditLog(prisma, {
      orgId: session.orgId,
      actorUserId: session.userId,
      entityType: "RECEIPT",
      entityId: receipt.id,
      action,
      metadata: {
        previousStatus: receipt.status,
        newStatus: parsed.data.status,
        reason: rejectionReason ?? undefined,
        amountCents,
      },
    });
    if (["approved", "paid", "rejected"].includes(parsed.data.status)) {
      const titles = {
        approved: "Receipt approved",
        paid: "Receipt marked paid",
        rejected: "Receipt rejected",
      };
      await createNotification(prisma, {
        orgId: session.orgId,
        userId: receipt.user_id,
        type: action,
        title: titles[parsed.data.status as keyof typeof titles],
        body:
          parsed.data.status === "rejected" && rejectionReason
            ? `"${parsed.data.description}" was rejected: ${rejectionReason}`
            : `"${parsed.data.description}" ($${(amountCents / 100).toFixed(2)})`,
        entityType: "RECEIPT",
        entityId: receipt.id,
      });
    }
  }

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
    receipt.paid_at?.toISOString() !== paidAt?.toISOString()
      ? {
          field: "paid_at",
          old: receipt.paid_at?.toISOString() ?? "",
          next: paidAt?.toISOString() ?? "",
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
