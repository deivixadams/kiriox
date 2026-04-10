import type {
  GovernanceCompanyRealmContext,
  GovernanceCompanyRealmMapping,
  GovernanceCompanyRealmSelection,
  GovernanceRealmOption,
  SaveCompanyRealmSelectionInput,
} from '@/modules/governance/domain/types/CompanyRealmAssignmentTypes';

export interface CompanyRealmAssignmentRepository {
  listContext(): Promise<GovernanceCompanyRealmContext>;
  findActiveCompanyById(companyId: string): Promise<{ id: string; code: string; name: string } | null>;
  findActiveRealmsByIds(realmIds: string[]): Promise<GovernanceRealmOption[]>;
  getSelectionByCompanyId(companyId: string): Promise<GovernanceCompanyRealmSelection>;
  saveSelection(input: SaveCompanyRealmSelectionInput): Promise<GovernanceCompanyRealmMapping[]>;
}

