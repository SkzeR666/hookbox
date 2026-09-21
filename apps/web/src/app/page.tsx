import Link from "next/link";
import { GitFork, MousePointerClick, Radio, ShieldCheck } from "lucide-react";
import CreateInboxButton from "./create-inbox-button";

const REPO_URL = "https://github.com/SkzeR666/hookbox";

const linkCls =
  "inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/50";

const secondaryBtnCls =
  "inline-flex h-12 max-w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[#111512] px-6 text-[15px] font-medium whitespace-nowrap text-[var(--fg)] transition-[background-color,border-color,color,transform] duration-150 ease-out select-none hover:border-[#33413a] hover:bg-[#161b17] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const FEATURES = [
  {
    icon: Radio,
    title: "Realtime capture",
    desc: "Requests stream in over SSE the instant they hit your inbox. No refresh, no polling.",
  },
  {
    icon: MousePointerClick,
    title: "Replay anywhere",
    desc: "Edit method, headers and body, then send to any endpoint — full response side by side.",
  },
  {
    icon: ShieldCheck,
    title: "SSRF-guarded",
    desc: "Private ranges and metadata endpoints are blocked by default. Replay is safe to expose.",
  },
] as const;

/** Mini window chrome — identical on every tile so the grid reads as one system. */
function TileChrome({ label }: { label: string }) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[#090c0a] px-4">
      <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
      <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
      <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
      <span className="ml-1.5 font-mono text-[11px] text-[#5a6a60]">{label}</span>
    </div>
  );
}

