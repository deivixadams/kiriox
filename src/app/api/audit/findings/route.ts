import { getAuditFindingsHandler, postAuditFindingsHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', (request) => getAuditFindingsHandler(request))
);

export const POST = nextHandler(
  withModuleAccess('audit', 'write', (request) => postAuditFindingsHandler(request))
);
