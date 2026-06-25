import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 ships the new query compiler and requires a driver adapter. The
 * adapter is chosen from the connection string so the same code runs on:
 *   - SQLite for zero-setup local dev (`file:./dev.db`), and
 *   - PostgreSQL in production (`postgres://…` / `postgresql://…`).
 *
 * When deploying to Postgres, also generate/push with the Postgres schema
 * (`prisma/schema.postgres.prisma`) — see `npm run vercel-build` and the README.
 */
export function makePrismaAdapter(url: string) {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return new PrismaPg({ connectionString: url });
  }
  return new PrismaBetterSqlite3({ url });
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  return new PrismaClient({ adapter: makePrismaAdapter(url) });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
