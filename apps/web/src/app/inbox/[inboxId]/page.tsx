import { notFound } from "next/navigation";
import { prisma } from "@hookbox/database";
import InboxDashboard from "@/components/inbox-dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ inboxId: string }>;
}) {
  const { inboxId } = await params;

  const inbox = await prisma.inbox.findUnique({
    where: { publicId: inboxId },
    select: {
      publicId: true,
      name: true,
      createdAt: true,
      expiresAt: true,
      token: true,
      _count: { select: { requests: true } },
    },
  });

  if (!inbox) notFound();

  return (
    <InboxDashboard
      publicId={inbox.publicId}
      name={inbox.name}
      token={inbox.token}
      createdAt={inbox.createdAt.toISOString()}
      expiresAt={inbox.expiresAt?.toISOString() ?? null}
      initialRequestCount={inbox._count.requests}
    />
  );
}