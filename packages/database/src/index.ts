import path from "node:path";
import type { PrismaClient as SqliteClient } from "../../generated/sqlite/index.js";

function isSqlite(url: string): boolean {
  return url.startsWith("file:");
}

export type SharedPrismaClient = SqliteClient;

function resolveSqliteUrl(raw: string): string {
  // Prisma SQLite URLs accept a file path; resolve relative ones against the
  // current working directory so bundling (Next.js webpack) cannot break them.
  const tail = raw.slice("file:".length);
  if (path.isAbsolute(tail)) return raw;
  const absolute = path.resolve(process.cwd(), tail);
  return `file:${absolute.replace(/\\/g, "/")}`;
}

function buildClient(): SharedPrismaClient {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and set it.",
    );
  }
  if (isSqlite(rawUrl)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("../../generated/sqlite/index.js") as typeof import("../../generated/sqlite/index");
    return new PrismaClient({ datasourceUrl: resolveSqliteUrl(rawUrl) });
  }
  // schemas are identical; the postgres client satisfies the same API shape
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("../../generated/postgres/index.js") as typeof import("../../generated/postgres/index");
  return new PrismaClient() as unknown as SharedPrismaClient;
}

const globalForPrisma = globalThis as unknown as { prisma?: SharedPrismaClient };

export const prisma: SharedPrismaClient = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}