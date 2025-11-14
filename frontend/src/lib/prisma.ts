// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Next.js の開発サーバー (HMR) で
// PrismaClient のインスタンスが際限なく増えるのを防ぐための
// 標準的なおまじない
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // (オプション：全てのクエリをログに出す場合)
    // log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
