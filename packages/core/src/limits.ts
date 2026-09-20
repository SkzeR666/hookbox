export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const BODY_LIMIT_BYTES = envInt("BODY_LIMIT_BYTES", 1_000_000);

export const HEADERS_LIMIT_BYTES = envInt("HEADERS_LIMIT_BYTES", 64 * 1024);

export const RATE_LIMIT_PER_MINUTE = envInt("RATE_LIMIT_PER_MINUTE", 120);

export const INBOX_TTL_HOURS = envInt("INBOX_TTL_HOURS", 24);

export const MAX_REQUESTS_LISTED = 200;

export const REPLAY_TIMEOUT_MS = 10_000;

export const REPLAY_MAX_RESPONSE_BYTES = 256 * 1024;
