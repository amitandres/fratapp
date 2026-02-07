import { requireCurrentUserAndProfile } from "@/lib/auth";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function SettingsPage() {
  const session = await requireCurrentUserAndProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          Your account details.
        </p>
      </div>

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
    </div>
  );
}
