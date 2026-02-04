"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const categories = ["food", "drinks", "hardware", "lights", "other"] as const;

export default function UploadReceiptPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("food");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Please upload a receipt photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadResponse = await fetch("/api/storage/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });

      const uploadPayload = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setError(uploadPayload.error ?? "Failed to start upload.");
        return;
      }

      const uploadResult = await fetch(uploadPayload.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResult.ok) {
        setError("Upload failed. Please try again.");
        return;
      }

      const receiptResponse = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: uploadPayload.receiptId,
          description,
          amount,
          category,
          photoKey: uploadPayload.key,
        }),
      });

      const receiptPayload = await receiptResponse.json();
      if (!receiptResponse.ok) {
        setError(receiptPayload.error ?? "Failed to save receipt.");
        return;
      }

      router.push("/app/receipts");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload receipt</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Add a receipt for reimbursement.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Amount
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Category
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof categories)[number])
            }
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Receipt photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-md border border-neutral-200 px-3 py-2 text-base"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Uploading..." : "Submit receipt"}
        </button>
      </form>
    </main>
  );
}
