"use client";

import { useEffect, useMemo, useState } from "react";
import type { CapturedRequest, RequestListItem } from "@hookbox/core";
import { buildDemoDataset } from "@hookbox/core/demo-data";
import { RequestList } from "@/components/request-list";
import { RequestInspector } from "@/components/request-inspector";
import { ReplayDialog } from "@/components/replay-dialog";
import { CompareView } from "@/components/compare-view";
import { DashboardShell, DashboardEmptyState } from "@/components/dashboard-shell";

export default function DemoPage() {
  const dataset = useMemo(() => buildDemoDataset(), []);
  const [requests, setRequests] = useState<RequestListItem[]>(dataset.list);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [streamedDetails, setStreamedDetails] = useState<
    Record<string, CapturedRequest>
  >({});

  // Simulate the SSE stream: new requests trickle in while you browse.
  useEffect(() => {
    const INCOMING = [
      { method: "POST", body: '{"event":"payment_intent.succeeded"}' },
      { method: "GET", body: "" },
      { method: "POST", body: '{"type":"ping","ok":true}' },
    ];
    const timers = INCOMING.map((incoming, idx) =>
      setTimeout(
        () => {
          const receivedAt = new Date().toISOString();
          const id = `req_demo_live_${idx}`;
          setRequests((prev) => [
            {
              id,
              method: incoming.method,
              path: "/",
              contentType: incoming.body ? "application/json" : null,
              ip: "13.228.69.5",
              receivedAt,
              sizeBytes: incoming.body.length + 240,
            },
            ...prev,
          ]);
          setStreamedDetails((prev) => ({
            ...prev,
            [id]: {
              id,
              inboxId: "demo7f8d",
              method: incoming.method,
              path: "/",
              query: {},
              headers: {
                Host: "hookbox.dev",
                "Content-Type": incoming.body ? "application/json" : "text/plain",
                "User-Agent": "curl/8.7.1",
              },
              body: incoming.body,
              contentType: incoming.body ? "application/json" : null,
              ip: "13.228.69.5",
              receivedAt,
              sizeBytes: incoming.body.length + 240,
              bodyTruncated: false,
            },
          }));
        },
        2600 + idx * 5200,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const detailFor = (id: string | null) =>
    id
      ? (streamedDetails[id] ?? dataset.details[id] ?? null)
      : null;
  const detail = detailFor(selectedId);
  const replayHistory = selectedId ? (dataset.replays[selectedId] ?? []) : [];

  const toggleCompare = (id: string) => {
    if (!compareA || (compareA && compareB)) {
      setCompareA(id);
      setCompareB(null);
      return;
    }
    if (id === compareA) {
      setCompareA(null);
      return;
    }
    setCompareB(id);
  };

  const exitCompare = () => {
    setCompareMode(false);
    setCompareA(null);
    setCompareB(null);
  };

  const compareData =
    compareMode && compareA && compareB
      ? { left: detailFor(compareA), right: detailFor(compareB) }
      : undefined;

  return (
    <DashboardShell
      url="https://hookbox.dev/i/demo7f8d"
      requestCount={requests.length}
      title={<span className="truncate font-mono text-[15px]">Demo inbox</span>}
      list={
        <RequestList
          requests={requests}
          selectedId={selectedId}
          onSelect={setSelectedId}
          live
          compareMode={compareMode}
          compareA={compareA}
          compareB={compareB}
          onCompareToggle={toggleCompare}
        />
      }
    >
      {compareMode && compareA && compareB ? (
        <CompareView
          leftId={compareA}
          rightId={compareB}
          data={compareData}
          onClose={exitCompare}
        />
      ) : compareMode ? (
        <DashboardEmptyState
          icon={
            <span className="font-mono text-lg text-[var(--accent)]">A|B</span>
          }
          title={compareA ? "Now pick B" : "Pick request A"}
          description="Select two requests in the list to diff them side by side — method, path, headers and body."
        />
      ) : selectedId && detail ? (
        <>
          <RequestInspector
            requestId={selectedId}
            data={{ request: detail, error: null }}
            onReplay={() => setReplaying(true)}
          />
          {replaying && (
            <ReplayDialog
              requestId={selectedId}
              initialMethod={detail.method}
              initialHeaders={detail.headers}
              initialBody={detail.body}
              history={replayHistory}
              simulate
              onClose={() => setReplaying(false)}
            />
          )}
        </>
      ) : (
        <DashboardEmptyState
          icon={
            <span className="flex">
              <span className="font-mono text-xl text-[var(--accent)]">{"{"}</span>
              <span className="font-mono text-xl text-[var(--accent)]">{"}"}</span>
            </span>
          }
          title="Pick a request on the left"
          description="This is the real dashboard running on sample data — headers, JSON bodies, cURL export and replay all work. Nothing is stored."
        />
      )}
    </DashboardShell>
  );
}
