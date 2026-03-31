import { getAuditAssessmentsHandler } from '@/modules/audit/api/handlers';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', async () => {
    const auth = await getAuthContext();
    return getAuditAssessmentsHandler(auth!);
  })
);
