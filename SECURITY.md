# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

We currently support the latest `main` branch. There are no long-term
maintenance releases yet.

## Reporting a Vulnerability

Hookbox is a webhook debugging tool. It receives arbitrary HTTP traffic from
the public internet by design, so a few things matter a lot here:

- **Payloads are never executed.** Captured bodies are stored and displayed
  as text only.
- **Replay is SSRF-protected.** Target URLs are validated before any request
  is made. See `SECURITY.md` notes in `packages/core`.

Please report vulnerabilities privately. Do **not** open a public issue for a
security problem.

- Email: security@hookbox.dev (placeholder — replace before production)
- Or open a [security advisory](https://github.com/YOUR-ORG/hookbox/security/advisories/new) (placeholder)

In your report, include:

1. A short summary of the vulnerability.
2. Steps to reproduce.
3. Impact and, if you have one, a suggested fix.

We aim to respond within 72 hours and to ship a fix as soon as possible.

## Security-relevant areas

- `packages/core/src/ssrf.ts` — SSRF protection for replay. Changes here must
  keep private ranges (loopback, link-local, RFC1918, IPv6 ULA/link-local and
  the cloud metadata endpoint 169.254.169.254) blocked.
- `apps/web/src/app/api/i/[inboxId]/route.ts` — the public capture endpoint.
  It accepts arbitrary requests; size limits and rate limiting live here.

## Self-hosting notes

- Run behind TLS in production.
- Keep `DATABASE_URL` and any secrets out of client bundles (they already are).
- The cloud metadata endpoints (`169.254.169.254`) are blocked by design.

## Bug bounty

No bug bounty program yet.