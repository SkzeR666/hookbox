"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Copy,
  Inbox as InboxIcon,
  LoaderCircle,
  Pencil,
  RadioTower,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Button, IconButton } from "@hookbox/ui";
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
  createdAt,
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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
    const trimmed = newName.trim();
    if (!trimmed || trimmed === name) {
      setRenaming(false);
      setNewName(name);
      return;
    }
    const res = await fetch(`/api/inboxes/${publicId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-hookbox-token": token,
      },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) setRenaming(false);
  };

  const destroy = async () => {
    setDeleting(true);
    const res = await fetch(`/api/inboxes/${publicId}`, {
      method: "DELETE",
      headers: { "x-hookbox-token": token },
    });
    if (res.ok) router.push("/");
    else {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const cancelRename = () => {
    setRenaming(false);
    setNewName(name);
  };

  const expiresLabel = expiresAt
    ? `expires ${new Date(expiresAt).toLocaleString()}`
    : "never expires";

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
          {renaming ? (
            <div className="animate-fade flex items-center gap-1.5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void rename();
                  if (e.key === "Escape") cancelRename();
                }}
                aria-label="Inbox name"
                className="h-8 w-44 rounded-md border border-[var(--border)] bg-[#0c0f0d] px-2 font-mono text-sm transition-colors focus:border-[var(--accent)]/50 focus:outline-none sm:w-56"
                autoFocus
              />
              <IconButton
                label="Save name"
                size="sm"
                onClick={() => void rename()}
              >
                <Check />
              </IconButton>
              <IconButton label="Cancel" size="sm" onClick={cancelRename}>
                <X />
              </IconButton>
            </div>
          ) : (
            <button
              onClick={() => setRenaming(true)}
              aria-label={`Rename inbox ${name}`}
              className="group inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-sm"
            >
              <span className="truncate font-mono text-[15px] transition-colors duration-150 group-hover:text-[var(--accent)]">
                {name}
              </span>
              <Pencil
                className="size-3 shrink-0 text-[var(--muted-fg)] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden
              />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-400/20 bg-emerald-500/12 px-2 py-1 font-mono text-[11px] font-medium text-emerald-300">
            <span
              className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden
            />
            {count} request{count === 1 ? "" : "s"}
          </span>
          <span
            className="hidden font-mono text-[12px] text-[var(--muted-fg)] lg:inline-flex lg:items-center lg:gap-1.5"
            title={new Date(createdAt).toLocaleString()}
          >
            <BadgeCheck className="size-3" aria-hidden />
            created {relativeTime(createdAt)} · {expiresLabel}
          </span>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[#090c0a] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[13px]">
          <Badge tone="green" className="shrink-0 font-semibold">
            POST
          </Badge>
          <code className="truncate text-[var(--fg)]">{url}</code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="secondary" onClick={copyUrl}>
            {copied ? (
              <>
                <Check className="size-3.5 text-[var(--accent)]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy URL
              </>
            )}
          </Button>

          {confirmingDelete ? (
            <div className="animate-fade flex items-center gap-1.5">
              <span className="font-mono text-[12px] text-red-300">
                Delete inbox?
              </span>
              <Button
                size="sm"
                variant="danger"
                onClick={destroy}
                disabled={deleting}
              >
                {deleting ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Confirm
              </Button>
              <IconButton
                label="Cancel delete"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                <X />
              </IconButton>
            </div>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[400px_1fr]">
        <div className="min-h-0 overflow-hidden border-b border-[var(--border)] lg:border-r lg:border-b-0">
          <RequestList
            requests={requests}
            selectedId={selectedId}
            onSelect={setSelectedId}
            live
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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function EmptyState() {
  return (
    <div className="animate-fade flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-2)]">
          <InboxIcon
            className="size-6 text-[var(--muted-fg)]"
            strokeWidth={1.5}
            aria-hidden
          />
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
          Waiting for requests…
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted-fg)]">
          Send anything to your inbox URL. It shows up here in real time.
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted-fg)]">
          <RadioTower className="size-3" aria-hidden />
          streaming live via SSE
        </p>
      </div>
    </div>
  );
}
