import type {
  LicenseDashboard,
  RenewLicenseInput,
  UploadLicenseInput,
  ValidateLicenseResult,
} from '../types/LicenseManagementTypes';

export interface LicenseManagementRepository {
  getDashboard(companyId: string): Promise<LicenseDashboard>;
  uploadLicense(input: UploadLicenseInput): Promise<LicenseDashboard>;
  validateCurrentLicense(companyId: string, performedBy: string): Promise<ValidateLicenseResult>;
  renewLicense(input: RenewLicenseInput): Promise<LicenseDashboard>;
}
