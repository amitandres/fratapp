import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { OrgSettings } from "@/components/OrgSettings";

export default async function AdminOrgPage() {
  const session = await requireRole("admin");

  const [org, inviteCodes, membersRaw] = await Promise.all([
    prisma.organizations.findUnique({
      where: { id: session.orgId },
    }),
    prisma.invite_codes.findMany({
      where: { org_id: session.orgId },
      orderBy: { created_at: "desc" },
    }),
    prisma.profiles.findMany({
      where: { org_id: session.orgId },
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: [{ role: "asc" }, { created_at: "asc" }],
    }),
  ]);

  const members = await Promise.all(
    membersRaw.map(async (m) => {
      const total = await prisma.receipts.aggregate({
        where: { user_id: m.user_id },
        _sum: { amount_cents: true },
      });
      return {
        ...m,
        totalAmountCents: total._sum.amount_cents ?? 0,
      };
    })
  );

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Chapter settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Invite codes and members.
        </p>
      </div>

      <OrgSettings
        org={org ? { id: org.id, name: org.name } : { id: session.orgId, name: "" }}
        inviteCodes={inviteCodes}
        members={members}
        currentUserId={session.userId}
      />
    </main>
  );
}
