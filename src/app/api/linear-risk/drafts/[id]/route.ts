import { getLinearRiskDraftHandler, patchLinearRiskDraftHandler } from '@/modules/linear-risk/api/handlers';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', async (_request, context) => {
    const auth = await getAuthContext();
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return getLinearRiskDraftHandler(auth!, id);
  })
);

export const PATCH = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', async (request, context) => {
    const auth = await getAuthContext();
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return patchLinearRiskDraftHandler(auth!, id, request);
  })
);
