import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import { MAX_REQUESTS_LISTED, type RequestListItem } from "@hookbox/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inboxId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: { id: true },
  });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const rows = await prisma.request.findMany({
    where: { inboxId: inbox.id },
    orderBy: { receivedAt: "desc" },
    take: MAX_REQUESTS_LISTED,
    select: {
      id: true,
      method: true,
      path: true,
      contentType: true,
      ip: true,
      receivedAt: true,
      sizeBytes: true,
    },
  });

  const items: RequestListItem[] = rows.map((r) => ({
    id: r.id,
    method: r.method,
    path: r.path,
    contentType: r.contentType,
    ip: r.ip,
    receivedAt: r.receivedAt.toISOString(),
    sizeBytes: r.sizeBytes,
  }));

  return NextResponse.json({ requests: items, count: items.length });
}