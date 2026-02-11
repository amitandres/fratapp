"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type InviteStatus = "idle" | "checking" | "valid" | "invalid";

const DEBOUNCE_MS = 250;

/**
 * Native form POST + server redirect for signup: same bulletproof cookie flow as login.
 * Invite code: debounced validation on keystroke + on Enter.
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
  const [usesRemaining, setUsesRemaining] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("venmo");
  const [paymentHandle, setPaymentHandle] = useState("");

  const validateCode = useCallback(async (value: string) => {
    if (!value) {
      setStatus("idle");
      setInviteError(null);
      setOrgName(null);
      setRole(null);
      setUsesRemaining(null);
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
        setUsesRemaining(null);
        return;
      }

      setStatus("valid");
      setOrgName(payload.orgName);
      setRole(payload.role);
      setUsesRemaining(payload.usesRemaining ?? null);
    } catch {
      setStatus("invalid");
      setInviteError("Unable to validate invite code.");
      setOrgName(null);
      setRole(null);
      setUsesRemaining(null);
    }
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialCode) {
      validateCode(initialCode);
    }
  }, [initialCode, validateCode]);

  const handleCodeChange = (value: string) => {
    const trimmed = value.trim();
    setCode(trimmed);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!trimmed) {
      setStatus("idle");
      setInviteError(null);
      setOrgName(null);
      setRole(null);
      setUsesRemaining(null);
      return;
    }
    debounceRef.current = setTimeout(() => validateCode(trimmed), DEBOUNCE_MS);
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.trim()) {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      validateCode(code.trim());
    }
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

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
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleCodeKeyDown}
            className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2 text-base"
            placeholder="Enter code (or paste from invite link)"
            autoComplete="one-time-code"
          />
        </label>

        {status === "checking" ? (
          <p className="text-sm text-neutral-500">Checking code…</p>
        ) : null}

        {status === "invalid" && inviteError ? (
          <p className="text-sm text-red-600">{inviteError}</p>
        ) : null}

        {status === "valid" && orgName && role ? (
          <p className="text-sm text-emerald-700">
            Invited to {orgName} as {role}.
            {usesRemaining != null ? ` ${usesRemaining} invite${usesRemaining === 1 ? "" : "s"} remaining.` : ""}
          </p>
        ) : null}
      </div>

      {status === "valid" ? (
        <form
          action="/api/auth/signup"
          method="POST"
          className="mt-8 flex flex-col gap-4"
          onSubmit={() => setIsCreating(true)}
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
              <option value="cashapp">CashApp</option>
              <option value="zelle">Zelle</option>
              <option value="other">Other</option>
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
            disabled={isCreating}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isCreating ? "Creating account…" : "Create account"}
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
