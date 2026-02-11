"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SetupForm() {
  const searchParams = useSearchParams();
  const errorFromUrl = searchParams.get("error");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <h1 className="text-2xl font-semibold">Set up a new chapter</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Create your chapter, then sign up as the first admin.
      </p>

      <form action="/api/chapters" method="POST" className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Chapter name
          <input
            name="name"
            type="text"
            placeholder="e.g. Sammy Chapter"
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            required
            minLength={1}
            maxLength={100}
          />
        </label>

        {errorFromUrl && <p className="text-sm text-red-600">{errorFromUrl}</p>}

        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Create chapter
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

/**
 * Native form POST + server redirect: avoids fetch/405 issues on some hosts.
 */
export default function SetupChapterPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
          <h1 className="text-2xl font-semibold">Set up a new chapter</h1>
          <p className="mt-2 text-sm text-neutral-600">Loading...</p>
        </main>
      }
    >
      <SetupForm />
    </Suspense>
  );
}
