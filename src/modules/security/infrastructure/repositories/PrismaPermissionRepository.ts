import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";
import { MODULE_REGISTRY } from "@/shared/modules";

type PermissionRow = { id: string; code: string };

function inferAction(permissionCode: string): string {
  const parts = permissionCode.split(".");
  return parts[parts.length - 1] || "read";
}

export class PrismaPermissionRepository {
  async ensurePermission(input: {
    code: string;
    moduleCode: string;
    action: string;
    description?: string;
  }): Promise<PermissionRow> {
    const rows = await prisma.$queryRaw<PermissionRow[]>(
      Prisma.sql`
        INSERT INTO security.permission (code, module_code, action, description, is_active)
        VALUES (
          ${input.code},
          ${input.moduleCode},
          ${input.action},
          ${input.description ?? null},
          true
        )
        ON CONFLICT (code)
        DO UPDATE SET
          module_code = EXCLUDED.module_code,
          action = EXCLUDED.action,
          description = EXCLUDED.description,
          is_active = true,
          updated_at = now()
        RETURNING id, code
      `
    );
    return rows[0];
  }

  async syncPermissionsFromRegistry(): Promise<void> {
    for (const moduleDef of MODULE_REGISTRY) {
      for (const permissionCode of moduleDef.permissions) {
        await this.ensurePermission({
          code: permissionCode,
          moduleCode: moduleDef.code,
          action: inferAction(permissionCode),
        });
      }
    }
  }

  async getPermissionIdsByCode(permissionCodes: string[]): Promise<Map<string, string>> {
    if (permissionCodes.length === 0) return new Map();

    const rows = await prisma.$queryRaw<{ id: string; code: string }[]>(
      Prisma.sql`
        SELECT id, code
        FROM security.permission
        WHERE code IN (${Prisma.join(permissionCodes)})
      `
    );

    return new Map(rows.map((row) => [row.code, row.id]));
  }

  async attachPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    for (const permissionId of permissionIds) {
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO security.role_permission (role_id, permission_id, is_active)
          VALUES (${roleId}::uuid, ${permissionId}::uuid, true)
          ON CONFLICT (role_id, permission_id)
          DO UPDATE SET
            is_active = true,
            updated_at = now()
        `
      );
    }
  }
}

