"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@hookbox/ui";

interface DashboardShellProps {
  /** Full inbox endpoint shown in the URL bar. */
  url: string;
  /** HTTP method chip in the URL bar. */
  method?: string;
  requestCount: number;
  /** Inbox name area, right after the Hookbox back link. */
  title: React.ReactNode;
  /** Rendered before the request-count pill (meta, counters). */
  headerRight?: React.ReactNode;
  /** Buttons at the right end of the URL bar (copy, delete). */
  urlActions?: React.ReactNode;
  /** Muted hint text inside the URL bar. */
  urlHint?: React.ReactNode;
  /** Left column — a <RequestList />. */
  list: React.ReactNode;
  /** Right column — inspector or empty state. */
  children: React.ReactNode;
}

export function DashboardShell({
  url,
  method = "POST",
  requestCount,
  title,
  headerRight,
  urlActions,
  urlHint,
  list,
  children,
}: DashboardShellProps) {
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
          {title}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {headerRight}
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-400/20 bg-emerald-500/12 px-2 py-1 font-mono text-[11px] font-medium text-emerald-300">
            <span
              className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden
            />
            {requestCount} request{requestCount === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[#090c0a] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[13px]">
          <Badge tone="green" className="shrink-0 font-semibold">
            {method}
          </Badge>
          <code className="truncate text-[var(--fg)]">{url}</code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {urlHint}
          {urlActions}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[400px_1fr]">
        <div className="min-h-0 overflow-hidden border-b border-[var(--border)] lg:border-r lg:border-b-0">
          {list}
        </div>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

interface DashboardEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Optional footer line (e.g. "streaming live via SSE"). */
  note?: React.ReactNode;
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  note,
}: DashboardEmptyStateProps) {
  return (
    <div className="animate-fade flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-2)]">
          {icon}
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
        <p className="mt-4 font-mono text-sm text-[var(--fg)]">{title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted-fg)]">
          {description}
        </p>
        {note && (
          <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted-fg)]">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
