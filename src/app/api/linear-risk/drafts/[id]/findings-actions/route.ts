import { putLinearRiskDraftFindingsActionsHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const PUT = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', async (request, context) => {
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return putLinearRiskDraftFindingsActionsHandler(request, id);
  })
);
