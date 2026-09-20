"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, IconButton, Select, Tooltip } from "@hookbox/ui";
import type { Replay } from "@hookbox/core";
import { cn } from "@hookbox/ui";
import {
  Braces,
  CircleAlert,
  Clock,
  History,
  LoaderCircle,
  Plus,
  Rows3,
  Send,
  Trash2,
  X,
} from "lucide-react";

interface Props {
  requestId: string;
  initialMethod: string;
  initialHeaders: Record<string, string>;
  initialBody: string;
  onClose: () => void;
  /** Seed past replays (demo mode); live mode loads them from the API. */
  history?: Replay[];
  /** Simulate the send locally (demo mode) instead of calling the replay API. */
  simulate?: boolean;
}

interface Run {
  status: "sending" | "done" | "error";
  result?: Replay;
  detail?: string;
}

interface HeaderRow {
  id: number;
  key: string;
  value: string;
}

const QUICK_HEADERS: Array<[string, string]> = [
  ["Content-Type", "application/json"],
  ["Authorization", "Bearer <token>"],
  ["X-Idempotency-Key", "<uuid>"],
];

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

let rowSeq = 0;
const nextRowId = () => ++rowSeq;

function rowsFromHeaders(headers: Record<string, string>): HeaderRow[] {
  return Object.entries(headers).map(([key, value]) => ({
    id: nextRowId(),
    key,
    value,
  }));
}

