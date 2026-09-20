import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateTargetUrl,
  isBlockedAddress,
  SsrfError,
  newPublicId,
  newToken,
  buildCurl,
  buildRawRequest,
} from "../dist/index.js";

test("blocks private IPv4 literal", async () => {
  await assert.rejects(
    () => validateTargetUrl("http://192.168.1.1/x"),
    (e) => e instanceof SsrfError && /Blocked IP/.test(e.message),
  );
});

test("blocks loopback", async () => {
  await assert.rejects(
    () => validateTargetUrl("http://127.0.0.1/"),
    SsrfError,
  );
  await assert.rejects(() => validateTargetUrl("http://localhost/"), SsrfError);
  await assert.rejects(() => validateTargetUrl("http://[::1]/"), SsrfError);
});

test("blocks cloud metadata endpoint", async () => {
  await assert.rejects(
    () => validateTargetUrl("http://169.254.169.254/latest/meta-data"),
    SsrfError,
  );
});

test("blocks IPv6 link-local and ULA", () => {
  assert.equal(isBlockedAddress("fe80::1"), true);
  assert.equal(isBlockedAddress("fc00::1"), true);
  assert.equal(isBlockedAddress("fd12::1"), true);
});

test("blocks IPv4-mapped IPv6", () => {
  assert.equal(isBlockedAddress("::ffff:192.168.1.1"), true);
  assert.equal(isBlockedAddress("::ffff:8.8.8.8"), false);
});

test("allows public IPv4 literal", async () => {
  const v = await validateTargetUrl("http://8.8.8.8/health");
  assert.equal(v.hostname, "8.8.8.8");
});

test("rejects non-http protocols", async () => {
  await assert.rejects(
    () => validateTargetUrl("file:///etc/passwd"),
    (e) => e instanceof SsrfError && /protocols/.test(e.message),
  );
  await assert.rejects(() => validateTargetUrl("ftp://example.com/"), SsrfError);
});

test("rejects private hostname words", async () => {
  await assert.rejects(() => validateTargetUrl("http://myhost.local/"), SsrfError);
  await assert.rejects(
    () => validateTargetUrl("http://internal.hookbox/"),
    SsrfError,
  );
});

test("id/token generators produce distinct values", () => {
  const a = newPublicId();
  const b = newPublicId();
  assert.equal(a.length, 8);
  assert.notEqual(a, b);
  assert.equal(newToken().length, 48);
});

test("curl builder", () => {
  const curl = buildCurl({
    url: "https://example.com/w",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"a":1}',
  });
  assert.match(curl, /^curl/);
  assert.match(curl, /-X POST/);
  assert.match(curl, /Content-Type: application\/json/);
  assert.match(curl, /--data/);
});

test("raw request builder", () => {
  const raw = buildRawRequest({
    method: "POST",
    url: "https://example.com/w?q=1",
    headers: { "Content-Type": "application/json" },
    body: '{"a":1}',
  });
  assert.match(raw, /POST \/w\?q=1 HTTP\/1.1/);
  assert.match(raw, /Host: example.com/);
});