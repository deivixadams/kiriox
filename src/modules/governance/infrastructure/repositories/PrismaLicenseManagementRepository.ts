import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { MODULE_REGISTRY, resolveModuleDependencies } from '@/shared/modules';
import type { LicenseManagementRepository } from '@/modules/governance/domain/contracts';
import type {
  CompanyLicenseEvent,
  CompanyLicenseRecord,
  LicenseDashboard,
  PlanLimits,
  RenewLicenseInput,
  UploadLicenseInput,
  ValidateLicenseResult,
} from '@/modules/governance/domain/types';

const CORE_ALWAYS_ON = new Set(
  MODULE_REGISTRY.filter((moduleDef) => moduleDef.defaultEnabled).map((moduleDef) => moduleDef.code)
);

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.toISOString();
}

function mapLimits(row: any): PlanLimits {
  return {
    maxUsers: row.max_users === null ? null : Number(row.max_users),
    maxRunsMonthly: row.max_runs_monthly === null ? null : Number(row.max_runs_monthly),
    maxStorageGb: row.max_storage_gb === null ? null : Number(row.max_storage_gb),
    maxModules: row.max_modules === null ? null : Number(row.max_modules),
  };
}

function mapLicense(row: any): CompanyLicenseRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    planCode: row.plan_code,
    planName: row.plan_name,
    licenseKey: row.license_key,
    status: row.status,
    issuedAt: toIso(row.issued_at),
    expiresAt: toIso(row.expires_at) ?? new Date(0).toISOString(),
    validatedAt: toIso(row.validated_at),
    allowedModules: Array.isArray(row.allowed_modules) ? row.allowed_modules : [],
    fileName: row.file_name,
    filePath: row.file_path,
    fileHash: row.file_hash,
    limits: mapLimits(row),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdBy: row.created_by,
    createdAt: toIso(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date(0).toISOString(),
  };
}

function mapEvent(row: any): CompanyLicenseEvent {
  return {
    id: row.id,
    companyId: row.company_id,
    licenseId: row.license_id,
    eventType: row.event_type,
    eventStatus: row.event_status,
    notes: row.notes,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    performedBy: row.performed_by,
    createdAt: toIso(row.created_at) ?? new Date(0).toISOString(),
  };
}

function resolveLicensedModules(inputModules: string[]): string[] {
  const result = new Set<string>();

  for (const coreModule of CORE_ALWAYS_ON) {
    result.add(coreModule);
  }

  for (const moduleCode of inputModules) {
    if (!moduleCode) continue;
    try {
      resolveModuleDependencies(moduleCode).forEach((dep) => result.add(dep));
    } catch {
      // Ignore unknown modules from file and keep processing known ones.
    }
  }

  return Array.from(result);
}

function computeExpirationStatus(currentLicense: CompanyLicenseRecord | null): LicenseDashboard['expirationStatus'] {
  if (!currentLicense) return 'missing';
  const expiresAt = new Date(currentLicense.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) return 'expired';
  return expiresAt.getTime() >= Date.now() ? 'valid' : 'expired';
}

