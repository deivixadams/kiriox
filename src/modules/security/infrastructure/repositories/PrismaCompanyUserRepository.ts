import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";

export class PrismaCompanyUserRepository {
  async ensureMembership(companyId: string, userId: string): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO core.map_user_x_company (company_id, user_id, is_active)
        VALUES (${companyId}::uuid, ${userId}::uuid, true)
        ON CONFLICT (company_id, user_id)
        DO UPDATE SET
          is_active = true,
          updated_at = now()
      `
    );
  }
}
