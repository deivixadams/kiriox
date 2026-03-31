import { getAuditCatalogObligationsHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', (request) => getAuditCatalogObligationsHandler(request))
);
