"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Profile = {
  firstName: string;
  lastName: string;
  phone: string | null;
  paymentMethod: string;
  paymentHandle: string | null;
  email: string;
};

const PAYMENT_OPTIONS = [
  { value: "venmo", label: "Venmo" },
  { value: "cashapp", label: "CashApp" },
  { value: "zelle", label: "Zelle" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
] as const;

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number]["value"]>("venmo");
  const [paymentHandle, setPaymentHandle] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setPhone(data.phone ?? "");
        setPaymentMethod(
          PAYMENT_OPTIONS.some((o) => o.value === data.paymentMethod)
            ? data.paymentMethod
            : "other"
        );
        setPaymentHandle(data.paymentHandle ?? "");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || null,
          paymentMethod,
          paymentHandle: paymentHandle.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setProfile((p) =>
        p
          ? {
              ...p,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim() || null,
              paymentMethod,
              paymentHandle: paymentHandle.trim() || null,
            }
          : null
      );
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    profile &&
    (firstName.trim() !== profile.firstName ||
      lastName.trim() !== profile.lastName ||
      phone.trim() !== (profile.phone ?? "") ||
      paymentMethod !== profile.paymentMethod ||
      paymentHandle.trim() !== (profile.paymentHandle ?? ""));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <p className="text-sm text-neutral-500">Loading...</p>
      </Card>
    );
  }

  if (error && !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-4">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
        <Input
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Payment method
          </label>
          <Select
            options={PAYMENT_OPTIONS as unknown as { value: string; label: string }[]}
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as (typeof PAYMENT_OPTIONS)[number]["value"])
            }
            className="w-full"
          />
        </div>
        <Input
          label="Payment handle (optional)"
          value={paymentHandle}
          onChange={(e) => setPaymentHandle(e.target.value)}
          placeholder="e.g. @username, email, or phone"
        />
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        )}
      </div>
    </Card>
  );
}
