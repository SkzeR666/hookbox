import type {
  CapturedRequest,
  RequestListItem,
  Replay,
} from "./types.js";

/**
 * Deterministic demo dataset for the landing-page tour (`/demo`).
 * Mirrors the shapes returned by the real API so the demo exercises the
 * exact same dashboard components — only the data source differs.
 */

const MIN = 60_000;
const now = () => Date.now();
const ago = (minutes: number) => new Date(now() - minutes * MIN).toISOString();

const REALISTIC_UA =
  "Stripe/1.0 (+https://stripe.com/docs/webhooks)";
const SIGNATURE =
  "t=1758370800,v1=5f8a2c1d9e4b7a3f6e0d8c2b4a6f1e3d5c7b9a1f3e5d7c9b";

const STRIPE_BODY = `{
  "id": "evt_1QxYz2Kb7f8d2a9c",
  "object": "event",
  "api_version": "2024-06-20",
  "created": 1758370799,
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_a1b2c3d4e5",
      "object": "checkout.session",
      "amount_total": 4990,
      "currency": "usd",
      "payment_status": "paid",
      "customer_email": "ada@example.com",
      "metadata": {
        "plan": "pro",
        "userId": "usr_8842"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_9z8y7x6w5v",
    "idempotency_key": null
  }
}`;

const GITHUB_BODY = `{
  "action": "opened",
  "issue": {
    "number": 42,
    "title": "Dashboard feels cramped on ultrawide",
    "state": "open",
    "user": { "login": "octocat" },
    "labels": ["ui", "polish"]
  },
  "repository": {
    "full_name": "hookbox/hookbox",
    "private": false
  },
  "sender": { "login": "octocat" }
}`;

const SLACK_BODY = `{
  "type": "event_callback",
  "team_id": "T024H7Q9C",
  "event": {
    "type": "app_mention",
    "user": "U02ABCD3E",
    "text": "<@U0deHook> replay that last webhook",
    "channel": "C0DEHOOK9",
    "ts": "1758370800.000300"
  }
}`;

const DISCORD_BODY = `{
  "application_id": "9f8e7d6c5b4a",
  "channel_id": "884211224492298270",
  "content": "deploy finished ✓",
  "id": "1122334455667788990",
  "timestamp": "2025-09-20T12:34:56.789000+00:00",
  "type": 0
}`;

interface Seed {
  method: string;
  path: string;
  contentType: string;
  body: string;
  minutesAgo: number;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}

const SEEDS: Seed[] = [
  {
    method: "POST",
    path: "",
    contentType: "application/json",
    body: STRIPE_BODY,
    minutesAgo: 2,
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": SIGNATURE,
      "User-Agent": REALISTIC_UA,
      "Stripe-Account": "acct_1K2L3M4N",
    },
  },
  {
    method: "POST",
    path: "",
    contentType: "application/json",
    body: GITHUB_BODY,
    minutesAgo: 9,
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "issues",
      "X-GitHub-Delivery": "e5d3c1a9-77bb-11ef-9d2f-8f3a1c2b4d6e",
      "X-Hub-Signature-256": "sha256=1a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f7081",
      "User-Agent": "GitHub-Hookshot/6a8b4c2",
    },
  },
  {
    method: "GET",
    path: "",
    contentType: "application/json",
    body: "",
    minutesAgo: 23,
    query: { event: "ping", source: "docs", verbose: "1" },
    headers: {
      "Accept": "application/json",
      "User-Agent": "curl/8.7.1",
    },
  },
  {
    method: "PUT",
    path: "",
    contentType: "application/json",
    body: `{
  "status": "shipped",
  "tracking": "1Z999AA10123456784",
  "carrier": "UPS",
  "items": [{ "sku": "HB-TEE-01", "qty": 2 }]
}`,
    minutesAgo: 41,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.demo.signature",
    },
  },
  {
    method: "POST",
    path: "",
    contentType: "application/json",
    body: SLACK_BODY,
    minutesAgo: 58,
    headers: {
      "Content-Type": "application/json",
      "X-Slack-Signature": "v0=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
    },
  },
  {
    method: "PATCH",
    path: "",
    contentType: "application/json",
    body: `{
  "order": "ord_7f8d2a9c",
  "status": "cancelled",
  "reason": "duplicate"
}`,
    minutesAgo: 77,
    headers: { "Content-Type": "application/json" },
  },
  {
    method: "DELETE",
    path: "",
    contentType: "application/json",
    body: "",
    minutesAgo: 95,
    headers: { "Authorization": "Bearer demo-token-42" },
  },
  {
    method: "POST",
    path: "",
    contentType: "application/x-www-form-urlencoded",
    body: "type=invoice.paid&amount=4990&currency=usd&attempt=1&retry=false",
    minutesAgo: 132,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  },
  {
    method: "POST",
    path: "",
    contentType: "application/json",
    body: DISCORD_BODY,
    minutesAgo: 180,
    headers: {
      "Content-Type": "application/json",
      "X-Signature-Ed25519": "5d1b3f8e2a7c49b0d6e3f1a8c5b20947d6e3f1a8c5b20947d6e3f1a8c5b2094",
      "X-Signature-Timestamp": "1758369800",
    },
  },
];

