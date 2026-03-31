export type ListFindingsInput = { evaluationId: string };

export type CreateManualFindingInput = {
  tenantId: string;
  evaluationId: string;
  eventTypeId: number;
  title?: string;
  description?: string;
  severity?: number;
  exposureFloor?: number;
  readinessPenalty?: number;
  dueDate?: string | null;
  ownerRole?: string | null;
  userId: string;
  userRole: string;
};

export type UpdateFindingStatusInput = {
  id: string;
  status: 'open' | 'closed' | 'suppressed';
  resolution?: string | null;
  userId: string;
  userRole: string;
};
