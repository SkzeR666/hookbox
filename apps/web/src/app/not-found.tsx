import Link from "next/link";
import CreateInboxButton from "./create-inbox-button";
import { Inbox } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[13px] tracking-[0.35em] text-[var(--accent)] uppercase">
        Hookbox
      </p>
      <div className="mt-6 flex size-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-2)]">
        <Inbox className="size-6 text-[var(--muted-fg)]" strokeWidth={1.5} />
      </div>
      <h1 className="mt-4 text-3xl font-semibold">404</h1>
      <p className="mt-2 text-sm text-[var(--muted-fg)]">
        Inbox not found — it may be expired or never existed.
      </p>
      <div className="mt-6">
        <CreateInboxButton />
      </div>
      <Link
        href="/"
        className="mt-4 text-[13px] text-[var(--muted-fg)] transition-colors hover:text-[var(--fg)]"
      >
        Back to home
      </Link>
    </main>
  );
}
