import type { LicenseManagementRepository } from '@/modules/governance/domain/contracts';

export class ValidateLicenseUseCase {
  constructor(private readonly repository: LicenseManagementRepository) {}

  execute(companyId: string, performedBy: string) {
    return this.repository.validateCurrentLicense(companyId, performedBy);
  }
}
