import { randomBytes, randomUUID } from "node:crypto";

export function newUuid(): string {
  return randomUUID();
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomString(bytes: number): string {
  const buf = randomBytes(bytes);
  let out = "";
  for (const b of buf) {
    out += ALPHABET[b % ALPHABET.length];
  }
  return out;
}

export function newPublicId(bytes = 8): string {
  return randomString(bytes);
}

export function newToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}
