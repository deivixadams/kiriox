import type { LicenseManagementRepository } from '@/modules/governance/domain/contracts';

export class GetLicenseDashboardUseCase {
  constructor(private readonly repository: LicenseManagementRepository) {}

  execute(companyId: string) {
    return this.repository.getDashboard(companyId);
  }
}
