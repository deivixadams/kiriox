import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessControlRepository } from '../../domain/contracts';
import type { ModuleCode } from '../../domain/types';
import { MODULE_REGISTRY } from '@/shared/modules';

const ALWAYS_ON_MODULES = new Set<ModuleCode>(
  MODULE_REGISTRY.filter((mod) => mod.defaultEnabled).map((mod) => mod.code as ModuleCode)
);

function isMissingRelationError(error: unknown, relation: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = String((error as any).message || '');
  return msg.includes(`relation "${relation}" does not exist`);
}

function expandModuleAliases(module: ModuleCode): string[] {
  if (module === 'structural-risk') return ['structural-risk', 'risk'];
  if (module === 'linear-risk') return ['linear-risk', 'risk'];
  return [module];
}

function buildPermissionCandidates(permission: string): string[] {
  const candidates = new Set<string>();
  candidates.add('*');
  candidates.add(permission);

  const parts = permission.split('.');
  if (parts.length > 1) {
    candidates.add(`${parts[0]}.*`);
    if (parts[0] === 'structural-risk' || parts[0] === 'linear-risk') {
      candidates.add(`risk.${parts.slice(1).join('.')}`);
      candidates.add('risk.*');
    }
  }

  return Array.from(candidates);
}

export class PrismaAccessControlRepository implements AccessControlRepository {
  async userBelongsToCompany(userId: string, companyId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ ok: number }[]>(
      Prisma.sql`
        SELECT 1 AS ok
        FROM security.company_user cu
        WHERE cu.user_id = ${userId}::uuid
          AND cu.company_id = ${companyId}::uuid
          AND COALESCE(cu.is_active, true) = true
        LIMIT 1
      `
    );
    return rows.length > 0;
  }

  async isModuleEnabled(companyId: string, module: ModuleCode): Promise<boolean> {
    try {
      const moduleCandidates = expandModuleAliases(module);
      const statusAllowed = ['active', 'trial', 'grace'];

      const rows = await prisma.$queryRaw<{ ok: number }[]>(
        Prisma.sql`
          SELECT 1 AS ok
          FROM security.company_module cm
          WHERE cm.company_id = ${companyId}::uuid
            AND cm.module_code IN (${Prisma.join(moduleCandidates)})
            AND COALESCE(cm.is_enabled, false) = true
            AND (
              cm.license_status IS NULL
              OR LOWER(cm.license_status) IN (${Prisma.join(statusAllowed)})
            )
            AND (cm.starts_at IS NULL OR cm.starts_at <= NOW())
            AND (cm.ends_at IS NULL OR cm.ends_at >= NOW())
          LIMIT 1
        `
      );

      return rows.length > 0;
    } catch (error) {
      if (isMissingRelationError(error, 'security.company_module')) {
        // Backward compatibility while old environments are migrated.
        if (ALWAYS_ON_MODULES.has(module)) return true;
        return process.env.SECURITY_STRICT_MODULE_LICENSE === '1' ? false : true;
      }
      throw error;
    }
  }

  async hasPermission(userId: string, companyId: string, permission: string): Promise<boolean> {
    const permissionCandidates = buildPermissionCandidates(permission);

    const rows = await prisma.$queryRaw<{ ok: number }[]>(
      Prisma.sql`
        SELECT 1 AS ok
        FROM security.company_user_role cur
        JOIN security.role_permission rp ON rp.role_id = cur.role_id
        JOIN security.permission p ON p.code = rp.permission_code
        WHERE cur.user_id = ${userId}::uuid
          AND cur.company_id = ${companyId}::uuid
          AND COALESCE(cur.is_active, true) = true
          AND COALESCE(rp.is_active, true) = true
          AND COALESCE(p.is_active, true) = true
          AND p.code IN (${Prisma.join(permissionCandidates)})
        LIMIT 1
      `
    );
    return rows.length > 0;
  }
}
