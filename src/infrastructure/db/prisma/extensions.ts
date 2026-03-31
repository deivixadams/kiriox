import type { PrismaClient } from "@prisma/client";

export function withDefaultExtensions<T extends PrismaClient>(client: T): T {
  // Punto único para registrar Prisma extensions cuando sea necesario.
  return client;
}
