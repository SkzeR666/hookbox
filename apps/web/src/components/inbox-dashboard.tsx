"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
import { Button, IconButton, Tooltip } from "@hookbox/ui";
import type { RequestListItem } from "@hookbox/core";
import { RequestList } from "@/components/request-list";
import { RequestInspector } from "@/components/request-inspector";
import { DashboardShell, DashboardEmptyState } from "@/components/dashboard-shell";

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
    <DashboardShell
      url={url}
      requestCount={count}
      title={
        renaming ? (
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
        )
      }
      headerRight={
        <Tooltip
          label={new Date(createdAt).toLocaleString()}
          className="hidden lg:inline-flex"
        >
          <span
            suppressHydrationWarning
            className="inline-flex cursor-default items-center gap-1.5 font-mono text-[12px] text-[var(--muted-fg)]"
          >
            <BadgeCheck className="size-3" aria-hidden />
            created {relativeTime(createdAt)} · {expiresLabel}
          </span>
        </Tooltip>
      }
      urlActions={
        <>
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
        </>
      }
      list={
        <RequestList
          requests={requests}
          selectedId={selectedId}
          onSelect={setSelectedId}
          live
        />
      }
    >
      {selectedId ? (
        <RequestInspector requestId={selectedId} />
      ) : (
        <DashboardEmptyState
          icon={
            <InboxIcon
              className="size-6 text-[var(--muted-fg)]"
              strokeWidth={1.5}
              aria-hidden
            />
          }
          title="Waiting for requests…"
          description="Send anything to your inbox URL. It shows up here in real time."
          note={
            <>
              <RadioTower className="size-3" aria-hidden />
              streaming live via SSE
            </>
          }
        />
      )}
    </DashboardShell>
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
