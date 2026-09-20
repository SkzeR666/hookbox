import { NextRequest } from "next/server";
import { prisma } from "@hookbox/database";
import { subscribeRequest, subscribeInboxDeleted } from "@/lib/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inboxId: string }> };

function sse(data: object, event = "message"): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { inboxId } = await params;

  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: { id: true },
  });
  if (!inbox) {
    return new Response("Inbox not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(sse({ type: "connected", inboxId }, "connected")),
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // stream closed
        }
      }, 15_000);

      const unsubscribeRequest = subscribeRequest(inboxId, (data) => {
        try {
          controller.enqueue(encoder.encode(sse(data as object, "request")));
        } catch {
          // stream closed
        }
      });

      const unsubscribeDeleted = subscribeInboxDeleted(inboxId, () => {
        try {
          controller.enqueue(
            encoder.encode(sse({ type: "inbox_deleted" }, "inbox_deleted")),
          );
        } catch {
          // stream closed
        }
      });

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribeRequest();
        unsubscribeDeleted();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}