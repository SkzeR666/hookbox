import Link from "next/link";
import {
  GitFork,
  MousePointerClick,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";
import CreateInboxButton from "./create-inbox-button";

const REPO_URL = "https://github.com/SkzeR666/hookbox";

const linkCls =
  "inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/50";

const secondaryBtnCls =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[#111512] px-6 text-[15px] font-medium whitespace-nowrap text-[var(--fg)] transition-[background-color,border-color,color,transform] duration-150 ease-out select-none hover:border-[#33413a] hover:bg-[#161b17] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const FEATURES = [
  {
    icon: Radio,
    title: "Realtime capture",
    desc: "Requests stream in over SSE the instant they hit your inbox URL. No refresh, no polling.",
  },
  {
    icon: MousePointerClick,
    title: "Replay anywhere",
    desc: "Edit method, headers and body, then send the request to any endpoint. Full response, side by side.",
  },
  {
    icon: ShieldCheck,
    title: "SSRF-guarded",
    desc: "Private ranges and metadata endpoints are blocked by default. Replay is safe to expose.",
  },
  {
    icon: Zap,
    title: "Zero setup",
    desc: "No account, no SDK, no keys. Create an inbox, point your webhook at it, debug.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-12 sm:px-10 lg:px-14 sm:py-20">
      <header className="animate-rise flex flex-col items-center pt-8 text-center sm:pt-14">
        <h1 className="max-w-4xl text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-6xl lg:text-[4.25rem]">
          Debug webhooks without the headache.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-balance text-[var(--muted-fg)] sm:text-lg">
          Catch HTTP requests, inspect every detail, replay when ready.
        </p>
        <div className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <CreateInboxButton />
          <Link href="/demo" className={secondaryBtnCls}>
            <MousePointerClick className="size-4 text-[var(--accent)]" />
            Try the live demo
          </Link>
        </div>
      </header>

      {/* Preview cards — the actual dashboard UI, shown in action */}
      <section
        className="animate-rise mt-16 grid w-full grid-cols-1 gap-6 sm:mt-24 lg:grid-cols-2 lg:gap-7"
        aria-label="Product preview"
      >
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a0e0c]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
            <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
            <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
            <span className="ml-2 font-mono text-[11px] text-[#5a6a60]">
              hookbox — requests
            </span>
          </div>
          <div className="flex h-9 items-center gap-2.5 border-b border-[var(--border)] px-4">
            <span className="font-mono text-[10.5px] tracking-[0.14em] text-[#5a6a60] uppercase">
              requests
            </span>
            <span className="font-mono text-[10.5px] text-[#5a6a60]">9</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] text-[var(--accent)]">
              <span
                className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
              live
            </span>
          </div>
          <ul className="font-mono text-[12px]">
            {[
              ["POST", "text-emerald-300", "/"],
              ["POST", "text-emerald-300", "/"],
              ["GET", "text-sky-300", "/"],
            ].map(([method, tone, path], i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0"
              >
                <span className={`w-12 shrink-0 font-semibold ${tone}`}>
                  {method}
                </span>
                <span className="min-w-0 flex-1 truncate text-[#c9d4cd]">
                  {path}
                </span>
                <span className="shrink-0 text-[#5a6a60]">2:{10 - i}:41</span>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3">
            <div className="rounded-md border border-[var(--border)] bg-[#0d120e] p-3">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px]">
                <span className="tracking-[0.15em] text-[#5a6a60] uppercase">
                  body
                </span>
              </div>
              <pre className="overflow-hidden font-mono text-[11px] leading-[1.7]">
                <span className="text-[#5a6a60]">{"{"}</span>
                {"\n  "}
                <span className="text-[#8fd4b6]">{'"type":'}</span>{" "}
                <span className="text-[#7dd3a5]">
                  {'"checkout.session.completed"'}
                </span>
                ,{"\n  "}
                <span className="text-[#8fd4b6]">{'"amount_total":'}</span>{" "}
                <span className="text-[#e0b48c]">4990</span>
                {"\n"}
                <span className="text-[#5a6a60]">{"}"}</span>
              </pre>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a0e0c]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
            <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
            <span className="h-2 w-2 rounded-full bg-[#2c362f]" />
            <span className="ml-2 font-mono text-[11px] text-[#5a6a60]">
              hookbox — replay
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div>
              <p className="mb-1.5 font-mono text-[10.5px] tracking-[0.15em] text-[#5a6a60] uppercase">
                target url
              </p>
              <div className="truncate rounded-md border border-[var(--border)] bg-[#0d120e] px-3 py-2.5 font-mono text-[12px] text-[#c9d4cd]">
                https://localhost:3000/api/webhooks/stripe
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10.5px] tracking-[0.15em] text-[#5a6a60] uppercase">
                headers
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-[12px]">
                  <span className="w-2/5 shrink-0 rounded-md border border-[var(--border)] bg-[#0d120e] px-2.5 py-1.5 text-[var(--accent)]">
                    Content-Type
                  </span>
                  <span className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[#0d120e] px-2.5 py-1.5 text-[#c9d4cd]">
                    application/json
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[12px]">
                  <span className="w-2/5 shrink-0 rounded-md border border-dashed border-[var(--border)] px-2.5 py-1.5 text-center text-[10.5px] text-[#5a6a60]">
                    + add header
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1.5 text-[10.5px] text-[#5a6a60]">
                    + Authorization
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-1 font-mono text-[11px]">
              <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 font-semibold text-emerald-300 ring-1 ring-emerald-400/20 ring-inset">
                200
              </span>
              <span className="text-[#5a6a60]">132 ms</span>
              <span className="text-[#5a6a60]">·</span>
              <span className="truncate text-[#8fa89a]">
                {'{"received":true}'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid — roomy, no cramped columns */}
      <section
        className="animate-rise mt-20 grid w-full grid-cols-1 gap-x-12 gap-y-10 sm:mt-28 md:grid-cols-2"
        aria-label="Features"
      >
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-2)]">
              <Icon
                className="size-4.5 text-[var(--accent)]"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--fg)]">
                {title}
              </h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--muted-fg)]">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      <footer className="animate-fade mt-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-24 text-xs text-[var(--muted-fg)] [animation-delay:160ms]">
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
