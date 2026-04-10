import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";

export type CompanyRow = {
  id: string;
  code: string;
  name: string;
};

export class PrismaCompanyRepository {
  async findByCode(code: string): Promise<CompanyRow | null> {
    const rows = await prisma.$queryRaw<CompanyRow[]>(
      Prisma.sql`
        SELECT c.id, c.code, c.name
        FROM core.company c
        WHERE c.code = ${code}
          AND COALESCE(c.is_active, true) = true
        LIMIT 1
      `
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<CompanyRow | null> {
    const rows = await prisma.$queryRaw<CompanyRow[]>(
      Prisma.sql`
        SELECT c.id, c.code, c.name
        FROM core.company c
        WHERE c.id = ${id}::uuid
          AND COALESCE(c.is_active, true) = true
        LIMIT 1
      `
    );
    return rows[0] ?? null;
  }

  async createCompany(input: {
    code: string;
    name: string;
    legalName?: string | null;
    statusId?: number;
  }): Promise<CompanyRow> {
    const rows = await prisma.$queryRaw<CompanyRow[]>(
      Prisma.sql`
        INSERT INTO core.company (code, name, is_active)
        VALUES (
          ${input.code},
          ${input.name},
          true
        )
        RETURNING id, code, name
      `
    );

    return rows[0];
  }

  async appendAuditLog(input: {
    companyId: string;
    entityName: string;
    entityId: string;
    action: string;
    changedBy?: string | null;
    newData?: unknown;
  }): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO corpus.audit_log (
          tenant_id,
          entity_name,
          entity_id,
          action,
          new_data,
          changed_by
        )
        VALUES (
          ${input.companyId}::uuid,
          ${input.entityName},
          ${input.entityId}::uuid,
          ${input.action},
          ${JSON.stringify(input.newData ?? {})}::jsonb,
          ${input.changedBy ?? null}::uuid
        )
      `
    );
  }
}

