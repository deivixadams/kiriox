import { postLinearRiskDraftReportHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request, context) =>
    postLinearRiskDraftReportHandler(request, { params: context?.params as Promise<{ id: string }> })
  )
);
