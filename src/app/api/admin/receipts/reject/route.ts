import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  receiptId: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

export async function POST(request: Request) {
  const session = await requireAdminRole();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Reason required (3–500 chars)." }, { status: 400 });
  }

  const receipt = await prisma.receipts.findFirst({
    where: {
      id: parsed.data.receiptId,
      org_id: session.orgId,
      status: "submitted",
    },
    select: { id: true, user_id: true, amount_cents: true, description: true },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found or already processed." }, { status: 404 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.receipts.update({
      where: { id: receipt.id },
      data: {
        status: "rejected",
        rejection_reason: parsed.data.reason,
        rejected_at: now,
        rejected_by_user_id: session.userId,
      },
    });
    await createAuditLog(tx, {
      orgId: session.orgId,
      actorUserId: session.userId,
      entityType: "RECEIPT",
      entityId: receipt.id,
      action: "RECEIPT_REJECTED",
      metadata: {
        previousStatus: "submitted",
        newStatus: "rejected",
        reason: parsed.data.reason,
        amountCents: receipt.amount_cents,
      },
    });
    await createNotification(tx, {
      orgId: session.orgId,
      userId: receipt.user_id,
      type: "RECEIPT_REJECTED",
      title: "Receipt rejected",
      body: `"${receipt.description}" was rejected: ${parsed.data.reason}`,
      entityType: "RECEIPT",
      entityId: receipt.id,
    });
  });

  return NextResponse.json({ ok: true });
}
