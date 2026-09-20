"use client";

import { useEffect, useState } from "react";
import { Badge, Button } from "@hookbox/ui";
import { buildCurl, buildRawRequest } from "@hookbox/core/http";
import type { CapturedRequest } from "@hookbox/core";
import { cn } from "@hookbox/ui";
import { ReplayDialog } from "./replay-dialog";

type Tab = "headers" | "query" | "body" | "raw";

interface Props {
  requestId: string;
}

export function RequestInspector({ requestId }: Props) {
  const [request, setRequest] = useState<CapturedRequest | null>(null);
  const [tab, setTab] = useState<Tab>("headers");
  const [replaying, setReplaying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setRequest(null);
    setError(null);
    fetch(`/api/requests/${requestId}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed to load");
        return r.json() as Promise<{ request: CapturedRequest }>;
      })
      .then((d) => active && setRequest(d.request))
      .catch((e) => active && setError(e instanceof Error ? e.message : "error"));
    return () => {
      active = false;
    };
  }, [requestId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-[var(--muted-fg)]">Loading…</p>
      </div>
    );
  }

  const fields: Array<[string, string]> = Object.entries(request.headers ?? {});
  const queryEntries: Array<[string, unknown]> = Object.entries(
    request.query ?? {},
  );

  const curl = buildCurl({
    url: `${window.location.origin}/i/${request.inboxId}`,
    method: request.method,
    headers: request.headers,
    body: request.body || undefined,
  });

  const raw = buildRawRequest({
    method: request.method,
    url: `${window.location.origin}/i/${request.inboxId}`,
    headers: request.headers,
    body: request.body || undefined,
  });

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // unsupported
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3 font-mono text-[13px]">
          <Badge tone="green" className="font-semibold">
            {request.method}
          </Badge>
          <code className="max-w-[50vw] truncate text-[var(--fg)]">
            {request.path || "/"}
          </code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setReplaying(true)}>
            Replay
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[var(--border)] px-4 py-2 font-mono text-[12px]">
        {(["headers", "query", "body", "raw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded px-2 py-1 uppercase tracking-wide transition-colors",
              tab === t
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "text-[var(--muted-fg)] hover:text-[var(--fg)]",
            )}
          >
            {t}
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-[var(--border)]" />

        <button
          onClick={() => copy("curl", curl)}
          className="text-[var(--muted-fg)] hover:text-[var(--fg)]"
        >
          {copied === "curl" ? "Copied" : "Copy cURL"}
        </button>
        <button
          onClick={() => copy("json", JSON.stringify(request, null, 2))}
          className="text-[var(--muted-fg)] hover:text-[var(--fg)]"
        >
          {copied === "json" ? "Copied" : "Copy JSON"}
        </button>
        <button
          onClick={() => copy("raw", raw)}
          className="text-[var(--muted-fg)] hover:text-[var(--fg)]"
        >
          {copied === "raw" ? "Copied" : "Copy raw"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "headers" &&
          (fields.length ? (
            <table className="w-full font-mono text-[12.5px]">
              <tbody>
                {fields.map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--border)] align-top">
                    <td className="w-56 px-3 py-2 text-[var(--accent)]">{k}</td>
                    <td className="break-all whitespace-pre-wrap px-3 py-2 text-[var(--fg)]">
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyNote>No headers.</EmptyNote>
          ))}

        {tab === "query" &&
          (queryEntries.length ? (
            <table className="w-full font-mono text-[12.5px]">
              <tbody>
                {queryEntries.map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--border)] align-top">
                    <td className="w-56 px-3 py-2 text-[var(--accent)]">{k}</td>
                    <td className="break-all px-3 py-2 text-[var(--fg)]">
                      {JSON.stringify(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyNote>No query params.</EmptyNote>
          ))}

        {tab === "body" &&
          (request.body ? (
            <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[#0a0e0c] p-4 font-mono text-[12.5px] leading-relaxed text-[var(--fg)]">
              {request.body}
              {request.bodyTruncated && (
                <div className="mt-2 text-[var(--danger)]">
                  … body truncated at 1 MB limit
                </div>
              )}
            </pre>
          ) : (
            <EmptyNote>No body.</EmptyNote>
          ))}

        {tab === "raw" && (
          <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[#0a0e0c] p-4 font-mono text-[12.5px] leading-relaxed text-[var(--fg)]">
            {raw}
          </pre>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] px-4 py-2.5 text-[11px] font-mono text-[var(--muted-fg)]">
        {request.ip ? `from ${request.ip}` : "from ?"} ·{" "}
        {formatSize(request.sizeBytes)} · received{" "}
        {new Date(request.receivedAt).toLocaleString()}
      </div>

      {replaying && (
        <ReplayDialog
          requestId={request.id}
          initialMethod={request.method}
          initialHeaders={request.headers}
          initialBody={request.body}
          onClose={() => setReplaying(false)}
        />
      )}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center font-mono text-[13px] text-[var(--muted-fg)]">
      {children}
    </p>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}