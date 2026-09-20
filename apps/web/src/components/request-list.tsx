"use client";

import { Badge, Tooltip } from "@hookbox/ui";
import type { RequestListItem } from "@hookbox/core";
import { cn } from "@hookbox/ui";
import { ChevronRight, Inbox } from "lucide-react";

interface Props {
  requests: RequestListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title?: string;
  /** Show a pulsing "live" dot in the header. */
  live?: boolean;
}

const METHOD_TONE: Record<
  string,
  "green" | "blue" | "yellow" | "purple" | "red" | "gray"
> = {
  GET: "blue",
  POST: "green",
  PUT: "yellow",
  PATCH: "purple",
  DELETE: "red",
  OPTIONS: "gray",
  HEAD: "gray",
};

export function RequestList({
  requests,
  selectedId,
  onSelect,
  title = "Requests",
  live = false,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-4">
        <Inbox
          className="size-3.5 text-[var(--muted-fg)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--muted-fg)] uppercase">
          {title}
        </span>
        <span className="font-mono text-[11px] text-[var(--muted-fg)]">
          {requests.length}
        </span>
        {live && (
          <Tooltip label="Streaming via SSE" className="ml-auto">
            <span className="inline-flex cursor-default items-center gap-1.5 font-mono text-[10.5px] text-[var(--accent)]">
              <span
                className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
              live
            </span>
          </Tooltip>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <p className="hidden p-6 text-center font-mono text-[12px] text-[var(--muted-fg)] sm:block">
            No requests yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {requests.map((r) => {
              const selected = r.id === selectedId;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => onSelect(r.id)}
                    aria-pressed={selected}
                    aria-label={`${r.method} ${r.path}`}
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-100",
                      selected
                        ? "bg-[#131a15] shadow-[inset_2px_0_0_0_var(--accent)]"
                        : "hover:bg-[#0e120f]",
                    )}
                  >
                    <Badge
                      tone={METHOD_TONE[r.method] ?? "gray"}
                      className="w-16 shrink-0 justify-center py-1 font-semibold"
                    >
                      {r.method}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[var(--fg)]">
                      {r.path}
                    </span>
                    <span className="hidden shrink-0 font-mono text-[11px] text-[var(--muted-fg)] md:inline">
                      {formatSize(r.sizeBytes)}
                    </span>
                    <Tooltip
                      label={new Date(r.receivedAt).toLocaleString()}
                      className="hidden shrink-0 sm:inline-flex"
                    >
                      <span
                        suppressHydrationWarning
                        className="cursor-default font-mono text-[11px] text-[var(--muted-fg)]"
                      >
                        {formatTime(r.receivedAt)}
                      </span>
                    </Tooltip>
                    <ChevronRight
                      aria-hidden
                      className={cn(
                        "size-3.5 shrink-0 text-[var(--muted-fg)] transition-[opacity,transform] duration-150 ease-out",
                        selected
                          ? "opacity-100"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
