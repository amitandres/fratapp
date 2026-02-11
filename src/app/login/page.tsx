"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Native form POST + server redirect: most reliable for cookie persistence.
 * Browser handles Set-Cookie in redirect response natively—no fetch/JS edge cases.
 */
function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";
  const errorFromUrl = searchParams.get("error");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Use your invite email to sign in.
      </p>

      <form
        action="/api/auth/login"
        method="POST"
        className="mt-8 flex flex-col gap-4"
      >
        <input type="hidden" name="next" value={nextPath} />

        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Password
          <div className="flex items-center justify-between gap-2">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-base"
            />
            <Link
              href="/forgot-password"
              className="shrink-0 text-sm text-neutral-600 underline hover:text-neutral-800"
            >
              Forgot password?
            </Link>
          </div>
        </label>

        {errorFromUrl ? (
          <p className="text-sm text-red-600">{errorFromUrl}</p>
        ) : null}

        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="mt-2 text-sm text-neutral-600">Loading...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
