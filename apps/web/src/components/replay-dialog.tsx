"use client";

import { useEffect, useState } from "react";
import { Badge, Button } from "@hookbox/ui";
import type { Replay } from "@hookbox/core";

interface Props {
  requestId: string;
  initialMethod: string;
  initialHeaders: Record<string, string>;
  initialBody: string;
  onClose: () => void;
}

interface Run {
  status: "sending" | "done" | "error";
  result?: Replay;
  detail?: string;
}

export function ReplayDialog({
  requestId,
  initialMethod,
  initialHeaders,
  initialBody,
  onClose,
}: Props) {
  const [targetUrl, setTargetUrl] = useState("");
  const [method, setMethod] = useState(initialMethod);
  const [headers, setHeaders] = useState(JSON.stringify(initialHeaders, null, 2));
  const [body, setBody] = useState(initialBody);
  const [run, setRun] = useState<Run | null>(null);
  const [history, setHistory] = useState<Replay[]>([]);
  const [headersError, setHeadersError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [requestId]);

  const send = async () => {
    let parsedHeaders: Record<string, string> | undefined;
    try {
      parsedHeaders = headers.trim() ? JSON.parse(headers) : {};
    } catch {
      setHeadersError("Headers must be valid JSON");
      return;
    }
    setHeadersError(null);
    setRun({ status: "sending" });

    try {
      const res = await fetch(`/api/requests/${requestId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl, method, headers: parsedHeaders, body }),
      });
      const data = (await res.json()) as { replay?: Replay } & Replay;
      if (res.ok) {
        setRun({ status: "done", result: data.replay ?? data });
        setHistory((h) => [data.replay ?? data, ...h].slice(0, 20));
      } else {
        const detail = data && typeof data === "object" && "detail" in data
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-2)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="font-mono text-sm font-medium text-[var(--fg)]">
            Replay request
          </h2>
          <button
            onClick={onClose}
            className="font-mono text-[var(--muted-fg)] hover:text-[var(--fg)]"
          >
            esc
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
            Target URL
          </label>
          <input
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://localhost:3000/api/webhooks/stripe"
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0c0f0d] px-3 font-mono text-[13px] text-[var(--fg)] placeholder:text-[#5b645e]"
          />

          <div className="mt-4 grid grid-cols-[140px_1fr] gap-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0c0f0d] px-2 font-mono text-[13px] text-[var(--fg)]"
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].map(
                  (m) => (
                    <option key={m}>{m}</option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
                Headers (JSON)
              </label>
              <input
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className={[
                  "h-10 w-full rounded-md border border-[var(--border)] bg-[#0c0f0d] px-3 font-mono text-[12px] text-[var(--fg)]",
                ].join(" ")}
              />
              {headersError && (
                <p className="mt-1 font-mono text-[11px] text-[var(--danger)]">
                  {headersError}
                </p>
              )}
            </div>
          </div>

          <label className="mb-1 mt-4 block font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border border-[var(--border)] bg-[#0c0f0d] p-3 font-mono text-[12.5px] leading-relaxed text-[var(--fg)]"
          />

          {run?.status === "error" && (
            <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-[12.5px] text-red-300">
              {run.detail}
            </div>
          )}

          {run?.status === "done" && run.result && (
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[#090c0a] p-4">
              <div className="mb-3 flex items-center gap-3 font-mono">
                <Badge tone="green">{run.result.statusCode}</Badge>
                <span className="text-[12px] text-[var(--muted-fg)]">
                  {run.result.durationMs} ms
                </span>
                <span className="truncate text-[12px] text-[var(--fg)]">
                  {run.result.targetUrl}
                </span>
              </div>
              {Object.keys(run.result.responseHeaders).length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
                    Response headers
                  </p>
                  <pre className="max-h-32 overflow-auto rounded border border-[var(--border)] bg-[#0c0f0d] p-3 font-mono text-[12px] text-[var(--fg)]">
                    {Object.entries(run.result.responseHeaders)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n")}
                  </pre>
                </div>
              )}
              <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
                Response body
              </p>
              <pre className="max-h-64 overflow-auto rounded border border-[var(--border)] bg-[#0c0f0d] p-3 font-mono text-[12px] text-[var(--fg)]">
                {run.result.responseBody || "(empty)"}
              </pre>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-[var(--muted-fg)]">
                Past replays
              </p>
              <ul className="space-y-1.5">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 rounded border border-[var(--border)] bg-[#090c0a] px-3 py-2 font-mono text-[12px]"
                  >
                    <Badge tone={h.statusCode ? "green" : "red"}>{h.statusCode ?? "—"}</Badge>
                    <span className="truncate text-[var(--fg)]">{h.targetUrl}</span>
                    <span className="ml-auto shrink-0 text-[var(--muted-fg)]">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={send} disabled={run?.status === "sending"}>
            {run?.status === "sending" ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}