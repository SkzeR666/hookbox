"use client";

import { Badge } from "@hookbox/ui";
import type { RequestListItem } from "@hookbox/core";
import { cn } from "@hookbox/ui";

interface Props {
  requests: RequestListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const METHOD_TONE: Record<string, string> = {
  GET: "text-sky-300",
  POST: "text-emerald-300",
  PUT: "text-yellow-300",
  PATCH: "text-purple-300",
  DELETE: "text-red-300",
  OPTIONS: "text-gray-400",
  HEAD: "text-gray-400",
};

export function RequestList({ requests, selectedId, onSelect }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      {requests.length === 0 ? (
        <div className="p-6 text-center font-mono text-[13px] text-[var(--muted-fg)]">
          No requests yet.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {requests.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onSelect(r.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  r.id === selectedId
                    ? "bg-[#111610]"
                    : "hover:bg-[#0f130f]",
                )}
              >
                <span
                  className={cn(
                    "w-16 shrink-0 font-mono text-[12px] font-semibold",
                    METHOD_TONE[r.method] ?? "text-gray-300",
                  )}
                >
                  {r.method}
                </span>
                <Badge tone="green" className="shrink-0">
                  200
                </Badge>
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--fg)]">
                  {r.path}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[var(--muted-fg)]">
                  {formatSize(r.sizeBytes)}
                </span>
                <span className="hidden shrink-0 font-mono text-[11px] text-[var(--muted-fg)] sm:inline">
                  {formatTime(r.receivedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}