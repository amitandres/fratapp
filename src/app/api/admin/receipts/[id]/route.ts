import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminRole();
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Type "DELETE" to confirm.' },
      { status: 400 }
    );
  }

  const receipt = await prisma.receipts.findFirst({
    where: {
      id,
      org_id: session.orgId,
    },
    select: { id: true, status: true, amount_cents: true, description: true },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
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
        role: "admin",
        status: receipt.status,
        amountCents: receipt.amount_cents,
        description: receipt.description,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
