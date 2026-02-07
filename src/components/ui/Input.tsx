import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>(function Input({ label, error, className = "", ...props }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-50 disabled:text-neutral-500 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </label>
  );
});
