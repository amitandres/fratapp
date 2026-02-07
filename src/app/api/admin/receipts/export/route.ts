import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const exportSchema = z.object({
  status: z
    .enum(["submitted", "approved", "paid", "rejected", "needs_review"])
    .optional()
    .or(z.literal("")),
  from: z.string().optional().or(z.literal("")),
  to: z.string().optional().or(z.literal("")),
});

const toDateOrNull = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET(request: Request) {
  const session = await requireRole("admin");
  const { searchParams } = new URL(request.url);
  const parsed = exportSchema.safeParse({
    status: searchParams.get("status"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  }

  const fromDate = toDateOrNull(parsed.data.from);
  const toDate = toDateOrNull(parsed.data.to);

  const receipts = await prisma.receipts.findMany({
    where: {
      org_id: session.orgId,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(fromDate || toDate
        ? {
            created_at: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { created_at: "desc" },
  });

  const rows = [
    [
      "id",
      "description",
      "amount_cents",
      "category",
      "status",
      "photo_key",
      "created_at",
      "paid_at",
      "paid_via",
      "paid_note",
    ],
    ...receipts.map((receipt) => [
      receipt.id,
      receipt.description,
      receipt.amount_cents.toString(),
      receipt.category,
      receipt.status,
      receipt.photo_key,
      receipt.created_at.toISOString(),
      receipt.paid_at?.toISOString() ?? "",
      receipt.paid_via ?? "",
      receipt.paid_note ?? "",
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const escaped = String(value ?? "").replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=\"receipts.csv\"",
    },
  });
}
