import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");

  const members = await prisma.profiles.findMany({
    where: { org_id: session.orgId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { created_at: "asc" }],
  });

  const membersWithTotals = await Promise.all(
    members.map(async (m) => {
      const totalCents = await prisma.receipts.aggregate({
        where: { user_id: m.user_id, org_id: session.orgId },
        _sum: { amount_cents: true },
      });
      return {
        ...m,
        totalAmountCents: totalCents._sum.amount_cents ?? 0,
      };
    })
  );

  return NextResponse.json({ members: membersWithTotals });
}