/** Shared panel header height (h-12) + paddings so aside and main headers align. */
const tileCls =
  "flex min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a0e0c]";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
      {/* ── hero — tight, single idea per line ── */}
      <header className="animate-rise flex flex-col items-start pt-6 sm:pt-12">
        <h1 className="max-w-2xl text-4xl leading-[1.08] font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Debug webhooks without the headache.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-pretty text-[var(--muted-fg)] sm:text-[15px]">
          No account, no SDK, no keys — catch requests, inspect every detail,
          replay when ready.
        </p>
        <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <CreateInboxButton />
          <Link href="/demo" className={secondaryBtnCls}>
            <MousePointerClick className="size-4 text-[var(--accent)]" />
            Try the live demo
          </Link>
        </div>
      </header>

      {/* ── bento — the real dashboard, rebuilt as an aligned grid ── */}
      <section
        className="animate-rise mt-10 grid w-full grid-cols-1 gap-4 [animation-delay:120ms] sm:mt-14 lg:grid-cols-6"
        aria-label="Product preview"
      >
        {/* requests aside */}
        <div className={`${tileCls} lg:col-span-2`}>
          <TileChrome label="hookbox — requests" />
          <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-4">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#5a6a60] uppercase">
              requests
            </span>
            <span className="font-mono text-[11px] text-[#5a6a60]">9</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] text-[var(--accent)]">
              <span
                className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
              live
            </span>
          </div>
          <ul className="flex min-h-0 flex-1 flex-col font-mono text-[12px]">
            {[
              ["POST", "text-emerald-300", "/", true, "21:15:20"],
              ["GET", "text-sky-300", "/", false, "21:15:15"],
              ["POST", "text-emerald-300", "/", false, "21:15:10"],
              ["PUT", "text-yellow-300", "/", false, "20:31:28"],
              ["PATCH", "text-purple-300", "/", false, "19:55:28"],
            ].map(([method, tone, path, selected, time], i) => (
              <li key={i} className="flex min-h-11 flex-1 items-center">
                <div
                  className={`flex h-full w-full min-w-0 items-center gap-2.5 border-b border-[var(--border)] px-4 last:border-b-0 ${
                    selected
                      ? "bg-[#131a15] shadow-[inset_2px_0_0_0_var(--accent)]"
                      : ""
                  }`}
                >
                  <span className={`w-12 shrink-0 font-semibold ${tone}`}>
                    {method}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[#c9d4cd]">
                    {path}
                  </span>
                  <span className="shrink-0 text-[#5a6a60]">{time}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex min-h-14 shrink-0 items-center gap-2 border-t border-[var(--border)] px-4 font-mono text-[11px] text-[#5a6a60]">
            <span className="truncate">9 requests</span>
            <span aria-hidden>·</span>
            <span className="truncate">live via SSE</span>
            <span className="ml-auto shrink-0 truncate">hookbox.dev/i/…</span>
          </div>
        </div>

        {/* inspector main */}
        <div className={`${tileCls} lg:col-span-4`}>
          <TileChrome label="hookbox — inspector" />
          <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
            <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[10.5px] leading-none font-semibold text-emerald-300 ring-1 ring-emerald-400/20 ring-inset">
              POST
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[var(--fg)]">
              https://hookbox.dev/i/ab12cd34
            </code>
            <span className="hidden font-mono text-[11.5px] text-[#5a6a60] sm:inline">
              Headers
            </span>
            <span className="hidden font-mono text-[11.5px] text-[#5a6a60] sm:inline">
              Query
            </span>
            <span className="inline-flex items-center border-b-2 border-[var(--accent)] font-mono text-[11.5px] text-[var(--accent)]">
              <span className="py-3">Body</span>
            </span>
            <span className="hidden font-mono text-[11.5px] text-[#5a6a60] sm:inline">
              Raw
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-5">
            <div className="h-full overflow-hidden rounded-lg border border-[var(--border)] bg-[#0a0e0c]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                <span className="font-mono text-[10px] tracking-[0.15em] text-[#5a6a60] uppercase">
                  request body
                </span>
                <span className="font-mono text-[10.5px] text-[#5a6a60]">copy</span>
              </div>
              <pre className="overflow-hidden p-4 font-mono text-[11.5px] leading-[1.7]">
                <span className="text-[#5a6a60]">{"{"}</span>
                {"\n  "}
                <span className="text-[#8fd4b6]">{'"id":'}</span>{" "}
                <span className="text-[#7dd3a5]">{'"evt_3PqKLc2eZvKY"'}</span>,
                {"\n  "}
                <span className="text-[#8fd4b6]">{'"type":'}</span>{" "}
                <span className="text-[#7dd3a5]">
                  {'"checkout.session.completed"'}
                </span>
                ,
                {"\n  "}
                <span className="text-[#8fd4b6]">{'"amount_total":'}</span>{" "}
                <span className="text-[#e0b48c]">4990</span>
                {",\n  "}
                <span className="text-[#8fd4b6]">{'"currency":'}</span>{" "}
                <span className="text-[#7dd3a5]">{'"usd"'}</span>
                {"\n"}
                <span className="text-[#5a6a60]">{"}"}</span>
              </pre>
            </div>
          </div>
          <div className="flex min-h-14 shrink-0 items-center gap-2 border-t border-[var(--border)] px-4 font-mono text-[11px] text-[#5a6a60]">
            <span className="truncate">from 54.187.216.72</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">445 B</span>
            <span aria-hidden>·</span>
            <span className="truncate">received 20/09/2026, 21:15:07</span>
          </div>
        </div>

        {/* feature tiles — one row, shared h-lines with the preview above */}
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className={`${tileCls} p-5 lg:col-span-2`}>
            <div className="flex items-start justify-between">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-2)]">
                <Icon
                  className="size-4.5 text-[var(--accent)]"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <span className="font-mono text-[11px] text-[#5a6a60]">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-[var(--fg)]">
              {title}
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted-fg)]">
              {desc}
            </p>
          </div>
        ))}
      </section>

      <footer className="animate-fade mt-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-16 text-xs text-[var(--muted-fg)] [animation-delay:200ms]">
        <a href={REPO_URL} target="_blank" rel="noreferrer" className={linkCls}>
          <GitFork className="size-3" strokeWidth={1.75} />
          Open source
        </a>
        <span aria-hidden className="text-[var(--border)]">
          ·
        </span>
        <a
          href={`${REPO_URL}#readme`}
          target="_blank"
          rel="noreferrer"
          className={linkCls}
        >
          Self-hostable
        </a>
        <span aria-hidden className="text-[var(--border)]">
          ·
        </span>
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
          rel="noreferrer"
          className={linkCls}
        >
          AGPL-3.0
        </a>
      </footer>
    </main>
  );
}