export function ReplayDialog({
  requestId,
  initialMethod,
  initialHeaders,
  initialBody,
  onClose,
  history: seededHistory,
  simulate = false,
}: Props) {
  const [targetUrl, setTargetUrl] = useState("");
  const [method, setMethod] = useState(initialMethod);
  const [rows, setRows] = useState<HeaderRow[]>(() =>
    rowsFromHeaders(initialHeaders),
  );
  const [headerMode, setHeaderMode] = useState<"rows" | "json">("rows");
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initialHeaders, null, 2),
  );
  const [body, setBody] = useState(initialBody);
  const [run, setRun] = useState<Run | null>(null);
  const [history, setHistory] = useState<Replay[]>(seededHistory ?? []);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    targetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (seededHistory) return; // demo mode
    let active = true;
    fetch(`/api/requests/${requestId}/replay`)
      .then((r) => (r.ok ? (r.json() as Promise<{ replays: Replay[] }>) : null))
      .then((d) => {
        if (d && active) setHistory(d.replays);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [requestId, seededHistory]);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const toggleHeaderMode = () => {
    setHeadersError(null);
    if (headerMode === "rows") {
      setJsonText(JSON.stringify(rowsToHeaders(rows), null, 2));
      setHeaderMode("json");
    } else {
      try {
        const parsed = jsonText.trim() ? JSON.parse(jsonText) : {};
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          throw new Error("must be an object");
        }
        setRows(rowsFromHeaders(parsed as Record<string, string>));
        setHeaderMode("rows");
      } catch (e) {
        setHeadersError(
          e instanceof Error && e.message !== "Unexpected token"
            ? `Headers must be a JSON object — ${e.message}`
            : "Headers must be a valid JSON object",
        );
      }
    }
  };

  const addRow = (key = "", value = "") =>
    setRows((r) => [...r, { id: nextRowId(), key, value }]);

  const updateRow = (id: number, patch: Partial<HeaderRow>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const removeRow = (id: number) =>
    setRows((r) => r.filter((row) => row.id !== id));

  const send = async () => {
    let headers: Record<string, string> | undefined;
    if (headerMode === "rows") {
      headers = rowsToHeaders(rows);
    } else {
      try {
        headers = jsonText.trim() ? JSON.parse(jsonText) : {};
      } catch {
        setHeadersError("Headers must be valid JSON");
        return;
      }
    }
    setHeadersError(null);
    setRun({ status: "sending" });

    if (simulate) {
      await new Promise((r) => setTimeout(r, 800));
      const result: Replay = {
        id: `rpl_demo_${Date.now()}`,
        requestId,
        targetUrl,
        method,
        headers: headers ?? {},
        body,
        statusCode: 200,
        responseHeaders: { "content-type": "application/json" },
        responseBody: '{"received":true}',
        durationMs: 90 + Math.floor(Math.random() * 120),
        error: null,
        createdAt: new Date().toISOString(),
      };
      setRun({ status: "done", result });
      setHistory((h) => [result, ...h].slice(0, 20));
      return;
    }

    try {
      const res = await fetch(`/api/requests/${requestId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl, method, headers, body }),
      });
      const data = (await res.json()) as { replay?: Replay } & Replay;
      if (res.ok) {
        setRun({ status: "done", result: data.replay ?? data });
        setHistory((h) => [data.replay ?? data, ...h].slice(0, 20));
      } else {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Replay failed")
            : "Replay failed";
        setRun({ status: "error", detail });
        if ("replay" in data && data.replay) {
          setHistory((h) => [data.replay as Replay, ...h].slice(0, 20));
        }
      }
    } catch (e) {
      setRun({
        status: "error",
        detail: e instanceof Error ? e.message : "Replay failed",
      });
    }
  };

  /** Tab inserts two spaces instead of moving focus inside the body editor. */
  const handleBodyTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const next =
      value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    setBody(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  };

  const inputCls =
    "w-full rounded-md border border-[var(--border)] bg-[#0c0f0d] px-3 font-mono text-[13px] text-[var(--fg)] placeholder:text-[#5b645e] transition-colors hover:border-[#2a362f] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25";

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="replay-title"
        onKeyDown={trapFocus}
        className="animate-settle flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-2)] shadow-xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2
            id="replay-title"
            className="inline-flex items-center gap-2 font-mono text-sm font-medium text-[var(--fg)]"
          >
            <Send className="size-4 text-[var(--accent)]" strokeWidth={1.75} />
            Replay request
          </h2>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (run?.status !== "sending" && targetUrl.trim()) void send();
          }}
        >
          <label
            htmlFor="replay-target"
            className="mb-1.5 block font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase"
          >
            Target URL
          </label>
          <input
            id="replay-target"
            ref={targetRef}
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://localhost:3000/api/webhooks/stripe"
            className={inputCls}
          />

          <div className="mt-4 grid grid-cols-[130px_1fr] items-end gap-3">
            <div>
              <span
                id="replay-method-label"
                className="mb-1.5 block font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase"
              >
                Method
              </span>
              <Select
                aria-labelledby="replay-method-label"
                aria-label="Replay HTTP method"
                value={method}
                onChange={setMethod}
                options={METHODS}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between pb-1">
              <span className="font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase">
                Headers
              </span>
              <Tooltip
                label={
                  headerMode === "rows"
                    ? "Switch to raw JSON editing"
                    : "Back to row editing"
                }
              >
                <button
                  type="button"
                  onClick={toggleHeaderMode}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-mono text-[11px] text-[var(--muted-fg)] transition-colors hover:text-[var(--accent)]"
                >
                  {headerMode === "rows" ? (
                    <>
                      <Braces className="size-3" />
                      Edit as JSON
                    </>
                  ) : (
                    <>
                      <Rows3 className="size-3" />
                      Edit as rows
                    </>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>

          {headerMode === "rows" ? (
            <div className="mt-1.5 space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="group flex items-center gap-2">
                  <input
                    value={row.key}
                    onChange={(e) => updateRow(row.id, { key: e.target.value })}
                    placeholder="Header"
                    aria-label="Header name"
                    className={cn(inputCls, "h-9 w-2/5 shrink-0")}
                  />
                  <input
                    value={row.value}
                    onChange={(e) =>
                      updateRow(row.id, { value: e.target.value })
                    }
                    placeholder="Value"
                    aria-label="Header value"
                    className={cn(inputCls, "h-9 min-w-0 flex-1")}
                  />
                  <IconButton
                    label={`Remove ${row.key || "header"}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRow(row.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => addRow()}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-[var(--border)] px-2.5 py-1.5 font-mono text-[11.5px] text-[var(--muted-fg)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  <Plus className="size-3" />
                  Add header
                </button>
                {QUICK_HEADERS.map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => addRow(k, v)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white/5 px-2.5 py-1.5 font-mono text-[11.5px] text-[var(--muted-fg)] transition-colors hover:bg-white/10 hover:text-[var(--fg)]"
                  >
                    <Plus className="size-3" />
                    {k}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-1.5">
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={5}
                aria-label="Headers as JSON"
                spellCheck={false}
                className={cn(inputCls, "resize-y leading-relaxed")}
              />
            </div>
          )}
          {headersError && (
            <p className="animate-fade mt-1.5 font-mono text-[11px] text-[var(--danger)]">
              {headersError}
            </p>
          )}

          <label
            htmlFor="replay-body"
            className="mb-1.5 mt-4 block font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase"
          >
            Body
          </label>
          <textarea
            id="replay-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleBodyTab}
            rows={6}
            spellCheck={false}
            className={`${inputCls} resize-y leading-relaxed`}
          />

          {run?.status === "error" && (
            <div className="animate-fade mt-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-[12.5px] text-red-300">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {run.detail}
            </div>
          )}

          {run?.status === "done" && run.result && (
            <div className="animate-rise mt-4 rounded-md border border-[var(--border)] bg-[#090c0a] p-4">
              <div className="mb-3 flex items-center gap-3 font-mono">
                <Badge
                  tone={
                    run.result.statusCode !== null && run.result.statusCode < 400
                      ? "green"
                      : "red"
                  }
                >
                  {run.result.statusCode ?? "—"}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[12px] text-[var(--muted-fg)]">
                  <Clock className="size-3" />
                  {run.result.durationMs} ms
                </span>
                <span className="truncate text-[12px] text-[var(--fg)]">
                  {run.result.targetUrl}
                </span>
              </div>
              {Object.keys(run.result.responseHeaders).length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase">
                    Response headers
                  </p>
                  <pre className="max-h-32 overflow-auto rounded border border-[var(--border)] bg-[#0c0f0d] p-3 font-mono text-[12px] text-[var(--fg)]">
                    {Object.entries(run.result.responseHeaders)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n")}
                  </pre>
                </div>
              )}
              <p className="mb-1 font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase">
                Response body
              </p>
              <pre className="max-h-64 overflow-auto rounded border border-[var(--border)] bg-[#0c0f0d] p-3 font-mono text-[12px] text-[var(--fg)]">
                {run.result.responseBody || "(empty)"}
              </pre>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-[var(--muted-fg)] uppercase">
                <History className="size-3" aria-hidden />
                Past replays
              </p>
              <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 rounded border border-[var(--border)] bg-[#090c0a] px-3 py-2 font-mono text-[12px] transition-colors hover:border-[#2c3a32]"
                  >
                    <Badge tone={h.statusCode ? "green" : "red"}>
                      {h.statusCode ?? "—"}
                    </Badge>
                    <span className="truncate text-[var(--fg)]">
                      {h.targetUrl}
                    </span>
                    <span className="ml-auto shrink-0 text-[var(--muted-fg)]">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[#090c0a] px-5 py-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={send}
            disabled={run?.status === "sending" || !targetUrl.trim()}
          >
            {run?.status === "sending" ? (
              <>
                <LoaderCircle className="animate-spin size-4" />
                Sending…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function rowsToHeaders(rows: HeaderRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    out[key] = row.value;
  }
  return out;
}
