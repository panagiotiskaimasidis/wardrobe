import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 ships the new query compiler and requires a driver adapter. We use
 * better-sqlite3 for zero-setup local dev. The `url` is resolved relative to
 * the project root (process.cwd()), which matches where the Prisma CLI creates
 * the SQLite file. To move to Postgres, swap this adapter for `@prisma/adapter-pg`
 * and change the datasource provider in prisma/schema.prisma.
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
