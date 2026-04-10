import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { CompanyRealmAssignmentRepository } from '@/modules/governance/domain/contracts/CompanyRealmAssignmentRepository';
import type {
  GovernanceCompanyRealmContext,
  GovernanceCompanyRealmMapping,
  GovernanceCompanyRealmSelection,
  GovernanceRealmOption,
  SaveCompanyRealmSelectionInput,
} from '@/modules/governance/domain/types/CompanyRealmAssignmentTypes';

type CompanyRow = {
  id: string;
  code: string;
  name: string;
};

type RealmRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type MappingRow = {
  id: string;
  company_id: string;
  reino_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function toMapping(row: MappingRow): GovernanceCompanyRealmMapping {
  return {
    id: row.id,
    companyId: row.company_id,
    reinoId: row.reino_id,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toRealm(row: RealmRow): GovernanceRealmOption {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
  };
}

export class PrismaCompanyRealmAssignmentRepository implements CompanyRealmAssignmentRepository {
  async listContext(): Promise<GovernanceCompanyRealmContext> {
    const [companies, realms] = await Promise.all([
      prisma.$queryRaw<CompanyRow[]>(Prisma.sql`
        SELECT c.id, c.code, c.name
        FROM core.company c
        WHERE c.is_active = true
        ORDER BY c.name ASC
      `),
      prisma.$queryRaw<RealmRow[]>(Prisma.sql`
        SELECT r.id, r.code, r.name, r.description
        FROM core.reino r
        WHERE r.is_active = true
        ORDER BY r.name ASC
      `),
    ]);

    return {
      companies: companies.map((company) => ({
        id: company.id,
        code: company.code,
        name: company.name,
      })),
      realms: realms.map(toRealm),
    };
  }

  async findActiveCompanyById(companyId: string): Promise<{ id: string; code: string; name: string } | null> {
    const rows = await prisma.$queryRaw<CompanyRow[]>(Prisma.sql`
      SELECT c.id, c.code, c.name
      FROM core.company c
      WHERE c.id = ${companyId}::uuid
        AND c.is_active = true
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }

  async findActiveRealmsByIds(realmIds: string[]): Promise<GovernanceRealmOption[]> {
    if (realmIds.length === 0) return [];

    const realmIdRefs = realmIds.map((realmId) => Prisma.sql`${realmId}::uuid`);
    const rows = await prisma.$queryRaw<RealmRow[]>(Prisma.sql`
      SELECT r.id, r.code, r.name, r.description
      FROM core.reino r
      WHERE r.is_active = true
        AND r.id IN (${Prisma.join(realmIdRefs)})
      ORDER BY r.name ASC
    `);

    return rows.map(toRealm);
  }

  async getSelectionByCompanyId(companyId: string): Promise<GovernanceCompanyRealmSelection> {
    const rows = await prisma.$queryRaw<MappingRow[]>(Prisma.sql`
      SELECT m.id, m.company_id, m.reino_id, m.is_active, m.created_at, m.updated_at
      FROM core.map_company_x_reino m
      WHERE m.company_id = ${companyId}::uuid
        AND m.is_active = true
      ORDER BY m.updated_at DESC, m.created_at DESC
    `);

    const activeMappings = rows.map(toMapping);
    const activeRealmIds = Array.from(new Set(activeMappings.map((mapping) => mapping.reinoId)));

    return {
      companyId,
      activeRealmIds,
      activeMappings,
    };
  }

  async saveSelection(input: SaveCompanyRealmSelectionInput): Promise<GovernanceCompanyRealmMapping[]> {
    return prisma.$transaction(async (tx) => {
      if (input.realmIds.length === 0) {
        await tx.$queryRaw(Prisma.sql`
          DELETE FROM core.map_company_x_reino
          WHERE company_id = ${input.companyId}::uuid
        `);
      } else {
        const realmRefs = input.realmIds.map((realmId) => Prisma.sql`${realmId}::uuid`);

        await tx.$queryRaw(Prisma.sql`
          DELETE FROM core.map_company_x_reino
          WHERE company_id = ${input.companyId}::uuid
            AND reino_id NOT IN (${Prisma.join(realmRefs)})
        `);

        const existingRows = await tx.$queryRaw<{ id: string; reino_id: string }[]>(Prisma.sql`
          SELECT m.id, m.reino_id
          FROM core.map_company_x_reino m
          WHERE m.company_id = ${input.companyId}::uuid
            AND m.reino_id IN (${Prisma.join(realmRefs)})
          ORDER BY m.updated_at DESC, m.created_at DESC, m.id DESC
        `);

        const firstRowPerRealm = new Map<string, string>();
        const duplicateIds: string[] = [];

        for (const row of existingRows) {
          if (!firstRowPerRealm.has(row.reino_id)) {
            firstRowPerRealm.set(row.reino_id, row.id);
          } else {
            duplicateIds.push(row.id);
          }
        }

        if (duplicateIds.length > 0) {
          const duplicateRefs = duplicateIds.map((id) => Prisma.sql`${id}::uuid`);
          await tx.$queryRaw(Prisma.sql`
            DELETE FROM core.map_company_x_reino
            WHERE id IN (${Prisma.join(duplicateRefs)})
          `);
        }

        const keepIds = Array.from(firstRowPerRealm.values());
        if (keepIds.length > 0) {
          const keepRefs = keepIds.map((id) => Prisma.sql`${id}::uuid`);
          await tx.$queryRaw(Prisma.sql`
            UPDATE core.map_company_x_reino
            SET is_active = true,
                updated_at = now()
            WHERE id IN (${Prisma.join(keepRefs)})
          `);
        }

        const existingRealmIdSet = new Set(firstRowPerRealm.keys());
        const toCreate = input.realmIds.filter((realmId) => !existingRealmIdSet.has(realmId));
        for (const realmId of toCreate) {
          await tx.$queryRaw(Prisma.sql`
            INSERT INTO core.map_company_x_reino (
              company_id,
              reino_id,
              is_active,
              created_at,
              updated_at
            )
            VALUES (
              ${input.companyId}::uuid,
              ${realmId}::uuid,
              true,
              now(),
              now()
            )
          `);
        }
      }

      const finalRows = await tx.$queryRaw<MappingRow[]>(Prisma.sql`
        SELECT m.id, m.company_id, m.reino_id, m.is_active, m.created_at, m.updated_at
        FROM core.map_company_x_reino m
        WHERE m.company_id = ${input.companyId}::uuid
          AND m.is_active = true
        ORDER BY m.updated_at DESC, m.created_at DESC, m.id DESC
      `);

      return finalRows.map(toMapping);
    });
  }
}
