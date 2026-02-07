import { forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: { value: string; label: string }[];
  }
>(function Select({ label, options, className = "", ...props }, ref) {
  return (
    <label className="inline-block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
        </span>
      )}
      <select
        ref={ref}
        className={`rounded-lg border border-neutral-200 px-3 py-2 text-base text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-50 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
});
