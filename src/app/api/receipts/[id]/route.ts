import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCurrentUserAndProfile();
  const { id } = await params;

  const receipt = await prisma.receipts.findFirst({
    where: {
      id,
      org_id: session.orgId,
      user_id: session.userId,
    },
    select: { id: true, status: true, amount_cents: true, description: true },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (receipt.status !== "submitted") {
    return NextResponse.json(
      { error: "Can only delete receipts with status 'submitted'." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.receipts.delete({ where: { id } });
    await createAuditLog(tx, {
      orgId: session.orgId,
      actorUserId: session.userId,
      entityType: "RECEIPT",
      entityId: id,
      action: "RECEIPT_DELETED",
      metadata: {
        status: receipt.status,
        amountCents: receipt.amount_cents,
        description: receipt.description,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