export class PrismaLicenseManagementRepository implements LicenseManagementRepository {
  async getDashboard(companyId: string): Promise<LicenseDashboard> {
    const [licenseRows, eventRows, moduleRows] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          id,
          company_id,
          plan_code,
          plan_name,
          license_key,
          status,
          issued_at,
          expires_at,
          validated_at,
          allowed_modules,
          file_name,
          file_path,
          file_hash,
          max_users,
          max_runs_monthly,
          max_storage_gb,
          max_modules,
          metadata,
          created_by,
          created_at,
          updated_at
        FROM security.company_license
        WHERE company_id = ${companyId}::uuid
        ORDER BY created_at DESC
        LIMIT 1
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          id,
          company_id,
          license_id,
          event_type,
          event_status,
          notes,
          payload,
          performed_by,
          created_at
        FROM security.company_license_event
        WHERE company_id = ${companyId}::uuid
        ORDER BY created_at DESC
        LIMIT 50
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT module_code
        FROM security.company_module
        WHERE company_id = ${companyId}::uuid
          AND COALESCE(is_enabled, false) = true
          AND (
            license_status IS NULL OR LOWER(license_status) IN ('active', 'trial', 'grace')
          )
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at IS NULL OR ends_at >= now())
        ORDER BY module_code
      `),
    ]);

    const currentLicense = licenseRows[0] ? mapLicense(licenseRows[0]) : null;
    const enabledModules = moduleRows.map((row) => String(row.module_code));

    return {
      currentLicense,
      enabledModules,
      planLimits: currentLicense?.limits ?? null,
      expirationStatus: computeExpirationStatus(currentLicense),
      history: eventRows.map(mapEvent),
    };
  }

  async uploadLicense(input: UploadLicenseInput): Promise<LicenseDashboard> {
    const licensedModules = resolveLicensedModules(input.allowedModules);

    if (input.limits.maxModules !== null && input.limits.maxModules !== undefined) {
      if (licensedModules.length > input.limits.maxModules) {
        throw new Error(`Licensed modules (${licensedModules.length}) exceed max_modules (${input.limits.maxModules})`);
      }
    }

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO security.company_license (
        company_id,
        plan_code,
        plan_name,
        license_key,
        status,
        issued_at,
        expires_at,
        allowed_modules,
        file_name,
        file_path,
        file_hash,
        max_users,
        max_runs_monthly,
        max_storage_gb,
        max_modules,
        metadata,
        created_by,
        validated_at,
        created_at,
        updated_at
      )
      VALUES (
        ${input.companyId}::uuid,
        ${input.planCode},
        ${input.planName},
        ${input.licenseKey ?? null},
        'uploaded',
        ${input.issuedAt ? new Date(input.issuedAt) : null},
        ${new Date(input.expiresAt)},
        ${licensedModules},
        ${input.fileName},
        ${input.filePath},
        ${input.fileHash},
        ${input.limits.maxUsers},
        ${input.limits.maxRunsMonthly},
        ${input.limits.maxStorageGb},
        ${input.limits.maxModules},
        ${input.metadata ?? {}},
        ${input.performedBy}::uuid,
        NULL,
        now(),
        now()
      )
      RETURNING id
    `);

    const licenseId = rows[0]?.id as string | undefined;

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO security.company_license_event (
        company_id,
        license_id,
        event_type,
        event_status,
        notes,
        payload,
        performed_by,
        created_at
      )
      VALUES (
        ${input.companyId}::uuid,
        ${licenseId ?? null}::uuid,
        'upload',
        'success',
        'License file uploaded',
        ${{
          fileName: input.fileName,
          planCode: input.planCode,
          expiresAt: input.expiresAt,
          allowedModules: licensedModules,
        }},
        ${input.performedBy}::uuid,
        now()
      )
    `);

    return this.getDashboard(input.companyId);
  }

  async validateCurrentLicense(companyId: string, performedBy: string): Promise<ValidateLicenseResult> {
    const dashboard = await this.getDashboard(companyId);
    const current = dashboard.currentLicense;

    if (!current) {
      return {
        valid: false,
        reason: 'No license uploaded for this company',
        currentLicense: null,
      };
    }

    const expiresAt = new Date(current.expiresAt);
    const expired = Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now();
    const missingModules = !Array.isArray(current.allowedModules) || current.allowedModules.length === 0;

    const valid = !expired && !missingModules;
    const reason = valid
      ? 'License is valid'
      : expired
      ? 'License expired'
      : 'License does not declare enabled modules';

    const nextStatus = valid ? 'active' : 'invalid';

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE security.company_license
        SET status = ${nextStatus},
            validated_at = now(),
            updated_at = now()
        WHERE id = ${current.id}::uuid
      `);

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO security.company_license_event (
          company_id,
          license_id,
          event_type,
          event_status,
          notes,
          payload,
          performed_by,
          created_at
        )
        VALUES (
          ${companyId}::uuid,
          ${current.id}::uuid,
          'validate',
          ${valid ? 'success' : 'failed'},
          ${reason},
          ${{
            expiresAt: current.expiresAt,
            allowedModules: current.allowedModules,
          }},
          ${performedBy}::uuid,
          now()
        )
      `);

      if (valid) {
        const resolvedModules = resolveLicensedModules(current.allowedModules);

        for (const moduleCode of resolvedModules) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO security.company_module (
              company_id,
              module_code,
              is_enabled,
              license_status,
              starts_at,
              ends_at,
              metadata,
              created_at,
              updated_at
            )
            VALUES (
              ${companyId}::uuid,
              ${moduleCode},
              true,
              'active',
              now(),
              ${new Date(current.expiresAt)},
              ${{}},
              now(),
              now()
            )
            ON CONFLICT (company_id, module_code)
            DO UPDATE SET
              is_enabled = EXCLUDED.is_enabled,
              license_status = EXCLUDED.license_status,
              starts_at = EXCLUDED.starts_at,
              ends_at = EXCLUDED.ends_at,
              updated_at = now()
          `);
        }
      }
    });

    const refreshed = await this.getDashboard(companyId);

    return {
      valid,
      reason,
      currentLicense: refreshed.currentLicense,
    };
  }

  async renewLicense(input: RenewLicenseInput): Promise<LicenseDashboard> {
    const dashboard = await this.getDashboard(input.companyId);
    const current = dashboard.currentLicense;

    if (!current) {
      throw new Error('No current license found. Upload a license first.');
    }

    const mergedModules = input.allowedModules && input.allowedModules.length > 0
      ? input.allowedModules
      : current.allowedModules;

    const resolvedModules = resolveLicensedModules(mergedModules);

    const mergedLimits: PlanLimits = {
      maxUsers: input.limits?.maxUsers ?? current.limits.maxUsers,
      maxRunsMonthly: input.limits?.maxRunsMonthly ?? current.limits.maxRunsMonthly,
      maxStorageGb: input.limits?.maxStorageGb ?? current.limits.maxStorageGb,
      maxModules: input.limits?.maxModules ?? current.limits.maxModules,
    };

    if (mergedLimits.maxModules !== null && mergedLimits.maxModules !== undefined) {
      if (resolvedModules.length > mergedLimits.maxModules) {
        throw new Error(`Licensed modules (${resolvedModules.length}) exceed max_modules (${mergedLimits.maxModules})`);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE security.company_license
        SET status = 'renewed',
            updated_at = now()
        WHERE id = ${current.id}::uuid
      `);

      const rows = await tx.$queryRaw<any[]>(Prisma.sql`
        INSERT INTO security.company_license (
          company_id,
          plan_code,
          plan_name,
          license_key,
          status,
          issued_at,
          expires_at,
          allowed_modules,
          file_name,
          file_path,
          file_hash,
          max_users,
          max_runs_monthly,
          max_storage_gb,
          max_modules,
          metadata,
          created_by,
          validated_at,
          created_at,
          updated_at
        )
        VALUES (
          ${input.companyId}::uuid,
          ${current.planCode},
          ${current.planName},
          ${current.licenseKey},
          'active',
          ${current.issuedAt ? new Date(current.issuedAt) : null},
          ${new Date(input.expiresAt)},
          ${resolvedModules},
          ${current.fileName},
          ${current.filePath},
          ${current.fileHash},
          ${mergedLimits.maxUsers},
          ${mergedLimits.maxRunsMonthly},
          ${mergedLimits.maxStorageGb},
          ${mergedLimits.maxModules},
          ${current.metadata},
          ${input.performedBy}::uuid,
          now(),
          now(),
          now()
        )
        RETURNING id
      `);

      const newLicenseId = rows[0]?.id;

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO security.company_license_event (
          company_id,
          license_id,
          event_type,
          event_status,
          notes,
          payload,
          performed_by,
          created_at
        )
        VALUES (
          ${input.companyId}::uuid,
          ${newLicenseId}::uuid,
          'renew',
          'success',
          ${input.notes ?? 'License renewed'},
          ${
            {
              previousLicenseId: current.id,
              newExpiresAt: input.expiresAt,
              allowedModules: resolvedModules,
              limits: mergedLimits,
            } as Record<string, unknown>
          },
          ${input.performedBy}::uuid,
          now()
        )
      `);

      for (const moduleCode of resolvedModules) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO security.company_module (
            company_id,
            module_code,
            is_enabled,
            license_status,
            starts_at,
            ends_at,
            metadata,
            created_at,
            updated_at
          )
          VALUES (
            ${input.companyId}::uuid,
            ${moduleCode},
            true,
            'active',
            now(),
            ${new Date(input.expiresAt)},
            ${{}},
            now(),
            now()
          )
          ON CONFLICT (company_id, module_code)
          DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            license_status = EXCLUDED.license_status,
            starts_at = EXCLUDED.starts_at,
            ends_at = EXCLUDED.ends_at,
            updated_at = now()
        `);
      }
    });

    return this.getDashboard(input.companyId);
  }
}
