import type { LicenseManagementRepository } from '@/modules/governance/domain/contracts';
import type { UploadLicenseInput } from '@/modules/governance/domain/types';

export class UploadLicenseUseCase {
  constructor(private readonly repository: LicenseManagementRepository) {}

  execute(input: UploadLicenseInput) {
    return this.repository.uploadLicense(input);
  }
}
