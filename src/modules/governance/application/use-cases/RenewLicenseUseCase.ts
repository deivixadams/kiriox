import type { LicenseManagementRepository } from '@/modules/governance/domain/contracts';
import type { RenewLicenseInput } from '@/modules/governance/domain/types';

export class RenewLicenseUseCase {
  constructor(private readonly repository: LicenseManagementRepository) {}

  execute(input: RenewLicenseInput) {
    return this.repository.renewLicense(input);
  }
}
