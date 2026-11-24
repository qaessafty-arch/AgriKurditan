import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // DATABASE_URL wins; otherwise use the pooled URL that Vercel's Postgres integrations (Supabase, Neon) provide.
    datasourceUrl: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
