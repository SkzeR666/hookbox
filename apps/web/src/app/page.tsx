import CreateInboxButton from "./create-inbox-button";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
      <div className="mb-14 flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[13px] uppercase tracking-[0.35em] text-[var(--accent)]">
          Hookbox
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Debug webhooks without the headache.
        </h1>
        <p className="mt-4 max-w-xl text-balance text-base leading-relaxed text-[var(--muted-fg)] sm:text-lg">
          Catch HTTP requests. Inspect every detail.
          <br />
          Replay when you&apos;re ready.
        </p>
      </div>

      <CreateInboxButton />

      <p className="mt-4 text-[13px] text-[var(--muted-fg)]">
        No account required. Temporary inboxes last 24h.
      </p>

      <div className="mt-16 w-full max-w-2xl">
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[#0a0e0c]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a453d]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a453d]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a453d]" />
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-[#c9d6cf]">
            <code>
              <span className="text-[#5a6a60]"># your callback URL</span>
              {"\n"}
              <span className="text-[var(--accent)]">https://</span>
              <span className="text-[#8fa89a]">hookbox.dev/i/</span>
              <span className="text-[#e6ece8]">7f8d2a9c</span>
              {"\n"}
              {"\n"}
              <span className="text-[#5a6a60]"># a webhook arrives</span>
              {"\n"}
              <span className="text-[#8fa89a]">POST</span>{" "}
              <span className="text-[#ff8fa3]">/i/7f8d2a9c</span>{" "}
              <span className="text-[#5a6a60]">200</span>
              {"\n"}
              <span className="text-[#8fa89a]">Content-Type:</span>{" "}
              <span className="text-[#e6ece8]">application/json</span>
              {"\n"}
              <span className="text-[#8fa89a]">Stripe-Signature:</span>{" "}
              <span className="text-[#e6ece8]">
                t=...,v1=a1b2c3d4...
              </span>
              {"\n"}
              {"\n"}
              <span>{"{"}</span>
              {"\n"}
              <span className="pl-4 text-[#8fa89a]">{'"type":'}</span>{" "}
              <span className="text-[#7dd3a5]">
                {'"checkout.session.completed"'}
              </span>
              <span>,</span>
              {"\n"}
              <span className="pl-4 text-[#8fa89a]">{'"amount":'}</span>{" "}
              <span className="text-[#e0b48c]">4990</span>
              {"\n"}
              <span>{"}"}</span>
            </code>
          </pre>
        </div>
      </div>

      <footer className="mt-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-[var(--muted-fg)]">
        <span>Open source</span>
        <span>·</span>
        <span>Self-hostable</span>
        <span>·</span>
        <span>AGPL-3.0</span>
      </footer>
    </main>
  );
}