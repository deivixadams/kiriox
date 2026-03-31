import type { AuditOpsRepository } from '@/modules/audit/domain/contracts/AuditOpsRepository';
import type { DraftRecord } from '@/modules/audit/domain/types/AuditOpsTypes';

export class ListAuditAssessmentsUseCase {
  constructor(private readonly repository: AuditOpsRepository) {}
  execute(auth: { roleCode: string; tenantId: string }) {
    return this.repository.listAssessments(auth);
  }
}

export class GetAuditStatsUseCase {
  constructor(private readonly repository: AuditOpsRepository) {}
  execute() {
    return this.repository.getStats();
  }
}

export class DeriveAuditScopeUseCase {
  constructor(private readonly repository: AuditOpsRepository) {}
  execute(domainIds: string[], obligationIds: string[]) {
    return this.repository.deriveScope(domainIds, obligationIds);
  }
}

export class CreateAuditDraftUseCase {
  constructor(private readonly repository: AuditOpsRepository) {}
  execute(auth: { tenantId: string; userId: string }) {
    return this.repository.createDraft(auth);
  }
}

export class GetAuditDraftUseCase {
  constructor(private readonly repository: AuditOpsRepository) {}
  execute(auth: { tenantId: string }, id: string) {
    return this.repository.getDraft(auth, id);
  }
}

export class UpdateAuditDraftUseCase {
  constructor(private readonly repository: AuditOpsRepository) {}
  execute(auth: { tenantId: string }, id: string, patch: Partial<DraftRecord>) {
    return this.repository.updateDraft(auth, id, patch);
  }
}
