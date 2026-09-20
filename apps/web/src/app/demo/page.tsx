"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CapturedRequest, RequestListItem } from "@hookbox/core";
import { buildDemoDataset } from "@hookbox/core/demo-data";
import { ArrowLeft } from "lucide-react";
import { RequestList } from "@/components/request-list";
import { RequestInspector } from "@/components/request-inspector";
import { ReplayDialog } from "@/components/replay-dialog";

export default function DemoPage() {
  const dataset = useMemo(() => buildDemoDataset(), []);
  const [requests, setRequests] = useState<RequestListItem[]>(dataset.list);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [streamCount, setStreamCount] = useState(0);
  const [streamedDetails, setStreamedDetails] = useState<
    Record<string, CapturedRequest>
  >({});

  // Simulate the SSE stream: new requests trickle in while you browse.
  useEffect(() => {
    const INCOMING = [
      { method: "POST", body: '{"event":"payment_intent.succeeded"}' },
      { method: "GET", body: "" },
      { method: "POST", body: '{"type":"ping","ok":true}' },
    ];
    const timers = INCOMING.map((incoming, idx) =>
      setTimeout(
        () => {
          const receivedAt = new Date().toISOString();
          const id = `req_demo_live_${idx}`;
          setRequests((prev) => [
            {
              id,
              method: incoming.method,
              path: "/",
              contentType: incoming.body ? "application/json" : null,
              ip: "13.228.69.5",
              receivedAt,
              sizeBytes: incoming.body.length + 240,
            },
            ...prev,
          ]);
          setStreamCount((c) => c + 1);
          setStreamedDetails((prev) => ({
            ...prev,
            [id]: {
              id,
              inboxId: "demo7f8d",
              method: incoming.method,
              path: "/",
              query: {},
              headers: {
                Host: "hookbox.dev",
                "Content-Type": incoming.body ? "application/json" : "text/plain",
                "User-Agent": "curl/8.7.1",
              },
              body: incoming.body,
              contentType: incoming.body ? "application/json" : null,
              ip: "13.228.69.5",
              receivedAt,
              sizeBytes: incoming.body.length + 240,
              bodyTruncated: false,
            },
          }));
        },
        2600 + idx * 5200,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const detail = selectedId
    ? (streamedDetails[selectedId] ?? dataset.details[selectedId] ?? null)
    : null;
  const replayHistory = selectedId ? (dataset.replays[selectedId] ?? []) : [];

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex shrink-0 items-center gap-2 font-mono text-[13px] font-medium tracking-[0.25em] text-[var(--accent)] uppercase transition-opacity duration-150 hover:opacity-80"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Hookbox
          </Link>
          <div className="hidden h-4 w-px bg-[var(--border)] sm:block" />
          <span className="truncate font-mono text-[15px]">
            Demo inbox
          </span>
          <span
            className="hidden rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.15em] text-[var(--muted-fg)] uppercase md:inline-block"
          >
            sandbox · nothing is real
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {streamCount > 0 && (
            <span className="animate-fade hidden font-mono text-[11px] text-[var(--accent)] sm:inline">
              +{streamCount} streamed in
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-400/20 bg-emerald-500/12 px-2 py-1 font-mono text-[11px] font-medium text-emerald-300">
            <span
              className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden
            />
            {requests.length} requests
          </span>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[#090c0a] px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[13px]">
          <span className="shrink-0 rounded bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20 ring-inset">
            POST
          </span>
          <code className="truncate text-[var(--fg)]">
            https://hookbox.dev/i/demo7f8d
          </code>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="font-mono text-[11.5px] text-[var(--muted-fg)]">
            ← pick a request to inspect it
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_1fr]">
        <div className="min-h-0 overflow-hidden border-b border-[var(--border)] lg:border-r lg:border-b-0">
          <RequestList
            requests={requests}
            selectedId={selectedId}
            onSelect={setSelectedId}
            live
          />
        </div>
        <div className="min-h-0 overflow-hidden">
          {selectedId && detail ? (
            <RequestInspector
              requestId={selectedId}
              data={{ request: detail, error: null }}
              onReplay={() => setReplaying(true)}
            />
          ) : (
            <DemoEmptyState />
          )}
        </div>
      </div>

      {replaying && selectedId && detail && (
        <ReplayDialog
          requestId={selectedId}
          initialMethod={detail.method}
          initialHeaders={detail.headers}
          initialBody={detail.body}
          history={replayHistory}
          simulate
          onClose={() => setReplaying(false)}
        />
      )}
    </div>
  );
}

function DemoEmptyState() {
  return (
    <div className="animate-fade flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-2)]">
          <span className="font-mono text-xl text-[var(--accent)]">{"{"}</span>
          <span className="font-mono text-xl text-[var(--accent)]">{"}"}</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-40"
              aria-hidden
            />
            <span
              className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[var(--accent)] opacity-80"
              aria-hidden
            />
          </span>
        </div>
        <p className="mt-4 font-mono text-sm text-[var(--fg)]">
          Pick a request on the left
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted-fg)]">
          This is the real dashboard running on sample data — headers, JSON
          bodies, cURL export and replay all work. Nothing is stored.
        </p>
      </div>
    </div>
  );
}
