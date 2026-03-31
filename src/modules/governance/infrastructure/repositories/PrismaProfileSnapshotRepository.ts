import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';

export class PrismaProfileSnapshotRepository {
  async listByProfile(profileId: string) {
    return prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT id, profile_id, hash, run_id, created_at
      FROM governance.profile_snapshot
      WHERE profile_id = ${profileId}::uuid
      ORDER BY created_at DESC
    `);
  }
}
