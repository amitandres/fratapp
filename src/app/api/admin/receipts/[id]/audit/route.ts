import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminRole();
  const { id: receiptId } = await params;

  const receipt = await prisma.receipts.findFirst({
    where: { id: receiptId, org_id: session.orgId },
    select: { id: true },
  });
  if (!receipt) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const logs = await prisma.audit_logs.findMany({
    where: {
      org_id: session.orgId,
      entity_type: "RECEIPT",
      entity_id: receiptId,
    },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      metadata: true,
      created_at: true,
    },
  });

  return NextResponse.json({ logs });
}
