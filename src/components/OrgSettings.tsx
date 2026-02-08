"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Org = { id: string; name: string };
type InviteCode = {
  code: string;
  role: string;
  max_uses: number;
  uses: number;
  expires_at: Date | null;
  created_at: Date;
};
type Member = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  totalAmountCents: number;
  user: { id: string; email: string };
};

export function OrgSettings({
  org,
  inviteCodes,
  members,
  currentUserId,
}: {
  org: Org;
  inviteCodes: InviteCode[];
  members: Member[];
  currentUserId?: string;
}) {
  const [name, setName] = useState(org.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [inviteRole, setInviteRole] = useState<"member" | "treasurer" | "exec" | "admin">("member");
  const [inviteMaxUses, setInviteMaxUses] = useState(50);
  const [inviteCreating, setInviteCreating] = useState(false);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFeedback(label);
      setTimeout(() => setCopiedFeedback(null), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const saveName = async () => {
    setNameSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save.");
        return;
      }
      window.location.reload();
    } finally {
      setNameSaving(false);
    }
  };

  const createInvite = async () => {
    setInviteCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/org/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole, maxUses: inviteMaxUses }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create invite.");
        return;
      }
      const inviteLink = `${window.location.origin}/invite?code=${data.code}`;
      try {
        await navigator.clipboard.writeText(inviteLink);
      } catch {
        setError(`Invite created. Copy this link: ${inviteLink}`);
        return;
      }
      window.location.reload();
    } finally {
      setInviteCreating(false);
    }
  };

  const shareInviteLink = (code: string) => {
    const inviteLink = `${window.location.origin}/invite?code=${code}`;
    copyToClipboard(inviteLink, `link-${code}`);
  };

  const revokeCode = async (code: string) => {
    if (!confirm("Revoke this invite code?")) return;
    setRevokingCode(code);
    setError(null);
    try {
      const res = await fetch(`/api/org/invite-codes/revoke?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to revoke.");
        return;
      }
      window.location.reload();
    } finally {
      setRevokingCode(null);
    }
  };

  const updateMemberRole = async (userId: string, role: "member" | "treasurer" | "exec" | "admin") => {
    await fetch(`/api/org/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    window.location.reload();
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member? They will lose access to the chapter."))
      return;
    await fetch(`/api/org/members/${userId}`, { method: "DELETE" });
    window.location.reload();
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Chapter name */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter name</CardTitle>
        </CardHeader>
        <div className="flex gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chapter name"
            className="flex-1"
          />
          <Button onClick={saveName} disabled={nameSaving}>
            {nameSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>

      {/* Invite codes */}
      <Card>
        <CardHeader>
          <CardTitle>Invite codes</CardTitle>
        </CardHeader>
        <div className="mb-4 flex flex-wrap gap-2">
          <Select
            options={[
              { value: "member", label: "Member" },
              { value: "treasurer", label: "Treasurer" },
              { value: "exec", label: "Exec" },
              { value: "admin", label: "Admin" },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "member" | "treasurer" | "exec" | "admin")}
            className="w-32"
          />
          <input
            type="number"
            min={1}
            max={1000}
            value={inviteMaxUses}
            onChange={(e) => setInviteMaxUses(Number(e.target.value))}
            className="w-20 rounded-lg border border-neutral-200 px-2 py-2 text-sm"
          />
          <Button onClick={createInvite} disabled={inviteCreating}>
            {inviteCreating ? "Creating..." : "Create invite"}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {inviteCodes.map((ic) => (
            <div
              key={ic.code}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 p-3"
            >
              <div>
                <code className="font-mono text-sm font-medium">{ic.code}</code>
                <span className="ml-2 text-sm text-neutral-500">
                  {ic.role} · {ic.uses}/{ic.max_uses} uses
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => shareInviteLink(ic.code)}
                >
                  {copiedFeedback === `link-${ic.code}` ? "Copied!" : "Share invite link"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(ic.code, `code-${ic.code}`)}
                >
                  {copiedFeedback === `code-${ic.code}` ? "Copied!" : "Copy code"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeCode(ic.code)}
                  disabled={revokingCode === ic.code}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {revokingCode === ic.code ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            </div>
          ))}
          {inviteCodes.length === 0 && (
            <p className="py-4 text-center text-sm text-neutral-500">
              No invite codes yet. Create one above.
            </p>
          )}
        </div>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const isSelf = currentUserId === m.user.id;
            return (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 p-3"
              >
                <div>
                  <p className="font-medium">
                    {m.first_name} {m.last_name}
                    {isSelf && (
                      <span className="ml-1 text-xs text-neutral-500">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">{m.user.email}</p>
                  <p className="text-xs text-neutral-600">
                    {m.role} · {formatCurrency(m.totalAmountCents)} submitted
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {isSelf ? (
                    <span className="text-sm text-neutral-600 capitalize">{m.role}</span>
                  ) : (
                    <Select
                      options={[
                        { value: "member", label: "Member" },
                        { value: "treasurer", label: "Treasurer" },
                        { value: "exec", label: "Exec" },
                        { value: "admin", label: "Admin" },
                      ]}
                      value={m.role}
                      onChange={(e) => updateMemberRole(m.user.id, e.target.value as "member" | "treasurer" | "exec" | "admin")}
                      className="w-28"
                    />
                  )}
                  {!isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(m.user.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
