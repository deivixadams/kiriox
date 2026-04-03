import {
  getLinearRiskDraftAnalysisHandler,
  putLinearRiskDraftAnalysisHandler,
} from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request, context) =>
    getLinearRiskDraftAnalysisHandler(request, { params: context?.params as Promise<{ id: string }> })
  )
);

export const PUT = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request, context) =>
    putLinearRiskDraftAnalysisHandler(request, { params: context?.params as Promise<{ id: string }> })
  )
);
