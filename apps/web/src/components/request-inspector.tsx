"use client";

import { useEffect, useState } from "react";
import { Badge, Button, IconButton } from "@hookbox/ui";
import { buildCurl, buildRawRequest } from "@hookbox/core/http";
import type { CapturedRequest } from "@hookbox/core";
import { cn } from "@hookbox/ui";
import {
  Braces,
  Check,
  Code2,
  Copy,
  FileJson,
  Globe,
  Link2,
  LoaderCircle,
  Play,
  Variable,
} from "lucide-react";
import { ReplayDialog } from "./replay-dialog";
import { JsonView } from "./json-view";

type Tab = "headers" | "query" | "body" | "raw";

export interface InspectorData {
  request: CapturedRequest | null;
  error: string | null;
}

interface Props {
  requestId: string;
  /** Provide data directly (demo mode); omit to fetch from the live API. */
  data?: InspectorData;
  /** Called when Replay is clicked (demo mode intercepts; live opens the dialog). */
  onReplay?: () => void;
  footerExtra?: React.ReactNode;
}

const TABS: Array<{ id: Tab; label: string; icon: typeof Globe }> = [
  { id: "headers", label: "Headers", icon: Globe },
  { id: "query", label: "Query", icon: Variable },
  { id: "body", label: "Body", icon: Braces },
  { id: "raw", label: "Raw", icon: Code2 },
];

export function RequestInspector({ requestId, data, onReplay, footerExtra }: Props) {
  const [live, setLive] = useState<CapturedRequest | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("headers");
  const [replaying, setReplaying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (data) return; // demo mode — nothing to fetch
    let active = true;
    setLive(null);
    setLiveError(null);
    fetch(`/api/requests/${requestId}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed to load");
        return r.json() as Promise<{ request: CapturedRequest }>;
      })
      .then((d) => active && setLive(d.request))
      .catch(
        (e) => active && setLiveError(e instanceof Error ? e.message : "error"),
      );
    return () => {
      active = false;
    };
  }, [requestId, data]);

  const request = data ? data.request : live;
  const error = data ? data.error : liveError;

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-mono text-sm text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 p-8"
        role="status"
        aria-label="Loading request"
      >
        <LoaderCircle
          className="animate-spin size-5 text-[var(--muted-fg)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="w-full max-w-56 space-y-1.5">
          <div className="h-2.5 w-3/4 animate-pulse rounded bg-white/5" />
          <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/5 [animation-delay:150ms]" />
        </div>
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

  const openReplay = () => {
    if (onReplay) onReplay();
    else setReplaying(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3 font-mono text-[13px]">
          <MethodBadge method={request.method} />
          <code className="truncate text-[var(--fg)]">
            {request.path || "/"}
          </code>
        </div>
        <Button size="sm" variant="secondary" onClick={openReplay}>
          <Play className="size-3.5" />
          Replay
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1 border-b border-[var(--border)] px-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 px-3 py-3 font-mono text-[12px] transition-colors",
              tab === id
                ? "text-[var(--accent)]"
                : "text-[var(--muted-fg)] hover:text-[var(--fg)]",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
            {label}
            {tab === id && (
              <span className="animate-fade absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        ))}

        <div className="mx-2 h-4 w-px bg-[var(--border)]" />

        <IconButton
          size="sm"
          label="Copy as cURL"
          onClick={() => copy("curl", curl)}
        >
          {copied === "curl" ? (
            <Check className="text-[var(--accent)]" />
          ) : (
            <Link2 />
          )}
        </IconButton>
        <IconButton
          size="sm"
          label="Copy as JSON"
          onClick={() => copy("json", JSON.stringify(request, null, 2))}
        >
          {copied === "json" ? (
            <Check className="text-[var(--accent)]" />
          ) : (
            <FileJson />
          )}
        </IconButton>
        <IconButton
          size="sm"
          label="Copy raw request"
          onClick={() => copy("raw", raw)}
        >
          {copied === "raw" ? <Check className="text-[var(--accent)]" /> : <Copy />}
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === "headers" &&
          (fields.length ? (
            <table className="animate-fade w-full font-mono text-[12.5px]">
              <tbody>
                {fields.map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--border)] align-top">
                    <td className="w-60 px-3 py-2.5 text-[var(--accent)]">{k}</td>
                    <td className="break-all px-3 py-2.5 leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
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
            <table className="animate-fade w-full font-mono text-[12.5px]">
              <tbody>
                {queryEntries.map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--border)] align-top">
                    <td className="w-60 px-3 py-2.5 text-[var(--accent)]">{k}</td>
                    <td className="break-all px-3 py-2.5 leading-relaxed text-[var(--fg)]">
                      <JsonView text={JSON.stringify(v)} />
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
            <div className="animate-fade overflow-x-auto rounded-lg border border-[var(--border)] bg-[#0a0e0c]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                <span className="font-mono text-[10.5px] tracking-[0.15em] text-[#5a6a60] uppercase">
                  request body
                </span>
                <button
                  onClick={() => copy("body", request.body)}
                  className="inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] text-[#5a6a60] transition-colors hover:text-[var(--fg)]"
                >
                  {copied === "body" ? (
                    <Check className="size-3 text-[var(--accent)]" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied === "body" ? "copied" : "copy"}
                </button>
              </div>
              <pre className="p-5 font-mono text-[12.5px] leading-[1.75] text-[var(--fg)]">
                <JsonView text={request.body} />
                {request.bodyTruncated && (
                  <div className="mt-2 text-[var(--danger)]">
                    … body truncated at 1 MB limit
                  </div>
                )}
              </pre>
            </div>
          ) : (
            <EmptyNote>No body.</EmptyNote>
          ))}

        {tab === "raw" && (
          <pre className="animate-fade overflow-x-auto rounded-lg border border-[var(--border)] bg-[#0a0e0c] p-5 font-mono text-[12.5px] leading-[1.75] text-[var(--fg)]">
            {raw}
          </pre>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 border-t border-[var(--border)] px-5 py-3 font-mono text-[11px] whitespace-nowrap text-[var(--muted-fg)]">
        <span>{request.ip ? `from ${request.ip}` : "from ?"}</span>
        <Dot />
        <span>{request.sizeBytes.toLocaleString()} B</span>
        <Dot />
        <span>received {new Date(request.receivedAt).toLocaleString()}</span>
        {footerExtra}
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

function MethodBadge({ method }: { method: string }) {
  const TONE: Record<string, "green" | "blue" | "yellow" | "purple" | "red" | "gray"> = {
    GET: "blue",
    POST: "green",
    PUT: "yellow",
    PATCH: "purple",
    DELETE: "red",
    OPTIONS: "gray",
    HEAD: "gray",
  };
  return (
    <Badge tone={TONE[method] ?? "gray"} className="shrink-0 font-semibold">
      {method}
    </Badge>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-[var(--border)]">
      ·
    </span>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center font-mono text-[13px] text-[var(--muted-fg)]">
      {children}
    </p>
  );
}
