import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[13px] uppercase tracking-[0.35em] text-[var(--accent)]">
        Hookbox
      </p>
      <h1 className="mt-4 text-3xl font-semibold">404</h1>
      <p className="mt-2 text-[var(--muted-fg)]">
        Inbox not found — it may be expired or never existed.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-[var(--accent)] hover:underline"
      >
        Create a free inbox
      </Link>
    </main>
  );
}