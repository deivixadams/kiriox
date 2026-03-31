import { getAuditCatalogTypesHandler, postAuditCatalogTypesSeedHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', () => getAuditCatalogTypesHandler())
);

export const POST = nextHandler(
  withModuleAccess('audit', 'write', () => postAuditCatalogTypesSeedHandler())
);
