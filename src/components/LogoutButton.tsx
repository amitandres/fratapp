"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogout = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isSubmitting}
      className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-semibold disabled:opacity-60"
    >
      {isSubmitting ? "Logging out..." : "Log out"}
    </button>
  );
}
