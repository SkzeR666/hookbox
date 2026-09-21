"use client";

import { useEffect, useState } from "react";
import { Badge, IconButton } from "@hookbox/ui";
import type { CapturedRequest } from "@hookbox/core";
import { cn } from "@hookbox/ui";
import { GitCompareArrows, LoaderCircle, X } from "lucide-react";
import { InsetPanel, TileLabel } from "./bento";
import { MethodBadge } from "./request-inspector";

interface Props {
  /** The two request ids being compared. */
  leftId: string;
  rightId: string;
  /** Provide data directly (demo mode); omit to fetch from the live API. */
  data?: { left: CapturedRequest | null; right: CapturedRequest | null };
  onClose: () => void;
}

type Side = "left" | "right";

export function CompareView({ leftId, rightId, data, onClose }: Props) {
  const [live, setLive] = useState<Record<Side, CapturedRequest | null>>({
    left: null,
    right: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setLive({ left: data.left, right: data.right });
      return;
    }
    let active = true;
    Promise.all(
      (["left", "right"] as const).map((side) =>
        fetch(`/api/requests/${side === "left" ? leftId : rightId}`)
          .then((r) =>
            r.ok ? (r.json() as Promise<{ request: CapturedRequest }>) : null,
          )
          .then((d) => [side, d?.request ?? null] as const)
          .catch(() => [side, null] as const),
      ),
    ).then((pairs) => {
      if (!active) return;
      const next: Record<Side, CapturedRequest | null> = {
        left: null,
        right: null,
      };
      for (const [side, req] of pairs) next[side] = req;
      setLive(next);
      if (!next.left || !next.right) setError("failed to load one of the requests");
    });
    return () => {
      active = false;
    };
  }, [leftId, rightId, data]);

  const a = live.left;
  const b = live.right;

  const rows = a && b ? diffRows(a, b) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4">
        <span className="inline-flex min-w-0 items-center gap-2 font-mono text-sm font-medium text-[var(--fg)]">
          <GitCompareArrows
            className="size-4 shrink-0 text-[var(--accent)]"
            strokeWidth={1.75}
          />
          Compare requests
        </span>
        <IconButton label="Close compare" size="sm" onClick={onClose}>
          <X />
        </IconButton>
      </div>

      {!a || !b ? (
        <div
          className="flex min-h-0 flex-1 items-center justify-center gap-3 p-8"
          role="status"
          aria-label="Loading comparison"
        >
          <LoaderCircle
            className="animate-spin size-5 text-[var(--muted-fg)]"
            strokeWidth={1.75}
            aria-hidden
          />
          {error && (
            <p className="font-mono text-sm text-[var(--danger)]">{error}</p>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
          {/* identity cards */}
          <div className="grid grid-cols-2 gap-3">
            {([a, b] as const).map((req, i) => (
              <InsetPanel key={req.id} className="animate-fade">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                  <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--fg)]">
                    <MethodBadge method={req.method} />
                    <code className="truncate">{req.path || "/"}</code>
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[0.15em] text-[#5a6a60] uppercase">
                    {i === 0 ? "A" : "B"}
                  </span>
                </div>
                <dl className="space-y-1 px-4 py-3 font-mono text-[11.5px] text-[var(--muted-fg)]">
                  <div className="flex justify-between gap-2">
                    <dt>id</dt>
                    <dd className="truncate text-[var(--fg)]">{req.id}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>size</dt>
                    <dd className="text-[var(--fg)]">
                      {req.sizeBytes.toLocaleString()} B
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>received</dt>
                    <dd className="truncate text-[var(--fg)]">
                      {new Date(req.receivedAt).toLocaleTimeString()}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>ip</dt>
                    <dd className="truncate text-[var(--fg)]">{req.ip ?? "?"}</dd>
                  </div>
                </dl>
              </InsetPanel>
            ))}
          </div>

          {/* deltas */}
          <TileLabel className="mt-5 mb-2">Differences</TileLabel>
          {rows.length === 0 ? (
            <p className="py-6 text-center font-mono text-[13px] text-[var(--muted-fg)]">
              Requests are identical in method, path, headers and body.
            </p>
          ) : (
            <InsetPanel className="animate-fade">
              <div className="grid grid-cols-[110px_1fr_1fr] font-mono text-[12px]">
                <div className="border-b border-[var(--border)] px-4 py-2 text-[10px] tracking-[0.15em] text-[#5a6a60] uppercase">
                  Field
                </div>
                <div className="border-b border-l border-[var(--border)] px-4 py-2 text-[10px] tracking-[0.15em] text-[#5a6a60] uppercase">
                  A
                </div>
                <div className="border-b border-l border-[var(--border)] px-4 py-2 text-[10px] tracking-[0.15em] text-[#5a6a60] uppercase">
                  B
                </div>
                {rows.map((row) => (
                  <Row key={row.field} row={row} />
                ))}
              </div>
            </InsetPanel>
          )}
        </div>
      )}
    </div>
  );
}

