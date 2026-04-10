import { ApiError } from '@/shared/http';
import type { CompanyRealmAssignmentRepository } from '@/modules/governance/domain/contracts/CompanyRealmAssignmentRepository';
import type { GovernanceCompanyRealmSelection } from '@/modules/governance/domain/types/CompanyRealmAssignmentTypes';

export class GetCompanyRealmSelectionUseCase {
  constructor(private readonly repository: CompanyRealmAssignmentRepository) {}

  async execute(companyId: string): Promise<GovernanceCompanyRealmSelection> {
    const normalizedCompanyId = companyId.trim();
    if (!normalizedCompanyId) {
      throw ApiError.badRequest('companyId is required');
    }

    const company = await this.repository.findActiveCompanyById(normalizedCompanyId);
    if (!company) {
      throw ApiError.badRequest('Selected company does not exist or is inactive');
    }

    return this.repository.getSelectionByCompanyId(normalizedCompanyId);
  }
}

