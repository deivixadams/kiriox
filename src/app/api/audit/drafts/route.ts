import { postCreateAuditDraftHandler } from '@/modules/audit/api/handlers';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('audit', 'write', async () => {
    const auth = await getAuthContext();
    return postCreateAuditDraftHandler(auth!);
  })
);
