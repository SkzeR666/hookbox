import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hookbox/database";
import { INBOX_TTL_HOURS, newPublicId, newToken, type InboxCreateResult } from "@hookbox/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  let name = "New Inbox";
  try {
    const body = await req.json();
    if (typeof body?.name === "string" && body.name.trim()) {
      name = body.name.trim().slice(0, 60);
    }
  } catch {
    // default name
  }

  const publicId = await uniquePublicId();
  const token = newToken();

  const inbox = await prisma.inbox.create({
    data: {
      publicId,
      name,
      token,
      expiresAt: new Date(Date.now() + INBOX_TTL_HOURS * 3_600_000),
    },
  });

  const result: InboxCreateResult = {
    publicId: inbox.publicId,
    name: inbox.name,
    url: publicUrl(inbox.publicId),
    createdAt: inbox.createdAt.toISOString(),
    expiresAt: inbox.expiresAt?.toISOString() ?? null,
    token,
    requestCount: 0,
  };

  return NextResponse.json(result, { status: 201 });
}

async function uniquePublicId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = newPublicId(8);
    const exists = await prisma.inbox.findUnique({
      where: { publicId: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("could not allocate public id");
}

function publicUrl(publicId: string): string {
  return `${APP_URL}/i/${publicId}`;
}