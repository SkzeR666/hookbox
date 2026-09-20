# Hookbox

> Inspect. Replay. Fix.

Hookbox is an open-source webhook debugging workspace.

Catch HTTP requests, inspect every detail,
and replay them against your application.

## Quick start

```bash
cp .env.example .env        # sqlite works out of the box (no docker needed)
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000, click **Create a free inbox**, then send it a request:

```bash
curl -X POST http://localhost:3000/i/<inboxId> \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'
```

It appears in real time. Open it, inspect the headers, copy the cURL, and replay it against your own endpoint.

### With Docker + PostgreSQL

```bash
docker compose up --build
```

Open http://localhost:3000. The webhook URL becomes `http://localhost:3000/i/<inboxId>`.

## Features

- HTTP webhook capture — GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
- Real-time request inspection via SSE
- Headers / query / body / raw view
- Copy as cURL, copy JSON, copy raw
- Request replay with editable method, headers and body
- SSRF-protected replay (private ranges, metadata endpoints, DNS checks)
- Request size and rate limits from day one
- Anonymous inboxes, no account required (24h TTL)
- SQLite for dev, PostgreSQL for production
- Self-hostable

## How it works

| Concept               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| **Inbox**             | A public URL like `https://hookbox.dev/i/7f8d2a9c`   |
| **Request**           | Everything Hookbox receives — method, path, headers, query, body, IP, size |
| **Replay**            | Take a captured request and send it to any target URL, editted |

## Monorepo layout

```
hookbox/
├── apps/
│   └── web/           # Next.js app — UI + API routes + /i/:id receiver
├── packages/
│   ├── core/          # ids, limits, curl builders, SSRF guard (pure TS)
│   ├── database/      # Prisma schemas + client (sqlite & postgres)
│   └── ui/            # shared UI primitives
├── docker/
│   └── Dockerfile
├── docs/
├── docker-compose.yml
├── LICENSE
├── CONTRIBUTING.md
└── SECURITY.md
```

## Repository conventions

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

## Development

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

## Roadmap

- [x] V0 — create inbox, receive request, inspect
- [x] V0.1 — realtime (SSE)
- [x] V0.2 — replay (edit method/headers/body, show response)
- [ ] V0.3 — mock responses (status, headers, body, delay)
- [ ] V0.4 — compare two requests
- [ ] V1 — accounts + persistent inboxes

## Why?

Debugging webhooks shouldn't require a pile of unrelated tools —
webhook.site → terminal → ngrok → Postman → logs → code → webhook.site.

Hookbox is the place to run the whole investigation loop.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

You can self-host Hookbox freely. If you modify and offer it as a network
service, those modifications must stay under AGPL (see the LICENSE for details).