type Status =
  | "submitted"
  | "approved"
  | "paid"
  | "rejected"
  | "needs_review";

const statusStyles: Record<Status, string> = {
  submitted: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  paid: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  needs_review: "bg-purple-100 text-purple-800",
};

export function Badge({
  status,
  className = "",
}: {
  status: Status;
  className?: string;
}) {
  const style = (statusStyles as Record<string, string>)[status] ?? "bg-neutral-100 text-neutral-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
