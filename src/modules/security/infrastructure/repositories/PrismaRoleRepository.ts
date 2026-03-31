import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";

type RoleRow = { id: string; code: string };

export class PrismaRoleRepository {
  async ensureRole(input: {
    code: string;
    name: string;
    description?: string;
  }): Promise<RoleRow> {
    const rows = await prisma.$queryRaw<RoleRow[]>(
      Prisma.sql`
        INSERT INTO security.role (code, name, description, is_active)
        VALUES (
          ${input.code},
          ${input.name},
          ${input.description ?? null},
          true
        )
        ON CONFLICT (code)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_active = true,
          updated_at = now()
        RETURNING id, code
      `
    );
    return rows[0];
  }

  async getRoleByCode(code: string): Promise<RoleRow | null> {
    const rows = await prisma.$queryRaw<RoleRow[]>(
      Prisma.sql`
        SELECT id, code
        FROM security.role
        WHERE code = ${code}
        LIMIT 1
      `
    );
    return rows[0] ?? null;
  }

  async assignUserRole(input: {
    userId: string;
    companyId: string;
    roleId: string;
  }): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO security.user_role (user_id, company_id, role_id, is_active)
        VALUES (
          ${input.userId}::uuid,
          ${input.companyId}::uuid,
          ${input.roleId}::uuid,
          true
        )
        ON CONFLICT (user_id, company_id, role_id)
        DO UPDATE SET
          is_active = true,
          updated_at = now()
      `
    );
  }
}

