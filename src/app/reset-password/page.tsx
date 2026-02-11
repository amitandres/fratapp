"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const errorFromUrl = searchParams.get("error") ?? "";
  const [token, setToken] = useState(tokenFromUrl);

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  if (!tokenFromUrl) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your reset link is invalid or missing. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 text-sm text-neutral-600 underline hover:text-neutral-800"
        >
          Request reset link
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter your new password below.
      </p>

      <form
        action="/api/auth/reset-password"
        method="POST"
        className="mt-8 flex flex-col gap-4"
      >
        <input type="hidden" name="token" value={token} />

        <label className="flex flex-col gap-2 text-sm font-medium">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            placeholder="At least 8 characters"
          />
        </label>

        {errorFromUrl ? (
          <p className="text-sm text-red-600">{errorFromUrl}</p>
        ) : null}

        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Reset password
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 text-sm text-neutral-600 underline hover:text-neutral-800"
      >
        Back to login
      </Link>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="mt-2 text-sm text-neutral-600">Loading...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
