import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContextRepository } from '../../domain/contracts';
import type { AccessContext, ModuleCode } from '../../domain/types';
import { MODULE_REGISTRY } from '@/shared/modules';

const ALWAYS_ON_MODULES: ModuleCode[] = MODULE_REGISTRY
  .filter((mod) => mod.defaultEnabled)
  .map((mod) => mod.code as ModuleCode);

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

function normalizeModule(code: string): ModuleCode {
  if (code === 'risk') return 'structural-risk';
  return code as ModuleCode;
}

async function loadRoleCodes(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ role_code: string | null }[]>(
    Prisma.sql`
      SELECT DISTINCT r.role_code
      FROM security.user_x_rbac ur
      JOIN security.security_rbac r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}::uuid
        AND COALESCE(ur.is_active, true) = true
        AND COALESCE(r.is_active, true) = true
    `
  );

  return rows.map((row) => row.role_code).filter((code): code is string => Boolean(code));
}

export class PrismaAccessContextRepository implements AccessContextRepository {
  async getAccessContext(input: {
    userId: string;
    companyId: string;
    fallbackEmail?: string;
  }): Promise<AccessContext> {
    const [user, company, enabledModules, permissions] = await Promise.all([
      this.loadUser(input.userId, input.fallbackEmail),
      this.loadCompany(input.companyId),
      this.getEnabledModules(input.companyId),
      this.getPermissions(input.userId, input.companyId),
    ]);

    return {
      user,
      company,
      enabledModules,
      permissions,
    };
  }

  async getEnabledModules(companyId: string): Promise<ModuleCode[]> {
    try {
      const rows = await prisma.$queryRaw<{ module_code: string }[]>(
        Prisma.sql`
          SELECT DISTINCT cm.module_code
          FROM security.company_module cm
          WHERE cm.company_id = ${companyId}::uuid
            AND COALESCE(cm.is_enabled, false) = true
            AND (
              cm.license_status IS NULL
              OR LOWER(cm.license_status) IN ('active', 'trial', 'grace')
            )
            AND (cm.starts_at IS NULL OR cm.starts_at <= NOW())
            AND (cm.ends_at IS NULL OR cm.ends_at >= NOW())
        `
      );

      const normalized = rows.map((row) => normalizeModule(row.module_code));
      const merged = new Set<ModuleCode>([...ALWAYS_ON_MODULES, ...normalized]);
      return Array.from(merged);
    } catch (error) {
      if (isMissingRelationError(error, 'security.company_module')) {
        return process.env.SECURITY_STRICT_MODULE_LICENSE === '1'
          ? [...ALWAYS_ON_MODULES]
          : [...ALWAYS_ON_MODULES, 'linear-risk', 'structural-risk', 'audit', 'alerts', 'simulation'];
      }
      throw error;
    }
  }

  async getPermissions(userId: string, companyId: string): Promise<string[]> {
    try {
      const rows = await prisma.$queryRaw<{ code: string }[]>(
        Prisma.sql`
          SELECT DISTINCT p.code
          FROM security.user_role ur
          JOIN security.role_permission rp ON rp.role_id = ur.role_id
          JOIN security.permission p ON p.id = rp.permission_id
          WHERE ur.user_id = ${userId}::uuid
            AND ur.company_id = ${companyId}::uuid
            AND COALESCE(ur.is_active, true) = true
            AND COALESCE(rp.is_active, true) = true
            AND COALESCE(p.is_active, true) = true
        `
      );

      return rows.map((row) => row.code).filter(Boolean);
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
      const rows = await prisma.$queryRaw<{ permission_code: string | null }[]>(
        Prisma.sql`
          SELECT DISTINCT r.permission_code
          FROM security.user_x_rbac ur
          JOIN security.security_rbac r ON r.id = ur.role_id
          JOIN security.security_users u ON u.id = ur.user_id
          WHERE ur.user_id = ${userId}::uuid
            AND u.tenant_id = ${companyId}::uuid
            AND COALESCE(ur.is_active, true) = true
            AND COALESCE(r.is_active, true) = true
        `
      );

      const fromDb = rows
        .map((row) => row.permission_code)
        .filter((code): code is string => Boolean(code));

      if (fromDb.length > 0) return fromDb;
    } catch (error) {
      if (
        !isMissingRelationError(error, 'security.user_x_rbac') &&
        !isMissingRelationError(error, 'security.security_rbac')
      ) {
        throw error;
      }
    }

    const roleCodes = await loadRoleCodes(userId);
    const permissionSet = new Set<string>();
    for (const roleCode of roleCodes) {
      (LEGACY_ROLE_PERMISSIONS[roleCode] ?? []).forEach((perm) => permissionSet.add(perm));
    }

    return Array.from(permissionSet);
  }

  private async loadUser(userId: string, fallbackEmail?: string) {
    const rows = await prisma.$queryRaw<{ id: string; name: string | null; email: string | null }[]>(
      Prisma.sql`
        SELECT u.id, u.name, u.email
        FROM security.security_users u
        WHERE u.id = ${userId}::uuid
        LIMIT 1
      `
    );

    const row = rows[0];
    return {
      id: userId,
      name: row?.name || 'Usuario',
      email: row?.email || fallbackEmail || '',
    };
  }

  private async loadCompany(companyId: string) {
    const rows = await prisma.$queryRaw<{ id: string; code: string | null; name: string | null }[]>(
      Prisma.sql`
        SELECT c.id, c.code, c.name
        FROM corpus.company c
        WHERE c.id = ${companyId}::uuid
        LIMIT 1
      `
    );

    const row = rows[0];
    return {
      id: companyId,
      code: row?.code || '',
      name: row?.name || 'Empresa',
    };
  }
}
