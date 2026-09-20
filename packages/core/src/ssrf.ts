import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { SsrfError } from "./types.js";
import { byteLength } from "./http.js";

const MAX_HOSTNAME_LENGTH = 253;
const MAX_PORT = 65535;

const PRIVATE_IPV4_RANGES = [
  [0x00000000, 8], // 0.0.0.0/8
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10 (CGNAT)
  [0x7f000000, 8], // 127.0.0.0/8 loopback
  [0xa9fe0000, 16], // 169.254.0.0/16 link-local (includes cloud metadata 169.254.169.254)
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0a80000, 16], // 192.168.0.0/16
  [0xc0000000, 24], // 192.0.0.0/24 + TEST-NET-1 192.0.2.0/24
  [0xc6120000, 15], // 198.18.0.0/15 benchmark
  [0xc6336400, 24], // 198.51.100.0/24 TEST-NET-2
  [0xcb007100, 24], // 203.0.113.0/24 TEST-NET-3
  [0xe0000000, 4], // 224.0.0.0/4 multicast
  [0xf0000000, 4], // 240.0.0.0/4 reserved
] as const;

function ipv4ToInt(parts: number[]): number {
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>>
    0
  );
}

function inRange(int: number, range: readonly [number, number]): boolean {
  const [base, mask] = range;
  const shift = 32 - mask;
  return (int >>> shift) === (base >>> shift);
}

function isBlockedIpv4(addr: string): boolean {
  const parts = addr.split(".").map((s) => {
    if (!/^\d{1,3}$/.test(s)) return -1;
    const n = Number.parseInt(s, 10);
    return n <= 255 ? n : -1;
  });
  if (parts.length !== 4 || parts.some((p) => p < 0)) return true;
  const int = ipv4ToInt(parts as number[]);
  return PRIVATE_IPV4_RANGES.some((range) => inRange(int, range));
}

function isBlockedIpv6(addr: string): boolean {
  const ip = normalizeIpv6(addr);
  if (!ip) return true;
  if (ip === "::1") return true; // loopback
  if (isIpv4Mapped(ip)) return isBlockedIpv4(extractIpv4(ip));
  const hextets = ip.split("::");
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // ULA
  if (ip.startsWith("fe8") || ip.startsWith("fe9") || ip.startsWith("fea") || ip.startsWith("feb"))
    return true; // link-local fe80::/10
  if (ip.startsWith("ff")) return true; // multicast
  if (hextets.length === 1 && hextets[0].length <= 4 && hextets[0].includes(":")) return true; // ~::/128
  return false;
}

function normalizeIpv6(addr: string): string | null {
  let a = addr.toLowerCase();
  const scope = a.indexOf("%");
  if (scope !== -1) a = a.slice(0, scope);
  if (!a.includes(":")) return null;
  if (a.includes(".")) {
    // embedded IPv4 like ::ffff:192.168.1.1 â€” return as-is for mapped check
    return a;
  }
  if (a === "::") return "::";
  return a;
}

function isIpv4Mapped(addr: string): boolean {
  return /::ffff:\d{1,3}(\.\d{1,3}){3}$/.test(addr);
}

function extractIpv4(addr: string): string {
  const match = addr.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  return match ? match[1] : "";
}

function looksLikeIpv4(s: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
}

function looksLikeIpv6(s: string): boolean {
  return s.includes(":");
}

export function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".lan") ||
    h.endsWith(".hookbox") ||
    h === "metadata.google.internal"
  );
}

export interface ValidatedUrl {
  protocol: "http:" | "https:";
  hostname: string;
  port: number;
  url: string;
  pathname: string;
  search: string;
}

export async function validateTargetUrl(raw: string): Promise<ValidatedUrl> {
  if (!raw || byteLength(raw) > 2048) {
    throw new SsrfError("URL missing or too long");
  }
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new SsrfError("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfError(
      `Only http and https protocols are allowed: ${parsed.protocol}`,
    );
  }

  const port = parsed.port ? Number.parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
  if (!Number.isInteger(port) || port <= 0 || port > MAX_PORT) {
    throw new SsrfError("Invalid port");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) {
    throw new SsrfError("Invalid hostname");
  }

  if (isPrivateHostname(hostname)) {
    throw new SsrfError(`Blocked hostname: ${hostname}`);
  }

  if (looksLikeIpv4(hostname)) {
    if (isBlockedIpv4(hostname)) {
      throw new SsrfError(`Blocked IP: ${hostname}`);
    }
    return result(parsed, hostname, port);
  }

  if (looksLikeIpv6(hostname) && hostname.includes(":")) {
    const ip = normalizeIpv6(hostname);
    if (!ip || isBlockedIpv6(hostname)) {
      throw new SsrfError(`Blocked IP: ${hostname}`);
    }
    return result(parsed, hostname, port);
  }

// DNS resolution + rebinding guard
  let addresses: LookupAddress[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfError(`Hostname did not resolve: ${hostname}`);
  }
  if (addresses.length === 0) {
    throw new SsrfError("Hostname did not resolve");
  }
  for (const entry of addresses) {
    if (entry.family === 4 && isBlockedIpv4(entry.address)) {
      throw new SsrfError(`Blocked resolved IP: ${entry.address} (${hostname})`);
    }
    if (entry.family === 6 && isBlockedIpv6(entry.address)) {
      throw new SsrfError(`Blocked resolved IP: ${entry.address} (${hostname})`);
    }
  }

  return result(parsed, hostname, port);
}

function result(parsed: URL, hostname: string, port: number): ValidatedUrl {
  const protocol = parsed.protocol as "http:" | "https:";
  const normalized = new URL(parsed);
  normalized.hostname = hostname;
  normalized.port = String(port);
  return {
    protocol,
    hostname,
    port,
    url: normalized.toString(),
    pathname: parsed.pathname,
    search: parsed.search,
  };
}

export function buildTargetRequestUrl(v: ValidatedUrl): string {
  return `${v.protocol}//${v.hostname}:${v.port}${v.pathname}${v.search}`;
}

export function isBlockedAddress(addr: string): boolean {
  if (looksLikeIpv4(addr)) return isBlockedIpv4(addr);
  if (looksLikeIpv6(addr)) return isBlockedIpv6(addr);
  return false;
}
