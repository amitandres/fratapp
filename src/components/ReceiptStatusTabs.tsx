"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
] as const;

export function ReceiptStatusTabs({
  currentStatus,
  basePath = "/app/receipts",
}: {
  currentStatus: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setStatus = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set("status", value);
    } else {
      next.delete("status");
    }
    router.push(`${basePath}?${next.toString()}`);
  };

  return (
    <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => setStatus(tab.value)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            (tab.value === "" && !currentStatus) || currentStatus === tab.value
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
