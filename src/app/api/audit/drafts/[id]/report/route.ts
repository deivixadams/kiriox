import { postAuditDraftReportHandler } from '@/modules/audit/api/handlers';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const runtime = 'nodejs';

export const POST = nextHandler(
  withModuleAccess('audit', 'write', async (_request, context) => {
    const auth = await getAuthContext();
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return postAuditDraftReportHandler(auth!, id);
  })
);
