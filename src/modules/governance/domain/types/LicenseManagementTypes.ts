export type PlanLimits = {
  maxUsers: number | null;
  maxRunsMonthly: number | null;
  maxStorageGb: number | null;
  maxModules: number | null;
};

export type CompanyLicenseRecord = {
  id: string;
  companyId: string;
  planCode: string;
  planName: string;
  licenseKey: string | null;
  status: string;
  issuedAt: string | null;
  expiresAt: string;
  validatedAt: string | null;
  allowedModules: string[];
  fileName: string | null;
  filePath: string | null;
  fileHash: string | null;
  limits: PlanLimits;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyLicenseEvent = {
  id: string;
  companyId: string;
  licenseId: string | null;
  eventType: string;
  eventStatus: string;
  notes: string | null;
  payload: Record<string, unknown>;
  performedBy: string | null;
  createdAt: string;
};

export type LicenseDashboard = {
  currentLicense: CompanyLicenseRecord | null;
  enabledModules: string[];
  planLimits: PlanLimits | null;
  expirationStatus: 'valid' | 'expired' | 'missing';
  history: CompanyLicenseEvent[];
};

export type UploadLicenseInput = {
  companyId: string;
  performedBy: string;
  fileName: string;
  filePath: string;
  fileHash: string;
  planCode: string;
  planName: string;
  licenseKey?: string | null;
  issuedAt?: string | null;
  expiresAt: string;
  allowedModules: string[];
  limits: PlanLimits;
  metadata?: Record<string, unknown>;
};

export type RenewLicenseInput = {
  companyId: string;
  performedBy: string;
  expiresAt: string;
  allowedModules?: string[];
  limits?: Partial<PlanLimits>;
  notes?: string;
};

export type ValidateLicenseResult = {
  valid: boolean;
  reason: string;
  currentLicense: CompanyLicenseRecord | null;
};
