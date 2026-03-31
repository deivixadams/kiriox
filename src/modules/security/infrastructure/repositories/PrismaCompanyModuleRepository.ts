import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";

export type CompanyModuleRow = {
  company_id: string;
  module_code: string;
  is_enabled: boolean;
  license_status: string;
};

export class PrismaCompanyModuleRepository {
  async enableModule(input: {
    companyId: string;
    moduleCode: string;
    licenseStatus?: string;
    startsAt?: Date | null;
    endsAt?: Date | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO security.company_module (
          company_id,
          module_code,
          is_enabled,
          license_status,
          starts_at,
          ends_at,
          metadata
        )
        VALUES (
          ${input.companyId}::uuid,
          ${input.moduleCode},
          true,
          ${input.licenseStatus ?? "active"},
          ${input.startsAt ?? null},
          ${input.endsAt ?? null},
          ${JSON.stringify(input.metadata ?? {})}::jsonb
        )
        ON CONFLICT (company_id, module_code)
        DO UPDATE SET
          is_enabled = true,
          license_status = EXCLUDED.license_status,
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          metadata = EXCLUDED.metadata,
          updated_at = now()
      `
    );
  }

  async disableModule(companyId: string, moduleCode: string): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE security.company_module
        SET is_enabled = false,
            updated_at = now()
        WHERE company_id = ${companyId}::uuid
          AND module_code = ${moduleCode}
      `
    );
  }

  async getEnabledModules(companyId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ module_code: string }[]>(
      Prisma.sql`
        SELECT module_code
        FROM security.company_module
        WHERE company_id = ${companyId}::uuid
          AND COALESCE(is_enabled, false) = true
          AND (
            license_status IS NULL OR LOWER(license_status) IN ('active', 'trial', 'grace')
          )
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at IS NULL OR ends_at >= now())
      `
    );
    return rows.map((row) => row.module_code);
  }

  async getAllByCompany(companyId: string): Promise<CompanyModuleRow[]> {
    return prisma.$queryRaw<CompanyModuleRow[]>(
      Prisma.sql`
        SELECT company_id, module_code, is_enabled, COALESCE(license_status, 'active') AS license_status
        FROM security.company_module
        WHERE company_id = ${companyId}::uuid
      `
    );
  }
}

