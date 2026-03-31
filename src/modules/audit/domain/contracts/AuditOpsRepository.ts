import type { AuditAssessmentListItem, AuditScopeSummary, AuditStatItem, DraftRecord } from '../types/AuditOpsTypes';

export interface AuditOpsRepository {
  listAssessments(auth: { roleCode: string; tenantId: string }): Promise<AuditAssessmentListItem[]>;
  getStats(): Promise<AuditStatItem[]>;
  deriveScope(domainIds: string[], obligationIds: string[]): Promise<AuditScopeSummary>;
  createDraft(auth: { tenantId: string; userId: string }): Promise<DraftRecord>;
  getDraft(auth: { tenantId: string }, id: string): Promise<DraftRecord | null>;
  updateDraft(auth: { tenantId: string }, id: string, patch: Partial<DraftRecord>): Promise<DraftRecord | null>;
}
