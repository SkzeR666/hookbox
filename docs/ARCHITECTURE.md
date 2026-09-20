# Architecture

Hookbox is a single Next.js app (App Router) that serves both the product UI
and the webhook receiver.

```
Browser
  │ 1. create inbox            POST /api/inboxes
  │ 2. dashboard               GET /inbox/:id  (SSR page)
  │ 3. subscribe to events     GET /api/inboxes/:id/events  (SSE)
  ▼
Next.js (apps/web)
  ├── app/api/inboxes/*        CRUD + request listing
  ├── app/api/requests/*       detail + replay (SSRF-protected)
  ├── app/i/:id/route.ts       ★ THE RECEIVER — any method, any path
  │     └ captures method/path/headers/query/body/IP/size
  ▲
  │ write
Prisma (packages/database)
  └── sqlite (dev) | postgres (prod)
```

## Receiver flow

1. Check rate limit (in-memory, per inbox).
2. Look up inbox by `publicId`; 404 if missing, 410 if expired.
3. `captureRequest()` reads body up to 1 MB and headers up to 64 KB,
   marking `bodyTruncated` when the cap is hit.
4. Persist as a `Request` row.
5. Emit to the in-memory bus → SSE pushes it to open dashboards in real time.

## Realtime

SSE (`text/event-stream`) with a 15s ping. Subscriptions live in a module-level
`EventEmitter` (`apps/web/src/lib/bus.ts`). Because it's in-memory, realtime
assumes a single running instance. A future version can swap the bus for
Postgres LISTEN/NOTIFY without touching the UI.

## Replay

`POST /api/requests/:id/replay`:

1. Validate the target URL against `packages/core/src/ssrf.ts` —
   blocks loopback, RFC1918, link-local, CGNAT, multicast, IPv6 ULA/link-local,
   cloud metadata endpoints and DNS-resolved private addresses.
2. Replay with `fetch` (Node runtime), 10s timeout, capped response body
   (256 KB), `Host` header stripped so `fetch` sets it.
3. Persist every attempt in the `Replay` table — success or error.

## Limits (env-overridable)

| Setting                   | Default | Env var                   |
| ------------------------- | ------- | ------------------------- |
| Request body              | 1 MB    | `BODY_LIMIT_BYTES`        |
| Headers                   | 64 KB   | `HEADERS_LIMIT_BYTES`     |
| Rate limit per inbox      | 120/min | `RATE_LIMIT_PER_MINUTE`   |
| Anonymous inbox TTL       | 24 h    | `INBOX_TTL_HOURS`         |

## Data model

- `inboxes` — publicId, name, token (delete credential), expiresAt
- `requests` — method, path, query (JSON), headers (JSON), body, IP, receivedAt, sizeBytes
- `replays` — targetUrl, method, headers, body, result, durationMs, error

## Security model

- Payloads are never executed — captured bodies are text.
- Replay is SSRF-guarded at the core package (see SECURITY.md).
- Frontend never receives the inbox token except during creation; deletion and
  rename require the `x-hookbox-token` header.
- The DB is never exposed to the client.

## Deploying

- Dev: SQLite, single process.
- Prod: PostgreSQL via `docker compose up --build` (see Dockerfile); run a
  single `next start` instance for realtime to work across the whole fleet.