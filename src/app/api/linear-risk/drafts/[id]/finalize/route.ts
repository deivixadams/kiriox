import { postLinearRiskDraftFinalizeHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', async (_request, context) => {
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return postLinearRiskDraftFinalizeHandler(id);
  })
);
