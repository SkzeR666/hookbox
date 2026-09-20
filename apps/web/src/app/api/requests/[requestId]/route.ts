import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import type { CapturedRequest } from "@hookbox/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ requestId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { requestId } = await params;
  const row = await prisma.request.findUnique({ where: { id: requestId } });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const request: CapturedRequest = {
    id: row.id,
    inboxId: row.inboxId,
    method: row.method,
    path: row.path,
    query: safeJsonParse(row.query as string, {}),
    headers: safeJsonParse(row.headers as string, {}),
    body: row.body ?? "",
    contentType: row.contentType,
    ip: row.ip,
    receivedAt: row.receivedAt.toISOString(),
    sizeBytes: row.sizeBytes,
    bodyTruncated: row.bodyTruncated,
  };

  return NextResponse.json({ request });
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return (JSON.parse(raw ?? "") as T) ?? fallback;
  } catch {
    return fallback;
  }
}