import { patchAuditFindingStatusHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const PATCH = nextHandler(
  withModuleAccess('audit', 'write', async (request, context) => {
    const params = context?.params as Promise<{ id: string }>;
    const { id } = await params;
    return patchAuditFindingStatusHandler(id, request);
  })
);
