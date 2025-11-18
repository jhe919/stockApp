// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Extend the global object to store a single PrismaClient instance in dev
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Create or reuse a PrismaClient instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"], // log useful info in dev
  });

// In development, store the client on globalThis to avoid creating many clients
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
