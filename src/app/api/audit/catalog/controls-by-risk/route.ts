import { postAuditCatalogControlsByRiskHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('audit', 'write', (request) => postAuditCatalogControlsByRiskHandler(request))
);
