import {
  BODY_LIMIT_BYTES,
  HEADERS_LIMIT_BYTES,
  newUuid,
  headersToRecord,
  byteLength,
  type CapturedRequest,
} from "@hookbox/core";

export interface CaptureDbFields {
  method: string;
  path: string;
  query: string;
  headers: string;
  body: string;
  contentType: string | null;
  ip: string | null;
  receivedAt: Date;
  sizeBytes: number;
  bodyTruncated: boolean;
}

export interface CaptureResult {
  request: CapturedRequest;
  db: CaptureDbFields;
  error: "path_too_long" | "headers_too_large" | "body_too_large" | null;
}

function parseQuery(url: URL): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of url.searchParams) {
    const prev = out[k];
    if (prev === undefined) {
      out[k] = v;
    } else if (Array.isArray(prev)) {
      prev.push(v);
    } else {
      out[k] = [prev, v];
    }
  }
  return out;
}

export async function captureRequest(
  req: Request,
  inboxId: string,
  pathname: string,
): Promise<CaptureResult> {
  const headers = req.headers;
  const headersRecord = headersToRecord(headers.entries());

  const headerBytes = byteLength(JSON.stringify(headersRecord));
  const tooLargeHeaders = headerBytes > HEADERS_LIMIT_BYTES;

  const body = await req.text();
  const tooLargeBody = byteLength(body) > BODY_LIMIT_BYTES;

  const url = new URL(req.url);
  const path = pathname.replace(/^\/i\/[^/]+/, "") || "/";
  const tooLongPath = path.length > 512;

  const contentType = headersRecord["content-type"] ?? null;
  const xff = headersRecord["x-forwarded-for"];
  const ip = xff ? xff.split(",")[0].trim() : (headersRecord["x-real-ip"] ?? null);

  const query = parseQuery(url);

  const sizeBytes =
    byteLength(req.method) +
    byteLength(path) +
    byteLength(JSON.stringify(query)) +
    byteLength(JSON.stringify(headersRecord)) +
    byteLength(body);

  const request: CapturedRequest = {
    id: newUuid(),
    inboxId,
    method: req.method,
    path,
    query,
    headers: headersRecord,
    body,
    contentType,
    ip,
    receivedAt: new Date().toISOString(),
    sizeBytes,
    bodyTruncated: tooLargeBody,
  };

  return {
    request,
    db: {
      method: request.method,
      path: request.path,
      query: JSON.stringify(request.query),
      headers: JSON.stringify(request.headers),
      body: request.body,
      contentType: request.contentType,
      ip: request.ip,
      receivedAt: new Date(request.receivedAt),
      sizeBytes: request.sizeBytes,
      bodyTruncated: request.bodyTruncated,
    },
    error: tooLongPath
      ? "path_too_long"
      : tooLargeHeaders
        ? "headers_too_large"
        : tooLargeBody
          ? "body_too_large"
          : null,
  };
}