interface DiffRow {
  field: string;
  a: string;
  b: string;
  same: boolean;
}

function Row({ row }: { row: DiffRow }) {
  return (
    <>
      <div className="border-b border-[var(--border)] px-4 py-2.5 text-[var(--muted-fg)]">
        {row.field}
      </div>
      <div
        className={cn(
          "border-b border-l border-[var(--border)] px-4 py-2.5 break-all whitespace-pre-wrap",
          row.same ? "text-[var(--fg)]" : "bg-yellow-500/8 text-yellow-200",
        )}
      >
        {row.a || <span className="text-[#5a6a60]">—</span>}
      </div>
      <div
        className={cn(
          "border-b border-l border-[var(--border)] px-4 py-2.5 break-all whitespace-pre-wrap",
          row.same ? "text-[var(--fg)]" : "bg-yellow-500/8 text-yellow-200",
        )}
      >
        {row.b || <span className="text-[#5a6a60]">—</span>}
      </div>
    </>
  );
}

function diffRows(a: CapturedRequest, b: CapturedRequest): DiffRow[] {
  const rows: DiffRow[] = [];

  if (a.method !== b.method)
    rows.push({ field: "method", a: a.method, b: b.method, same: false });
  if ((a.path || "/") !== (b.path || "/"))
    rows.push({ field: "path", a: a.path || "/", b: b.path || "/", same: false });
  if (a.contentType !== b.contentType)
    rows.push({
      field: "content-type",
      a: a.contentType ?? "—",
      b: b.contentType ?? "—",
      same: false,
    });
  if (a.body !== b.body)
    rows.push({ field: "body", a: a.body || "—", b: b.body || "—", same: false });

  const keys = new Set([...Object.keys(a.headers), ...Object.keys(b.headers)]);
  const HEADER_SKIP = /^(host|content-length|connection|date|user-agent|accept-encoding)$/i;
  for (const key of [...keys].sort()) {
    if (HEADER_SKIP.test(key)) continue; // per-request noise
    const va = a.headers[key];
    const vb = b.headers[key];
    if (va !== vb) {
      rows.push({
        field: `header · ${key}`,
        a: va ?? "—",
        b: vb ?? "—",
        same: false,
      });
    }
  }

  return rows;
}

/** Kept for parity with the inspector footer strip. */
export function CompareFooter({ a, b }: { a: CapturedRequest; b: CapturedRequest }) {
  const delta = Math.abs(
    new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 border-t border-[var(--border)] px-5 font-mono text-[11px] text-[var(--muted-fg)]">
      <Badge tone="gray">{delta.toLocaleString()} ms apart</Badge>
      <span>
        {a.sizeBytes.toLocaleString()} B vs {b.sizeBytes.toLocaleString()} B
      </span>
    </div>
  );
}
