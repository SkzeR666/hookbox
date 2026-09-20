"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@hookbox/ui";

interface CreateResult {
  publicId: string;
  url: string;
  token: string;
}

export default function CreateInboxButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Inbox" }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as CreateResult;
      sessionStorage.setItem(`hookbox:token:${data.publicId}`, data.token);
      router.push(`/inbox/${data.publicId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create inbox");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button size="lg" onClick={create} disabled={loading}>
        {loading ? "Creating…" : "Create a free inbox"}
      </Button>
      {error && <p className="text-[13px] text-[--danger]">{error}</p>}
    </div>
  );
}