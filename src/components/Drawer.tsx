"use client";

import { useEffect } from "react";

export function Drawer({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={className}>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-white shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[80vh] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <h2 id="drawer-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
