import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  receiptIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(3).max(500),
});

export async function POST(request: Request) {
  const session = await requireAdminRole();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Reason required (3–500 chars)." }, { status: 400 });
  }

  const receipts = await prisma.receipts.findMany({
    where: {
      id: { in: parsed.data.receiptIds },
      org_id: session.orgId,
      status: "submitted",
    },
    select: { id: true, user_id: true, amount_cents: true, description: true },
  });

  if (receipts.length === 0) {
    return NextResponse.json({ error: "No valid receipts to reject." }, { status: 400 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const r of receipts) {
      await tx.receipts.update({
        where: { id: r.id },
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
        entityId: r.id,
        action: "RECEIPT_REJECTED",
        metadata: {
          previousStatus: "submitted",
          newStatus: "rejected",
          reason: parsed.data.reason,
          amountCents: r.amount_cents,
        },
      });
      await createNotification(tx, {
        orgId: session.orgId,
        userId: r.user_id,
        type: "RECEIPT_REJECTED",
        title: "Receipt rejected",
        body: `"${r.description}" was rejected: ${parsed.data.reason}`,
        entityType: "RECEIPT",
        entityId: r.id,
      });
    }
  });

  return NextResponse.json({ ok: true, count: receipts.length, ids: receipts.map((r) => r.id) });
}
