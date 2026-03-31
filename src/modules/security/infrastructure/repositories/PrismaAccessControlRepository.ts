import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessControlRepository } from '../../domain/contracts';
import type { ModuleCode } from '../../domain/types';
import { MODULE_REGISTRY } from '@/shared/modules';

const ALWAYS_ON_MODULES = new Set<ModuleCode>(
  MODULE_REGISTRY.filter((mod) => mod.defaultEnabled).map((mod) => mod.code as ModuleCode)
);

const LEGACY_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  AUDIT_MANAGER: ['audit.*', 'governance.profiles.read', 'governance.profiles.write', 'governance.snapshots.write'],
  AUDITOR: ['audit.*', 'governance.profiles.read'],
  RISK_MANAGER: ['risk.*', 'structural-risk.*', 'linear-risk.*', 'governance.profiles.read'],
  VIEWER: ['governance.profiles.read', 'risk.read', 'structural-risk.read', 'linear-risk.read', 'audit.findings.read'],
};

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

async function resolveUserRoleCodes(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ role_code: string | null }[]>(
    Prisma.sql`
      SELECT r.role_code
      FROM security.user_x_rbac ur
      JOIN security.security_rbac r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}::uuid
        AND COALESCE(ur.is_active, true) = true
        AND COALESCE(r.is_active, true) = true
    `
  );

  return rows
    .map((row) => row.role_code)
    .filter((code): code is string => Boolean(code));
}

export class PrismaAccessControlRepository implements AccessControlRepository {
  async userBelongsToCompany(userId: string, companyId: string): Promise<boolean> {
    try {
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
      if (rows.length > 0) return true;
    } catch (error) {
      if (!isMissingRelationError(error, 'security.company_user')) throw error;
    }

    const legacyRows = await prisma.$queryRaw<{ ok: number }[]>(
      Prisma.sql`
        SELECT 1 AS ok
        FROM security.security_users u
        WHERE u.id = ${userId}::uuid
          AND u.tenant_id = ${companyId}::uuid
          AND COALESCE(u.is_active, true) = true
        LIMIT 1
      `
    );
    return legacyRows.length > 0;
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

    try {
      const rows = await prisma.$queryRaw<{ ok: number }[]>(
        Prisma.sql`
          SELECT 1 AS ok
          FROM security.user_role ur
          JOIN security.role_permission rp ON rp.role_id = ur.role_id
          JOIN security.permission p ON p.id = rp.permission_id
          WHERE ur.user_id = ${userId}::uuid
            AND ur.company_id = ${companyId}::uuid
            AND COALESCE(ur.is_active, true) = true
            AND COALESCE(rp.is_active, true) = true
            AND COALESCE(p.is_active, true) = true
            AND p.code IN (${Prisma.join(permissionCandidates)})
          LIMIT 1
        `
      );
      if (rows.length > 0) return true;
    } catch (error) {
      if (
        !isMissingRelationError(error, 'security.user_role') &&
        !isMissingRelationError(error, 'security.role_permission') &&
        !isMissingRelationError(error, 'security.permission')
      ) {
        throw error;
      }
    }

    try {
      const rows = await prisma.$queryRaw<{ ok: number }[]>(
        Prisma.sql`
          SELECT 1 AS ok
          FROM security.user_x_rbac ur
          JOIN security.security_rbac r ON r.id = ur.role_id
          JOIN security.security_users u ON u.id = ur.user_id
          WHERE ur.user_id = ${userId}::uuid
            AND u.tenant_id = ${companyId}::uuid
            AND COALESCE(ur.is_active, true) = true
            AND COALESCE(r.is_active, true) = true
            AND (
              r.role_code = 'ADMIN'
              OR r.permission_code IN (${Prisma.join(permissionCandidates)})
            )
          LIMIT 1
        `
      );

      if (rows.length > 0) return true;

      // Legacy compatibility: derive permissions from role code map when permission_code is not populated.
      const roleCodes = await resolveUserRoleCodes(userId);
      return roleCodes.some((role) => {
        const grants = LEGACY_ROLE_PERMISSIONS[role] ?? [];
        if (grants.includes('*')) return true;
        if (grants.includes(permission)) return true;
        const modulePrefix = permission.split('.')[0];
        return grants.includes(`${modulePrefix}.*`);
      });
    } catch (error) {
      if (
        isMissingRelationError(error, 'security.user_x_rbac') ||
        isMissingRelationError(error, 'security.security_rbac')
      ) {
        return false;
      }
      throw error;
    }
  }
}
