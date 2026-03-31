import type { Profile } from '@/modules/governance/domain/entities';

export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    status: row.status,
    version: Number(row.version ?? 1),
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
    approvedBy: row.approved_by ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
