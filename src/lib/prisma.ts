import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { dbConnectionConfig } from "@/lib/db-ssl";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg(dbConnectionConfig({ DATABASE_URL: process.env.DATABASE_URL, DATABASE_CA_CERT: process.env.DATABASE_CA_CERT }));

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
