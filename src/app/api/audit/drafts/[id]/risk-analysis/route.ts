import {
  getAuditDraftRiskAnalysisHandler,
  putAuditDraftRiskAnalysisHandler,
} from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', (request, context) =>
    getAuditDraftRiskAnalysisHandler(request, { params: context?.params as Promise<{ id: string }> })
  )
);

export const PUT = nextHandler(
  withModuleAccess('audit', 'write', (request, context) =>
    putAuditDraftRiskAnalysisHandler(request, { params: context?.params as Promise<{ id: string }> })
  )
);
