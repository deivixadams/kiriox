import { ApiError } from '@/shared/http';
import type { CompanyRealmAssignmentRepository } from '@/modules/governance/domain/contracts/CompanyRealmAssignmentRepository';
import type {
  SaveCompanyRealmSelectionInput,
  SaveCompanyRealmSelectionResult,
} from '@/modules/governance/domain/types/CompanyRealmAssignmentTypes';

export class SaveCompanyRealmSelectionUseCase {
  constructor(private readonly repository: CompanyRealmAssignmentRepository) {}

  async execute(input: SaveCompanyRealmSelectionInput): Promise<SaveCompanyRealmSelectionResult> {
    const companyId = input.companyId?.trim();
    if (!companyId) {
      throw ApiError.badRequest('companyId is required');
    }

    const uniqueRealmIds = Array.from(new Set((input.realmIds ?? []).map((id) => id.trim()).filter(Boolean)));

    const company = await this.repository.findActiveCompanyById(companyId);
    if (!company) {
      throw ApiError.badRequest('Selected company does not exist or is inactive');
    }

    if (uniqueRealmIds.length > 0) {
      const activeRealms = await this.repository.findActiveRealmsByIds(uniqueRealmIds);
      const activeRealmIdSet = new Set(activeRealms.map((realm) => realm.id));
      const missing = uniqueRealmIds.filter((realmId) => !activeRealmIdSet.has(realmId));
      if (missing.length > 0) {
        throw ApiError.badRequest('One or more selected realms do not exist or are inactive');
      }
    }

    const activeMappings = await this.repository.saveSelection({
      companyId,
      realmIds: uniqueRealmIds,
      updatedBy: input.updatedBy,
    });

    return {
      company,
      selectedRealmIds: uniqueRealmIds,
      activeMappings,
    };
  }
}

