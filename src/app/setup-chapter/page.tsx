"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupChapterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(data.redirectUrl ?? `/signup?code=${data.inviteCode}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <h1 className="text-2xl font-semibold">Set up a new chapter</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Create your chapter, then sign up as the first admin.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Chapter name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sammy Chapter"
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            required
            minLength={1}
            maxLength={100}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create chapter"}
        </button>
      </form>

      <a
        href="/"
        className="mt-6 text-center text-sm text-neutral-600 hover:text-black"
      >
        Back to home
      </a>
    </main>
  );
}
