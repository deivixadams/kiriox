import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { isDevAuthBypassEnabled } from '@/lib/auth-server';
import type { AccessContextRepository } from '../../domain/contracts';
import type { AccessContext, ModuleCode } from '../../domain/types';
import { MODULE_REGISTRY } from '@/shared/modules';

const ALWAYS_ON_MODULES: ModuleCode[] = MODULE_REGISTRY
  .filter((mod) => mod.defaultEnabled)
  .map((mod) => mod.code as ModuleCode);

function isMissingRelationError(error: unknown, relation: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = String((error as any).message || '');
  return msg.includes(`relation "${relation}" does not exist`);
}

function normalizeModule(code: string): ModuleCode {
  if (code === 'risk') return 'structural-risk';
  return code as ModuleCode;
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
    if (isDevAuthBypassEnabled()) {
      return MODULE_REGISTRY.map((moduleDef) => moduleDef.code as ModuleCode);
    }

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
    if (isDevAuthBypassEnabled()) {
      return ['*'];
    }

    const rows = await prisma.$queryRaw<{ code: string }[]>(
      Prisma.sql`
        SELECT DISTINCT p.code
        FROM security.company_user_role cur
        JOIN security.role_permission rp ON rp.role_id = cur.role_id
        JOIN security.permission p ON p.code = rp.permission_code
        WHERE cur.user_id = ${userId}::uuid
          AND cur.company_id = ${companyId}::uuid
          AND COALESCE(cur.is_active, true) = true
          AND COALESCE(rp.is_active, true) = true
          AND COALESCE(p.is_active, true) = true
      `
    );

    const permissions = rows.map((row) => row.code).filter(Boolean);

    const superAdminRole = await prisma.$queryRaw<{ ok: number }[]>(
      Prisma.sql`
        SELECT 1 AS ok
        FROM security.company_user_role cur
        JOIN security.role r ON r.id = cur.role_id
        WHERE cur.user_id = ${userId}::uuid
          AND cur.company_id = ${companyId}::uuid
          AND COALESCE(cur.is_active, true) = true
          AND COALESCE(r.is_active, true) = true
          AND LOWER(r.code) IN ('super_admin', 'admin')
        LIMIT 1
      `
    );

    if (superAdminRole.length > 0) {
      return ['*', ...permissions];
    }

    return permissions;
  }

  private async loadUser(userId: string, fallbackEmail?: string) {
    let rows: { id: string; name: string | null; email: string | null }[] = [];
    try {
      rows = await prisma.$queryRaw<{ id: string; name: string | null; email: string | null }[]>(
        Prisma.sql`
          SELECT u.id, u.name, u.email
          FROM security.security_users u
          WHERE u.id = ${userId}::uuid
          LIMIT 1
        `
      );
    } catch (error) {
      if (!isMissingRelationError(error, 'security.security_users')) {
        throw error;
      }
    }

    const row = rows[0];
    return {
      id: userId,
      name: row?.name || 'Usuario',
      email: row?.email || fallbackEmail || '',
    };
  }

  private async loadCompany(companyId: string) {
    let rows: { id: string; code: string | null; name: string | null }[] = [];
    try {
      rows = await prisma.$queryRaw<{ id: string; code: string | null; name: string | null }[]>(
        Prisma.sql`
          SELECT c.id, c.code, c.name
          FROM core.company c
          WHERE c.id = ${companyId}::uuid
            AND COALESCE(c.is_active, true) = true
          LIMIT 1
        `
      );
    } catch (error) {
      if (!isMissingRelationError(error, 'core.company')) throw error;
    }

    const row = rows[0];
    return {
      id: companyId,
      code: row?.code || '',
      name: row?.name || 'Empresa',
    };
  }
}

