import type { CompanyRealmAssignmentRepository } from '@/modules/governance/domain/contracts/CompanyRealmAssignmentRepository';
import type { GovernanceCompanyRealmContext } from '@/modules/governance/domain/types/CompanyRealmAssignmentTypes';

export class GetCompanyRealmContextUseCase {
  constructor(private readonly repository: CompanyRealmAssignmentRepository) {}

  async execute(): Promise<GovernanceCompanyRealmContext> {
    return this.repository.listContext();
  }
}

