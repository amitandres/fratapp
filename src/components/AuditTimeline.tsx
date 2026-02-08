"use client";

import { useState, useEffect } from "react";

type Log = {
  id: string;
  action: string;
  metadata: unknown;
  created_at: string;
};

export function AuditTimeline({ receiptId }: { receiptId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || logs.length > 0) return;
    setLoading(true);
    fetch(`/api/admin/receipts/${receiptId}/audit`)
      .then((r) => r.json())
      .then((d) => {
        if (d.logs) setLogs(d.logs);
      })
      .finally(() => setLoading(false));
  }, [open, receiptId, logs.length]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace("RECEIPT ", "").toLowerCase();
  };

  return (
    <details
      className="rounded-lg border border-neutral-200"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        Audit timeline
      </summary>
      <div className="border-t border-neutral-200 p-3">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-neutral-500">No audit entries.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="text-sm">
                <span className="font-medium">{formatAction(log.action)}</span>
                <span className="text-neutral-500">
                  {" "}
                  · {new Date(log.created_at).toLocaleString()}
                </span>
                {log.metadata &&
                  typeof log.metadata === "object" &&
                  "reason" in (log.metadata as Record<string, unknown>) ? (
                    <p className="mt-0.5 text-xs text-neutral-600">
                      Reason: {(log.metadata as Record<string, string>).reason}
                    </p>
                  ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
