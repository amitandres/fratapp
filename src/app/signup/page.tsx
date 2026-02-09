"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type InviteStatus = "idle" | "checking" | "valid" | "invalid";

/**
 * Native form POST + server redirect for signup: same bulletproof cookie flow as login.
 */
function SignupForm() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const errorFromUrl = searchParams.get("error");

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
        <form
          action="/api/auth/signup"
          method="POST"
          className="mt-8 flex flex-col gap-4"
        >
          <input type="hidden" name="code" value={code} />

          <label className="flex flex-col gap-2 text-sm font-medium">
            First name
            <input
              name="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Last name
            <input
              name="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Email
            <input
              name="email"
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
              name="password"
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
              name="paymentMethod"
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
              name="paymentHandle"
              value={paymentHandle}
              onChange={(event) => setPaymentHandle(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            />
          </label>

          {errorFromUrl ? (
            <p className="text-sm text-red-600">{errorFromUrl}</p>
          ) : null}

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Create account
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
