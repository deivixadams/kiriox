import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { ParameterRepository, GovernanceParameterValue } from '@/modules/governance/domain/contracts';

export class PrismaParameterRepository implements ParameterRepository {
  async getValuesByProfile(profileId: string): Promise<GovernanceParameterValue[]> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT id, profile_id, parameter_code, value
      FROM governance.profile_parameter_value
      WHERE profile_id = ${profileId}::uuid
      ORDER BY parameter_code ASC
    `);

    return (rows || []).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      parameterCode: row.parameter_code,
      value: Number(row.value),
    }));
  }
}
