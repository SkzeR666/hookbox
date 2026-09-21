import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import {
  BODY_LIMIT_BYTES,
  HEADERS_LIMIT_BYTES,
  type MockResponse,
} from "@hookbox/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inboxId: string }> };

const ALLOWED_STATUS = new Set([
  200, 201, 202, 204, 301, 302, 304, 400, 401, 403, 404, 409, 410, 418, 422,
  429, 500, 502, 503, 504,
]);

const DELAY_MIN_MS = 0;
const DELAY_MAX_MS = 30_000;

function toDto(row: {
  enabled: boolean;
  status: number;
  headers: string;
  body: string;
  contentType: string;
  delayMs: number;
}): MockResponse {
  let headers: Record<string, string> = {};
  try {
    headers = JSON.parse(row.headers ?? "{}") as Record<string, string>;
  } catch {
    headers = {};
  }
  return {
    enabled: row.enabled,
    status: row.status,
    headers,
    body: row.body,
    contentType: row.contentType,
    delayMs: row.delayMs,
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: { id: true, mock: true },
  });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!inbox.mock) {
    return NextResponse.json({
      enabled: false,
      status: 200,
      headers: {},
      body: "",
      contentType: "application/json",
      delayMs: 0,
    });
  }
  return NextResponse.json(toDto(inbox.mock));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const token = req.headers.get("x-hookbox-token");

  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: { id: true },
  });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!token || token !== (await inboxToken(inbox.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: MockResponse;
  try {
    payload = (await req.json()) as MockResponse;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const status = Number(payload.status);
  if (!Number.isInteger(status) || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json(
      { error: "invalid_status", detail: `status must be one of ${[...ALLOWED_STATUS].join(", ")}` },
      { status: 400 },
    );
  }

  const delayMs = Number(payload.delayMs ?? 0);
  if (!Number.isInteger(delayMs) || delayMs < DELAY_MIN_MS || delayMs > DELAY_MAX_MS) {
    return NextResponse.json(
      { error: "invalid_delay", detail: `delayMs must be between ${DELAY_MIN_MS} and ${DELAY_MAX_MS}` },
      { status: 400 },
    );
  }

  if (typeof payload.body === "string" && payload.body.length > BODY_LIMIT_BYTES) {
    return NextResponse.json(
      { error: "body_too_large", detail: `body exceeds ${BODY_LIMIT_BYTES} bytes` },
      { status: 413 },
    );
  }

  const headers = payload.headers ?? {};
  if (typeof headers !== "object" || Array.isArray(headers)) {
    return NextResponse.json(
      { error: "invalid_headers", detail: "headers must be an object" },
      { status: 400 },
    );
  }
  if (JSON.stringify(headers).length > HEADERS_LIMIT_BYTES) {
    return NextResponse.json(
      { error: "headers_too_large", detail: `headers exceed ${HEADERS_LIMIT_BYTES} bytes` },
      { status: 413 },
    );
  }

  // hop-by-hop / reserved headers cannot be forced from a preset
  for (const key of Object.keys(headers)) {
    if (/^(host|content-length|connection|transfer-encoding|upgrade)$/i.test(key)) {
      return NextResponse.json(
        { error: "reserved_header", detail: `cannot set reserved header: ${key}` },
        { status: 400 },
      );
    }
  }

  const contentType =
    typeof payload.contentType === "string" && payload.contentType.trim()
      ? payload.contentType.trim().slice(0, 120)
      : "application/json";

  const saved = await prisma.mockResponse.upsert({
    where: { inboxId: inbox.id },
    create: {
      inboxId: inbox.id,
      enabled: payload.enabled !== false,
      status,
      headers: JSON.stringify(headers),
      body: typeof payload.body === "string" ? payload.body : "",
      contentType,
      delayMs,
    },
    update: {
      enabled: payload.enabled !== false,
      status,
      headers: JSON.stringify(headers),
      body: typeof payload.body === "string" ? payload.body : "",
      contentType,
      delayMs,
    },
  });

  return NextResponse.json(toDto(saved));
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const token = req.headers.get("x-hookbox-token");

  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: { id: true },
  });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!token || token !== (await inboxToken(inbox.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.mockResponse.deleteMany({ where: { inboxId: inbox.id } });
  return new NextResponse(null, { status: 204 });
}

async function inboxToken(id: string): Promise<string | null> {
  const row = await prisma.inbox.findUnique({
    where: { id },
    select: { token: true },
  });
  return row?.token ?? null;
}
