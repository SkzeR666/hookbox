"use client";

import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@hookbox/ui";
import type { MockResponse } from "@hookbox/core";
import { cn } from "@hookbox/ui";
import { FlaskConical, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { TileLabel } from "./bento";

interface Props {
  inboxId: string;
  token: string;
  onClose: () => void;
}

interface HeaderRow {
  id: number;
  key: string;
  value: string;
}

const STATUSES = [
  200, 201, 202, 204, 301, 302, 304, 400, 401, 403, 404, 409, 410, 418, 422,
  429, 500, 502, 503, 504,
];

const CONTENT_TYPES = [
  "application/json",
  "text/plain",
  "text/html",
  "application/xml",
  "application/x-www-form-urlencoded",
];

let rowSeq = 0;
const nextRowId = () => ++rowSeq;

const CONTROL_CLS =
  "h-9 w-full rounded-md border border-[var(--border)] bg-[#0c0f0d] px-3 font-mono text-[13px] text-[var(--fg)] placeholder:text-[#5b645e] transition-colors hover:border-[#2a362f] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25";

/** h-9 select sharing the same control line as inputs. */
const selectCls = cn(CONTROL_CLS, "cursor-pointer appearance-none pr-8");

function ChevronDown() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-fg)]"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MockDialog({ inboxId, token, onClose }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState(200);
  const [contentType, setContentType] = useState("application/json");
  const [delayMs, setDelayMs] = useState(0);
  const [body, setBody] = useState("");
  const [rows, setRows] = useState<HeaderRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/inboxes/${inboxId}/mock`)
      .then((r) => (r.ok ? (r.json() as Promise<MockResponse>) : null))
      .then((d) => {
        if (d) {
          setEnabled(d.enabled);
          setStatus(d.status);
          setContentType(d.contentType);
          setDelayMs(d.delayMs);
          setBody(d.body);
          setRows(
            Object.entries(d.headers ?? {}).map(([key, value]) => ({
              id: nextRowId(),
              key,
              value,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [inboxId]);

  useEffect(() => {
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

  const updateRow = (id: number, patch: Partial<HeaderRow>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const removeRow = (id: number) =>
    setRows((r) => r.filter((row) => row.id !== id));

  const save = async () => {
    setSaving(true);
    const headers: Record<string, string> = {};
    for (const row of rows) {
      const key = row.key.trim();
      if (key) headers[key] = row.value;
    }
    try {
      const res = await fetch(`/api/inboxes/${inboxId}/mock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-hookbox-token": token },
        body: JSON.stringify({
          enabled,
          status,
          headers,
          body,
          contentType,
          delayMs,
        }),
      });
      if (res.ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  const disable = async () => {
    setSaving(true);
    try {
      await fetch(`/api/inboxes/${inboxId}/mock`, {
        method: "DELETE",
        headers: { "x-hookbox-token": token },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-title"
        className="animate-settle flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a0e0c] shadow-xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <h2
            id="mock-title"
            className="inline-flex items-center gap-2 font-mono text-sm font-medium text-[var(--fg)]"
          >
            <FlaskConical
              className="size-4 text-[var(--accent)]"
              strokeWidth={1.75}
            />
            Mock response
          </h2>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        {!loaded ? (
          <div className="flex min-h-40 items-center justify-center font-mono text-[13px] text-[var(--muted-fg)]">
            loading…
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5">
              {/* enable toggle — same line style as the dashboard headers */}
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((v) => !v)}
                className="group flex w-full cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] bg-[#0c0f0d] px-4 py-3 text-left transition-colors hover:border-[#2a362f]"
              >
                <span>
                  <TileLabel className="text-[var(--fg)]">Enabled</TileLabel>
                  <span className="mt-0.5 block text-[12.5px] text-[var(--muted-fg)]">
                    Inbox replies with this preset instead of the default ok
                  </span>
                </span>
                <span
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150",
                    enabled ? "bg-[var(--accent)]" : "bg-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "absolute h-3.5 w-3.5 rounded-full bg-[#02120c] transition-transform duration-150",
                      enabled ? "translate-x-[18px]" : "translate-x-[3px]",
                    )}
                    style={{ backgroundColor: enabled ? "#02120c" : "#5b645e" }}
                  />
                </span>
              </button>

              {/* status / content-type / delay — one aligned control line */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <label className="block">
                  <TileLabel className="mb-1.5">Status</TileLabel>
                  <span className="relative block">
                    <select
                      value={status}
                      onChange={(e) => setStatus(Number(e.target.value))}
                      className={selectCls}
                      aria-label="Mock status code"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown />
                  </span>
                </label>
                <label className="block">
                  <TileLabel className="mb-1.5">Content-Type</TileLabel>
                  <span className="relative block">
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className={selectCls}
                      aria-label="Mock content type"
                    >
                      {CONTENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown />
                  </span>
                </label>
                <label className="block">
                  <TileLabel className="mb-1.5">Delay (ms)</TileLabel>
                  <input
                    type="number"
                    min={0}
                    max={30000}
                    step={100}
                    value={delayMs}
                    onChange={(e) =>
                      setDelayMs(Math.max(0, Number(e.target.value) || 0))
                    }
                    className={CONTROL_CLS}
                    aria-label="Mock delay in milliseconds"
                  />
                </label>
              </div>

              {/* headers */}
              <div className="mt-4 flex items-center justify-between">
                <TileLabel>Headers</TileLabel>
                <button
                  type="button"
                  onClick={() => setRows((r) => [...r, { id: nextRowId(), key: "", value: "" }])}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-[var(--border)] px-2.5 py-1.5 font-mono text-[11.5px] text-[var(--muted-fg)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  <Plus className="size-3" />
                  Add header
                </button>
              </div>
              {rows.length === 0 ? (
                <p className="mt-1.5 font-mono text-[11.5px] text-[#5b645e]">
                  No extra headers.
                </p>
              ) : (
                <div className="mt-1.5 space-y-1.5">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="group flex min-w-0 items-center gap-2"
                    >
                      <input
                        value={row.key}
                        onChange={(e) => updateRow(row.id, { key: e.target.value })}
                        placeholder="Header"
                        aria-label="Header name"
                        className={cn(CONTROL_CLS, "w-2/5 min-w-0 shrink-0")}
                      />
                      <input
                        value={row.value}
                        onChange={(e) =>
                          updateRow(row.id, { value: e.target.value })
                        }
                        placeholder="Value"
                        aria-label="Header value"
                        className={cn(CONTROL_CLS, "min-w-0 flex-1")}
                      />
                      <IconButton
                        label={`Remove ${row.key || "header"}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRow(row.id)}
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100 [&_svg]:size-3.5"
                      >
                        <Trash2 />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}

              {/* body */}
              <TileLabel className="mt-4 mb-1.5">Body</TileLabel>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                spellCheck={false}
                placeholder={'{"ok":true}'}
                className={cn(CONTROL_CLS, "h-auto resize-y py-2 leading-relaxed")}
              />
            </div>

            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-t border-[var(--border)] bg-[#090c0a] px-4">
              <Button
                variant="ghost"
                type="button"
                size="sm"
                onClick={disable}
                disabled={saving}
              >
                Reset to default
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" type="button" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={save} disabled={saving}>
                  {saving ? (
                    <>
                      <LoaderCircle className="animate-spin size-3.5" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <FlaskConical className="size-3.5" />
                      Save mock
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
