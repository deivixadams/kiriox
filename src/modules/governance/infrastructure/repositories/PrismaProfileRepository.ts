import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { ProfileRepository } from '@/modules/governance/domain/contracts';
import type { CreateProfileInput, CreateSnapshotInput } from '@/modules/governance/domain/types';
import { mapProfile, mapSnapshot } from '@/modules/governance/infrastructure/mappers';

function generateHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export class PrismaProfileRepository implements ProfileRepository {
  async getActiveProfile(companyId: string) {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT id, company_id, name, status, version, approved_at, approved_by, created_at, updated_at
      FROM governance.profile
      WHERE company_id = ${companyId}::uuid
        AND status = 'APPROVED'
      ORDER BY version DESC, updated_at DESC
      LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return null;
    }

    return mapProfile(rows[0]);
  }

  async createProfile(input: CreateProfileInput) {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO governance.profile (
        company_id,
        name,
        status,
        version,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        ${input.companyId}::uuid,
        ${input.name},
        'DRAFT',
        1,
        ${input.createdBy}::uuid,
        now(),
        now()
      )
      RETURNING id, company_id, name, status, version, approved_at, approved_by, created_at, updated_at
    `);

    return mapProfile(rows[0]);
  }

  async approveProfile(profileId: string, approvedBy: string) {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      UPDATE governance.profile
      SET status = 'APPROVED',
          approved_by = ${approvedBy}::uuid,
          approved_at = now(),
          updated_at = now()
      WHERE id = ${profileId}::uuid
      RETURNING id, company_id, name, status, version, approved_at, approved_by, created_at, updated_at
    `);

    if (!rows || rows.length === 0) {
      return null;
    }

    return mapProfile(rows[0]);
  }

  async createSnapshot(input: CreateSnapshotInput) {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO governance.profile_snapshot (
        profile_id,
        hash,
        run_id,
        created_at
      )
      VALUES (
        ${input.profileId}::uuid,
        ${generateHash(`${input.profileId}:${Date.now()}`)},
        ${input.runId ?? null}::uuid,
        now()
      )
      RETURNING id, profile_id, hash, run_id, created_at
    `);

    return mapSnapshot(rows[0]);
  }
}