const baseHeaders = (): Record<string, string> => ({
  "Host": "hookbox.dev",
  "Accept": "*/*",
  "Accept-Encoding": "gzip, br",
  "Cf-Connecting-Ip": "54.187.216.72",
  "Cf-Ray": "8c2f1a9d3e7b4c25-GRU",
  "X-Forwarded-Proto": "https",
});

function seededId(kind: string, n: number): string {
  return `${kind}_demo_${String(n).padStart(3, "0")}`;
}

export interface DemoDataset {
  publicId: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  list: RequestListItem[];
  details: Record<string, CapturedRequest>;
  replays: Record<string, Replay[]>;
}

let cache: DemoDataset | null = null;

export function buildDemoDataset(): DemoDataset {
  if (cache) return cache;

  const list: RequestListItem[] = [];
  const details: Record<string, CapturedRequest> = {};
  const replays: Record<string, Replay[]> = {};

  SEEDS.forEach((seed, i) => {
    const id = seededId("req", i);
    const receivedAt = ago(seed.minutesAgo);
    const sizeBytes = seed.body.length + 240;

    const headers: Record<string, string> = {
      ...baseHeaders(),
      "Content-Type": seed.contentType,
      ...(seed.headers ?? {}),
    };

    list.push({
      id,
      method: seed.method,
      path: seed.path || "/",
      contentType: seed.contentType,
      ip: "54.187.216.72",
      receivedAt,
      sizeBytes,
    });

    details[id] = {
      id,
      inboxId: "demo7f8d",
      method: seed.method,
      path: seed.path || "/",
      query: seed.query ?? {},
      headers,
      body: seed.body,
      contentType: seed.contentType,
      ip: "54.187.216.72",
      receivedAt,
      sizeBytes,
      bodyTruncated: false,
    };

    // The Stripe checkout event arrives with two past replay attempts.
    if (i === 0) {
      replays[id] = [
        {
          id: seededId("rpl", 1),
          requestId: id,
          targetUrl: "http://localhost:3000/api/webhooks/stripe",
          method: "POST",
          headers: seed.headers ?? {},
          body: seed.body,
          statusCode: 200,
          responseHeaders: { "content-type": "application/json" },
          responseBody: '{"received":true}',
          durationMs: 132,
          error: null,
          createdAt: ago(1),
        },
        {
          id: seededId("rpl", 0),
          requestId: id,
          targetUrl: "http://localhost:4000/legacy/hooks",
          method: "POST",
          headers: seed.headers ?? {},
          body: seed.body,
          statusCode: 500,
          responseHeaders: { "content-type": "text/plain" },
          responseBody: "handler panicked: unknown event type",
          durationMs: 2041,
          error: null,
          createdAt: ago(1),
        },
      ];
    }
  });

  cache = {
    publicId: "demo7f8d",
    name: "Demo inbox",
    createdAt: ago(262),
    expiresAt: null,
    list,
    details,
    replays,
  };
  return cache;
}
