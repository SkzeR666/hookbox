import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import { emitInboxDeleted } from "@/lib/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inboxId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    include: { _count: { select: { requests: true } } },
  });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    publicId: inbox.publicId,
    name: inbox.name,
    createdAt: inbox.createdAt.toISOString(),
    expiresAt: inbox.expiresAt?.toISOString() ?? null,
    requestCount: inbox._count.requests,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const body = await req.json();
  const token = req.headers.get("x-hookbox-token");

  const inbox = await prisma.inbox.findUnique({ where: { publicId: inboxId } });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!token || token !== inbox.token) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 60)
      : inbox.name;

  const updated = await prisma.inbox.update({
    where: { id: inbox.id },
    data: { name },
  });

  return NextResponse.json({
    publicId: updated.publicId,
    name: updated.name,
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { inboxId } = await params;
  const token = req.headers.get("x-hookbox-token");

  const inbox = await prisma.inbox.findUnique({ where: { publicId: inboxId } });
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!token || token !== inbox.token) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.inbox.delete({ where: { id: inbox.id } });
  emitInboxDeleted(inboxId);
  return new NextResponse(null, { status: 204 });
}