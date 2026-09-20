# Contributing to Hookbox

Thanks for considering contributing. Hookbox is a small, focused tool, and we
intend to keep it that way.

## Ground rules

The product rule is simple:

> No feature enters if it does not improve the cycle *catch → understand →
> reproduce → fix*.

Nothing that turns Hookbox into a "webhook platform" (workflows, transforms,
schedules, team features, providers) is accepted into V1. Propose it after the
MVP is battle-tested.

## Before you start

- Check open issues for something already in flight.
- For non-trivial changes, open an issue first so we agree on direction before
  you write code.
- Keep changes small and reviewable.

## Dev setup

The repo is a Turborepo + npm workspaces monorepo.

```bash
# clone & install
npm install

# create an anonymous inbox + capture a request, using SQLite (zero config)
cp .env.example .env

# generate prisma client against the active datasource
npm run db:generate -w @hookbox/database
npm run dev
```

Open http://localhost:3000, click **Create a free inbox**, then:

```bash
curl -X POST http://localhost:3000/i/<inboxId> \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'
```

### Switching database providers

Dev defaults to SQLite (`file:./dev.db`). To run against PostgreSQL in
production, set `DATABASE_URL` and generate against the postgres schema:

```bash
DATABASE_URL="postgresql://..." npm run db:push -w @hookbox/database -- --schema prisma/schema.postgres.prisma
DATABASE_URL="postgresql://..." npm run db:generate -w @hookbox/database -- --schema prisma/schema.postgres.prisma
```

Note: only change the provider in the schema file matching your environment.

## Commands

```bash
npm run dev        # turbo dev (web on :3000)
npm run build      # typecheck + build all
npm run lint       # eslint
```

## Coding style

- TypeScript everywhere, strict mode.
- Server code lives in `apps/web/src/app/api/**/route.ts`.
- Shared pure logic (ids, curl builders, SSRF guard) lives in `packages/core`.
- Shared UI primitives live in `packages/ui`.
- No new dependency without a reason; prefer plain TS.
- **SSRF guard**: never loosen `packages/core/src/ssrf.ts` without a test and
  a discussion.

## Testing

Run the test suite before pushing:

```bash
npm run test
```

## Commit

- Keep the message short and imperative. Follow existing style.

## License

By contributing you agree that your contributions are licensed under
AGPL-3.0 (see `LICENSE`).