import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
emitter.setMaxListeners(1000);

export function subscribeRequest(
  inboxPublicId: string,
  cb: (data: unknown) => void,
): () => void {
  const handler = (e: { inboxPublicId: string; data: unknown }) => {
    if (e.inboxPublicId === inboxPublicId) cb(e.data);
  };
  emitter.on("request", handler);
  return () => emitter.off("request", handler);
}

export function subscribeInboxDeleted(
  inboxPublicId: string,
  cb: () => void,
): () => void {
  const handler = (e: { inboxPublicId: string }) => {
    if (e.inboxPublicId === inboxPublicId) cb();
  };
  emitter.on("inboxDeleted", handler);
  return () => emitter.off("inboxDeleted", handler);
}

export function emitRequest(inboxPublicId: string, data: unknown) {
  emitter.emit("request", { inboxPublicId, data });
}

export function emitInboxDeleted(inboxPublicId: string) {
  emitter.emit("inboxDeleted", { inboxPublicId });
}