export interface Inbox {
  id: string;
  publicId: string;
  name: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface CapturedRequest {
  id: string;
  inboxId: string;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: string;
  contentType: string | null;
  ip: string | null;
  receivedAt: string;
  sizeBytes: number;
  bodyTruncated: boolean;
}

export interface InboxSummary {
  publicId: string;
  name: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  requestCount: number;
}

export interface InboxCreateResult extends InboxSummary {
  token: string;
}

export interface RequestListItem {
  id: string;
  method: string;
  path: string;
  contentType: string | null;
  ip: string | null;
  receivedAt: string;
  sizeBytes: number;
}

export interface Replay {
  id: string;
  requestId: string;
  targetUrl: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  statusCode: number | null;
  responseHeaders: Record<string, string>;
  responseBody: string;
  durationMs: number;
  error: string | null;
  createdAt: string;
}

export interface SsrfLookupResult {
  url: string;
  host: string;
  port: number;
}

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}
