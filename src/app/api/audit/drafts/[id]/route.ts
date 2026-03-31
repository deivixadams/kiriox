import { getAuditDraftHandler, patchAuditDraftHandler } from '@/modules/audit/api/handlers';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', async (_request, context) => {
    const auth = await getAuthContext();
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return getAuditDraftHandler(auth!, id);
  })
);

export const PATCH = nextHandler(
  withModuleAccess('audit', 'write', async (request, context) => {
    const auth = await getAuthContext();
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return patchAuditDraftHandler(auth!, id, request);
  })
);
