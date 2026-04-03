import { postCreateLinearRiskDraftHandler } from '@/modules/linear-risk/api/handlers';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', async () => {
    const auth = await getAuthContext();
    return postCreateLinearRiskDraftHandler(auth!);
  })
);
