import { getAuditCatalogRisksHandler, postAuditCatalogRisksHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', (request) => getAuditCatalogRisksHandler(request))
);

export const POST = nextHandler(
  withModuleAccess('audit', 'write', (request) => postAuditCatalogRisksHandler(request))
);
