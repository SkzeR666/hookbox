<div align="center">

# 📦 Hookbox

### **Catch webhooks. Inspect everything. Replay in one click.**

**The open-source webhook debugging workspace** — a self-hosted request inspector
and replay tool that replaces the webhook.site → ngrok → Postman → logs juggling act.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-2dd4a7.svg)](CONTRIBUTING.md)

**[🚀 Try the live demo](https://hookbox.dev/demo)** — the real dashboard on sample data, zero setup · **[⚡ Create an inbox](https://hookbox.dev)**

</div>

---

Hookbox is a **webhook inspector**, **request bin** and **HTTP replay tool** in a
single self-hostable app. Point any webhook — Stripe, GitHub, Slack, Shopify,
Twilio, IAP, whatever — at your inbox URL and watch requests arrive **in real
time**. Open one up: full headers, parsed JSON body, query params, raw request,
one-click cURL export. Then **replay it** against localhost with any edits you want.

No account. No dashboard to configure. No losing the payload between five tools.

```bash
curl -X POST https://hookbox.dev/i/<inboxId> \
  -H "Content-Type: application/json" \
  -d '{"event":"payment_intent.succeeded"}'
```

→ it shows up instantly, streaming over SSE. That's the whole onboarding.

## ⚡ Quick start

```bash
cp .env.example .env        # sqlite works out of the box (no docker needed)
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000, click **Create a free inbox**, and send it anything.
Requires **Node ≥ 20**.

### 🐳 With Docker + PostgreSQL

```bash
docker compose up --build
```

## 🎯 Features

- 🎣 **Capture anything** — GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD, any content type, up to 1 MB
- 📡 **Real-time** — requests stream in live via Server-Sent Events, no refresh
- 🔬 **Inspect everything** — headers, query params, JSON body with syntax highlighting, raw request view
- 📋 **One-click exports** — copy as cURL, copy as JSON, copy raw HTTP request
- 🔁 **Replay & edit** — resend any request to any URL with editable method, headers and body
- 🛡️ **SSRF-safe by design** — replay blocks private ranges, metadata endpoints, and DNS rebinding
- 🕶️ **Zero signup** — anonymous inboxes with 24h TTL, no account, no email
- 🧪 **Interactive demo** — `/demo` runs the full dashboard on sample data, nothing stored
- 🐘 **SQLite or PostgreSQL** — sqlite for dev with zero config, Postgres for production
- 📦 **Self-hostable** — your webhooks never leave your machine if you don't want them to

## 🆚 Why not just use…?

| | Hookbox | webhook.site / requestbin | ngrok / tunnels | Postman / Insomnia |
| --- | --- | --- | --- | --- |
| Capture + inspect requests | ✅ | ✅ | ⚠️ via local inspector | ⚠️ manual |
| Real-time stream | ✅ SSE | ⚠️ polling-ish | ✅ | ❌ |
| Replay to **any** URL, fully edited | ✅ | ❌ | ❌ | ✅ |
| Keep the whole loop in one place | ✅ | ❌ | ❌ | ⚠️ |
| Self-host, data stays yours | ✅ AGPL | ❌ | 💰 paid tier | ⚠️ |
| Zero signup | ✅ | ⚠️ | ⚠️ | ⚠️ |

Debugging webhooks shouldn't require a pile of unrelated tools.
Hookbox is the place to run the whole investigation loop.

## 🧠 How it works

| Concept     | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| **Inbox**   | A public URL like `https://hookbox.dev/i/7f8d2a9c`                            |
| **Request** | Everything Hookbox receives — method, path, headers, query, body, IP, size   |
| **Replay**  | Take a captured request and send it to any target URL, edited however you like |

## 🗂 Monorepo layout

```
hookbox/
├── apps/
│   └── web/           # Next.js app — UI + API routes + /i/:id receiver
├── packages/
│   ├── core/          # ids, limits, curl builders, SSRF guard (pure TS)
│   ├── database/      # Prisma schemas + client (sqlite & postgres)
│   └── ui/            # shared UI primitives (fully custom controls — no native selects)
├── docker/
│   └── Dockerfile
├── docs/
├── docker-compose.yml
├── LICENSE
├── CONTRIBUTING.md
└── SECURITY.md
```

## 📐 Repository conventions

- **V1 scope**: capture → inspect → replay. Nothing that turns Hookbox into a
  "webhook platform" (workflows, transforms, teams, SDKs, MCP) is accepted.
- **Receiver**: the `/i/:id` route handler (Node runtime) is the only place
  that ingests arbitrary internet traffic. Size limits enforcement lives in
  `packages/core/src/limits.ts`.
- **Replay security**: `packages/core/src/ssrf.ts` must keep private ranges
  blocked. Never loosen it without tests.
- **Realtime**: SSE endpoint in `apps/web/src/app/api/inboxes/[inboxId]/events`.
  In-memory event bus, so run a single instance. Multi-instance realtime is
  future work (Postgres LISTEN/NOTIFY).
- **UI**: fully custom controls (selects, tooltips) — no native browser chrome.

## 🛠 Development

```bash
npm run dev        # turbo — web on :3000
npm run build      # typecheck + build
npm run lint       # eslint
npm run test       # node:test (core)
```

### Switching to PostgreSQL

```bash
# 1. set DATABASE_URL in .env
DATABASE_URL=postgresql://hookbox:hookbox@localhost:5432/hookbox?schema=public

# 2. push the schema and regenerate the client for the postgres provider
npm run db:push:postgres
npm run db:generate:postgres
```

Only the provider is regenerated; the models are identical across schemas.

## 🗺 Roadmap

- [x] V0 — create inbox, receive request, inspect
- [x] V0.1 — realtime (SSE)
- [x] V0.2 — replay (edit method/headers/body, show response)
- [ ] V0.3 — mock responses (status, headers, body, delay)
- [ ] V0.4 — compare two requests
- [ ] V1 — accounts + persistent inboxes

## 🤝 Contributing

PRs welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it's short.
Security issues: [SECURITY.md](SECURITY.md).

## ⚖️ License

**AGPL-3.0** — see [LICENSE](LICENSE).

You can self-host Hookbox freely. If you modify and offer it as a network
service, those modifications must stay under AGPL (see the LICENSE for details).

---

<div align="center">

**Hookbox** — inspect. replay. fix.

⭐ Star the repo if it saved you a debugging session.

</div>
