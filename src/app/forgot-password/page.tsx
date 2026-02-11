"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "If that email exists, we sent a reset link.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="rounded-md border border-neutral-200 px-3 py-2 text-base disabled:opacity-60"
          />
        </label>

        {message ? (
          <p
            className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Send reset link"}
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
