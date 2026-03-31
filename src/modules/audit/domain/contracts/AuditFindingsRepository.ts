import type { CreateManualFindingInput, ListFindingsInput, UpdateFindingStatusInput } from '../types/AuditFindingsTypes';

export interface AuditFindingsRepository {
  listFindings(input: ListFindingsInput): Promise<unknown[]>;
  createManualFinding(input: CreateManualFindingInput): Promise<unknown>;
  updateFindingStatus(input: UpdateFindingStatusInput): Promise<unknown>;
}
