import type { ProfileSnapshot } from '@/modules/governance/domain/entities';

export function mapSnapshot(row: any): ProfileSnapshot {
  return {
    id: row.id,
    profileId: row.profile_id,
    hash: row.hash,
    runId: row.run_id ?? null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
