"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@hookbox/ui";
import type { RequestListItem } from "@hookbox/core";
import { RequestList } from "@/components/request-list";
import { RequestInspector } from "@/components/request-inspector";

interface Props {
  publicId: string;
  name: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  initialRequestCount: number;
}

export default function InboxDashboard({
  publicId,
  name,
  token,
  expiresAt,
  initialRequestCount,
}: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const [count, setCount] = useState(initialRequestCount);
  const [deleting, setDeleting] = useState(false);
  const [origin, setOrigin] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/i/${publicId}`;

  const loadList = useCallback(async () => {
    try {
      const res = await fetch(`/api/inboxes/${publicId}/requests`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        requests: RequestListItem[];
        count: number;
      };
      setRequests((prev) => mergeRequests(prev, data.requests));
      for (const r of data.requests) seenRef.current.add(r.id);
      setCount((prev) => Math.max(prev, data.count));
    } catch {
      // keep current
    }
  }, [publicId]);

  useEffect(() => {
    void loadList();
    const es = new EventSource(`/api/inboxes/${publicId}/events`);
    esRef.current = es;

    es.addEventListener("request", (ev: MessageEvent) => {
      const item = JSON.parse(ev.data) as RequestListItem;
      if (!seenRef.current.has(item.id)) {
        seenRef.current.add(item.id);
        setRequests((prev) => [item, ...prev].slice(0, 200));
        setCount((c) => c + 1);
      }
    });

    es.addEventListener("inbox_deleted", () => {
      es.close();
      router.push("/");
    });

    es.onerror = () => {
      // EventSource auto-reconnects; also poll to fill gaps
    };

    return () => es.close();
  }, [publicId, loadList, router]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const rename = async () => {
    const res = await fetch(`/api/inboxes/${publicId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-hookbox-token": token,
      },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) setRenaming(false);
  };

  const destroy = async () => {
    if (!confirm("Delete this inbox and all its requests?")) return;
    setDeleting(true);
    const res = await fetch(`/api/inboxes/${publicId}`, {
      method: "DELETE",
      headers: { "x-hookbox-token": token },
    });
    if (res.ok) router.push("/");
    else setDeleting(false);
  };

  const expiresLabel = expiresAt
    ? `expires ${new Date(expiresAt).toLocaleString()}`
    : "never";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="font-mono text-[13px] font-medium uppercase tracking-[0.25em] text-[var(--accent)]"
          >
            Hookbox
          </Link>
          <div className="hidden h-4 w-px bg-[var(--border)] sm:block" />
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rename()}
                className="h-8 w-56 rounded-md border border-[var(--border)] bg-[#0c0f0d] px-2 font-mono text-sm"
                autoFocus
              />
              <Button size="sm" onClick={rename}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setRenaming(true)}
              className="truncate font-mono text-[15px] text-[var(--fg)] hover:text-[var(--accent)]"
              title="Rename"
            >
              {name}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Badge tone="green">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {count} request{count === 1 ? "" : "s"}
          </Badge>
          <span className="hidden font-mono text-[12px] text-[var(--muted-fg)] md:inline">
            {expiresLabel}
          </span>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[#090c0a] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[13px]">
          <span className="text-[var(--muted-fg)]">POST</span>
          <code className="truncate text-[var(--fg)]">{url}</code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="secondary" onClick={copyUrl}>
            {copied ? "Copied" : "Copy URL"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={destroy}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_1fr]">
        <div className="min-h-0 overflow-hidden border-r border-[var(--border)]">
          <RequestList
            requests={requests}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="min-h-0 overflow-hidden">
          {selectedId ? (
            <RequestInspector requestId={selectedId} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function mergeRequests(
  prev: RequestListItem[],
  incoming: RequestListItem[],
): RequestListItem[] {
  const byId = new Map<string, RequestListItem>();
  for (const r of prev) byId.set(r.id, r);
  for (const r of incoming) byId.set(r.id, r);
  return [...byId.values()]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, 200);
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-[var(--muted-fg)]">
          Waiting for requests…
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-fg)]">
          Send anything to your inbox URL. It shows up here in real time.
        </p>
      </div>
    </div>
  );
}