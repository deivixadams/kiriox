import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { GovernanceParameterDefinition, ParameterDefinitionRepository } from '@/modules/governance/domain/contracts';

export class PrismaParameterDefinitionRepository implements ParameterDefinitionRepository {
  async listActiveDefinitions(): Promise<GovernanceParameterDefinition[]> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT id, code, name, category, is_active
      FROM governance.parameter_definition
      WHERE is_active = true
      ORDER BY code ASC
    `);

    return (rows || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category ?? null,
      isActive: Boolean(row.is_active),
    }));
  }
}
