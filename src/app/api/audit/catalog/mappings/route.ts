import { getAuditCatalogMappingsHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', () => getAuditCatalogMappingsHandler())
);
