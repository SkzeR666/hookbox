import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import {
  validateTargetUrl,
  SsrfError,
  REPLAY_TIMEOUT_MS,
  REPLAY_MAX_RESPONSE_BYTES,
  newUuid,
  type Replay as ReplayType,
} from "@hookbox/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ requestId: string }> };

interface ReplayRequestPayload {
  targetUrl: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { requestId } = await params;

  const source = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      method: true,
      path: true,
      headers: true,
      body: true,
    },
  });
  if (!source) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const sourceHeaders = parseJson<Record<string, string>>(source.headers as string) ?? {};

  let payload: ReplayRequestPayload;
  try {
    payload = (await req.json()) as ReplayRequestPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let targetUrl: string;
  try {
    const validated = await validateTargetUrl(payload.targetUrl);
    targetUrl = validated.url;
  } catch (err) {
    if (err instanceof SsrfError) {
      return NextResponse.json(
        { error: "ssrf_blocked", detail: err.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const method = (payload.method ?? source.method ?? "GET").toUpperCase();
  const headers = payload.headers ?? sourceHeaders;
  const body = payload.body ?? source.body ?? "";

  const replayId = newUuid();
  const started = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REPLAY_TIMEOUT_MS);

    const res = await fetch(targetUrl, {
      method,
      headers: cleanHeaders(headers),
      body: hasBody(method) ? body : undefined,
      redirect: "follow",
      signal: controller.signal,
    });

    const durationMs = Date.now() - started;
    const responseText = await readCapped(res, REPLAY_MAX_RESPONSE_BYTES);
    clearTimeout(timer);

    const responseHeaders = Object.fromEntries(res.headers.entries());

    const replay = await prisma.replay.create({
      data: {
        id: replayId,
        requestId: source.id,
        targetUrl: targetUrl.slice(0, 2048),
        method,
        headers: JSON.stringify(headers),
        body,
        statusCode: res.status,
        responseHeaders: JSON.stringify(responseHeaders),
        responseBody: responseText,
        durationMs,
      },
    });

    return NextResponse.json(toReplayDto(replay));
  } catch (err) {
    const replay = await prisma.replay.create({
      data: {
        id: replayId,
        requestId: source.id,
        targetUrl: targetUrl.slice(0, 2048),
        method,
        headers: JSON.stringify(headers),
        body,
        error:
          err instanceof Error
            ? err.name === "AbortError"
              ? `Request timed out after ${REPLAY_TIMEOUT_MS}ms`
              : err.message.slice(0, 500)
            : "Unknown replay error",
      },
    });
    return NextResponse.json(
      { error: "replay_failed", replay: toReplayDto(replay) },
      { status: 502 },
    );
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { requestId } = await params;
  const source = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true },
  });
  if (!source) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const replays = await prisma.replay.findMany({
    where: { requestId: source.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    replays: replays.map(toReplayDto),
  });
}

function toReplayDto(row: {
  id: string;
  requestId: string;
  targetUrl: string;
  method: string;
  headers: string;
  body: string;
  statusCode: number | null;
  responseHeaders: string;
  responseBody: string;
  durationMs: number;
  error: string | null;
  createdAt: Date;
}): ReplayType {
  return {
    id: row.id,
    requestId: row.requestId,
    targetUrl: row.targetUrl,
    method: row.method,
    headers: parseJson<Record<string, string>>(row.headers) ?? {},
    body: row.body ?? "",
    statusCode: row.statusCode,
    responseHeaders: parseJson<Record<string, string>>(row.responseHeaders) ?? {},
    responseBody: row.responseBody ?? "",
    durationMs: row.durationMs,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  };
}

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw ?? "") as T;
  } catch {
    return null;
  }
}

function hasBody(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);
}

function cleanHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (/^host$/i.test(k)) continue; // let fetch set it
    out[k] = v;
  }
  return out;
}

async function readCapped(
  res: Response,
  limit: number,
): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      const remaining = limit - total;
      if (remaining <= 0) break;
      if (value.length > remaining) {
        chunks.push(value.subarray(0, remaining));
        total += remaining;
        break;
      }
      chunks.push(value);
      total += value.length;
    }
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}