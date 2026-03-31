export type AuditAssessmentListItem = {
  id: string;
  name: string;
  company: string;
  framework: string;
  status: string;
  findings: number;
  readiness: number | null;
  createdAt?: string;
};

export type AuditStatItem = {
  label: string;
  value: number;
  badge: string;
  icon: string;
  color: string;
};

export type AuditScopeSummary = {
  obligationCount: number;
  riskCount: number;
  controlCount: number;
  testCount: number;
};

export type DraftRecord = {
  id: string;
  step: number;
  jurisdictionId?: string | null;
  frameworkId?: string | null;
  frameworkVersionId?: string | null;
  companyId?: string | null;
  acta?: unknown;
  scopeConfig?: unknown;
  objectives?: unknown;
  team?: unknown;
  questionnaire?: unknown;
  guide?: unknown;
  manualExtensions?: unknown;
  windowStart?: string | null;
  windowEnd?: string | null;
  createdAt: string;
  updatedAt: string;
};
