import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    className = "",
    disabled,
    children,
    ...props
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-black text-white hover:bg-neutral-800 focus:ring-neutral-900",
    secondary:
      "border border-neutral-200 bg-white text-black hover:bg-neutral-50 focus:ring-neutral-300",
    ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const width = fullWidth ? "w-full" : "";

  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});
