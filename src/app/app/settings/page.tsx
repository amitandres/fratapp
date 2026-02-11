import { prisma } from "@/lib/prisma";
import { requireCurrentUserAndProfile } from "@/lib/auth";
import { canManageOrgSettings } from "@/lib/permissions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { OrgSettings } from "@/components/OrgSettings";
import { ProfileSettings } from "@/components/ProfileSettings";

export default async function SettingsPage() {
  const session = await requireCurrentUserAndProfile();
  const isExec = canManageOrgSettings(session.role as "member" | "treasurer" | "exec" | "admin");

  const [org, inviteCodes, membersRaw] = isExec
    ? await Promise.all([
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
      ])
    : [null, [], []];

  const members = membersRaw.length
    ? await Promise.all(
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
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          Your account and chapter.
        </p>
      </div>

      <ProfileSettings />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-neutral-600">Role:</span>{" "}
            <span className="capitalize">{session.role}</span>
          </p>
          <p>
            <span className="font-medium text-neutral-600">Org ID:</span>{" "}
            <span className="font-mono text-xs">{session.orgId}</span>
          </p>
        </div>
      </Card>

      {isExec && org && (
        <>
          <h2 className="text-base font-semibold text-neutral-900">Chapter</h2>
          <OrgSettings
          org={{ id: org.id, name: org.name }}
          inviteCodes={inviteCodes}
          members={members}
          currentUserId={session.userId}
        />
        </>
      )}
    </div>
  );
}
