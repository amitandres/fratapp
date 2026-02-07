import { forwardRef } from "react";

export const Card = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" }
>(function Card({ className = "", padding = "md", children, ...props }, ref) {
  const paddingClass =
    padding === "none" ? "" : padding === "sm" ? "p-3" : "p-4";
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-neutral-200 bg-white shadow-sm ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-3 ${className}`} {...props} />
);

export const CardTitle = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-sm font-semibold text-neutral-900 ${className}`} {...props} />
);
