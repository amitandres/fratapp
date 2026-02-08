import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

// Runtime uses pooled connection (POSTGRES_URL from Vercel/Neon integration)
const connectionString =
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL;

// Add connect_timeout for Neon cold starts (scales to zero after 5min idle)
const finalConnectionString = connectionString
  ? `${connectionString}${connectionString.includes("?") ? "&" : "?"}connect_timeout=15`
  : undefined;

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: finalConnectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
