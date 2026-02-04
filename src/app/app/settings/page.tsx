import { requireCurrentUserAndProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireCurrentUserAndProfile();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-neutral-600">
        Basic account details from your profile.
      </p>
      <div className="rounded-md border border-neutral-200 p-4 text-sm">
        <p>
          <span className="font-medium">Role:</span> {session.role}
        </p>
        <p>
          <span className="font-medium">Org ID:</span> {session.orgId}
        </p>
      </div>
    </main>
  );
}
