import type { AuditFindingsRepository } from '@/modules/audit/domain/contracts/AuditFindingsRepository';
import type { CreateManualFindingInput, UpdateFindingStatusInput } from '@/modules/audit/domain/types/AuditFindingsTypes';

export class ListAuditFindingsUseCase {
  constructor(private readonly repository: AuditFindingsRepository) {}
  execute(evaluationId: string) { return this.repository.listFindings({ evaluationId }); }
}

export class CreateManualAuditFindingUseCase {
  constructor(private readonly repository: AuditFindingsRepository) {}
  execute(input: CreateManualFindingInput) { return this.repository.createManualFinding(input); }
}

export class UpdateAuditFindingStatusUseCase {
  constructor(private readonly repository: AuditFindingsRepository) {}
  execute(input: UpdateFindingStatusInput) { return this.repository.updateFindingStatus(input); }
}
