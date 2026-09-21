import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import { captureRequest } from "@/lib/capture";
import { emitRequest } from "@/lib/bus";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inboxId: string; path?: string[] }> };
type Context = { params: Params["params"] };

async function handle(req: NextRequest, params: Context, isHead = false) {
  const { inboxId } = await params.params;

  if (!checkRateLimit(inboxId)) {
    return json(429, { error: "rate_limited", detail: "Too many requests." });
  }

  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: { id: true, expiresAt: true, mock: true },
  });

  if (!inbox) {
    return json(404, { error: "not_found", detail: "Inbox not found." });
  }

  if (inbox.expiresAt && inbox.expiresAt.getTime() < Date.now()) {
    return json(410, { error: "expired", detail: "Inbox has expired." });
  }

  const { request, db, error } = await captureRequest(
    req,
    inbox.id,
    req.nextUrl.pathname,
  );

  const stored = await prisma.request.create({
    data: {
      id: request.id,
      inboxId: request.inboxId,
      ...db,
    },
  });

  emitRequest(inboxId, {
    id: stored.id,
    method: stored.method,
    path: stored.path,
    contentType: stored.contentType,
    ip: stored.ip,
    receivedAt: stored.receivedAt.toISOString(),
    sizeBytes: stored.sizeBytes,
  });

  const status = error === null ? 200 : 413;
  if (isHead) {
    return new NextResponse(null, { status });
  }

  // V0.3 — mock response: an enabled preset overrides the default reply.
  const mock = inbox.mock;
  if (mock?.enabled) {
    if (mock.delayMs > 0) {
      await new Promise((r) => setTimeout(r, mock.delayMs));
    }
    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(mock.headers ?? "{}") as Record<string, string>;
    } catch {
      headers = {};
    }
    const body =
      mock.status === 204 || mock.status === 304 ? null : mock.body || null;
    return NextResponse.json(body, {
      status: mock.status,
      headers: {
        "content-type": mock.contentType || "application/json",
        ...headers,
      },
    });
  }

  return json(status, {
    ok: true,
    id: stored.id,
    received_at: stored.receivedAt,
    detail: error,
  });
}

function json(status: number, body: unknown): NextResponse {
  return NextResponse.json(body, { status });
}

export async function GET(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

export async function POST(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

export async function PUT(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

export async function OPTIONS(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

export async function HEAD(req: NextRequest, ctx: Params) {
  return handle(req, ctx, true);
}