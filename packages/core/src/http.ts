export interface CurlOptions {
  url: string;
  method?: string;
  headers?: Record<string, string> | string;
  body?: string;
}

export function buildCurl(opts: CurlOptions): string {
  const method = (opts.method ?? "GET").toUpperCase();
  const parts = ["curl"];
  if (method !== "GET" && method !== "HEAD") {
    parts.push(`-X ${method}`);
  }
  if (method === "HEAD") {
    parts.push(`-X HEAD`);
  }
  parts.push(`'${escapeShell(opts.url)}'`);
  if (opts.headers) {
    const headers =
      typeof opts.headers === "string" ? JSON.parse(opts.headers) : opts.headers;
    for (const [k, v] of Object.entries(headers)) {
      parts.push(`-H '${escapeShell(`${k}: ${v}`)}'`);
    }
  }
  if (opts.body) {
    parts.push(`--data '${escapeShell(opts.body)}'`);
  }
  return parts.join(" \\\n  ");
}

export function buildRawRequest(opts: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}): string {
  const method = opts.method.toUpperCase();
  const u = new URL(opts.url);
  const target = `${u.pathname}${u.search}`;
  const lines = [`${method} ${target} HTTP/1.1`, `Host: ${u.host}`];
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      lines.push(`${k}: ${v}`);
    }
  }
  if (opts.body) lines.push("", opts.body);
  return lines.join("\n");
}

function escapeShell(s: string): string {
  return s.replace(/'/g, "'\\''");
}

export function headersToRecord(
  headers: Iterable<[string, string]>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of headers) {
    out[k] = v;
  }
  return out;
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}
