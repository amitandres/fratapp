"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const categories = [
  { value: "food", label: "Food" },
  { value: "drinks", label: "Drinks" },
  { value: "hardware", label: "Hardware" },
  { value: "lights", label: "Lights" },
  { value: "other", label: "Other" },
];

function formatAmount(val: string): string {
  const num = parseFloat(val.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return "";
  return num.toFixed(2);
}

function parseAmount(val: string): number {
  return parseFloat(val) || 0;
}

export default function UploadReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [category, setCategory] = useState("food");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const amount = parseAmount(amountRaw);
  const isValid =
    description.trim().length > 0 &&
    amount > 0 &&
    file !== null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleAmountBlur = () => {
    if (amountRaw) setAmountRaw(formatAmount(amountRaw));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!file || !isValid) return;

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
        headers: { "Content-Type": file.type },
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
          description: description.trim(),
          amount: amount.toFixed(2),
          category,
          photoKey: uploadPayload.key,
        }),
      });

      const receiptPayload = await receiptResponse.json();
      if (!receiptResponse.ok) {
        setError(receiptPayload.error ?? "Failed to save receipt.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/app/receipts");
        router.refresh();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h2 className="text-xl font-semibold text-neutral-900">Receipt submitted</h2>
        <p className="mt-1 text-sm text-neutral-600">Redirecting to Receipts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Upload receipt</h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          Add a receipt for reimbursement.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Card>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">
                Receipt photo
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-8 text-center transition-colors hover:border-neutral-300 hover:bg-neutral-100"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-40 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="text-3xl">📷</span>
                    <p className="mt-2 text-sm text-neutral-600">
                      Tap to take a photo or choose from gallery
                    </p>
                  </>
                )}
              </div>
            </div>

            <Input
              label="Amount ($)"
              type="text"
              inputMode="decimal"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="0.00"
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              required
            />
            <Select
              label="Category"
              options={categories}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit receipt"}
        </Button>
      </form>
    </div>
  );
}
