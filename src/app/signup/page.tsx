"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type InviteStatus = "idle" | "checking" | "valid" | "invalid";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";

  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("venmo");
  const [paymentHandle, setPaymentHandle] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCode = async (value: string) => {
    if (!value) {
      setStatus("idle");
      setInviteError(null);
      setOrgName(null);
      setRole(null);
      return;
    }

    setStatus("checking");
    setInviteError(null);
    try {
      const response = await fetch(
        `/api/auth/invite?code=${encodeURIComponent(value)}`
      );
      const payload = await response.json();
      if (!response.ok || !payload.valid) {
        setStatus("invalid");
        setInviteError(payload.error ?? "Invalid invite code.");
        setOrgName(null);
        setRole(null);
        return;
      }

      setStatus("valid");
      setOrgName(payload.orgName);
      setRole(payload.role);
    } catch {
      setStatus("invalid");
      setInviteError("Unable to validate invite code.");
      setOrgName(null);
      setRole(null);
    }
  };

  useEffect(() => {
    if (initialCode) {
      validateCode(initialCode);
    }
  }, [initialCode]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          firstName,
          lastName,
          email,
          password,
          paymentMethod,
          paymentHandle: paymentHandle || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(payload.error ?? "Signup failed.");
        return;
      }

      router.push(payload.redirectUrl ?? "/app");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Invite-only access for your chapter.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <label className="text-sm font-medium">
          Invite code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            onBlur={() => validateCode(code)}
            className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2 text-base"
            placeholder="Enter code"
          />
        </label>

        {status === "checking" ? (
          <p className="text-sm text-neutral-500">Checking code...</p>
        ) : null}

        {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}

        {status === "valid" ? (
          <p className="text-sm text-emerald-700">
            Invited to {orgName} as {role}.
          </p>
        ) : null}
      </div>

      {status === "valid" ? (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            First name
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Last name
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
              required
              minLength={8}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Payment method
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            >
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="paypal">PayPal</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Payment handle (optional)
            <input
              value={paymentHandle}
              onChange={(event) => setPaymentHandle(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            />
          </label>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      ) : null}
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-neutral-600">Loading...</p>
      </main>
    }>
      <SignupForm />
    </Suspense>
  );
}
