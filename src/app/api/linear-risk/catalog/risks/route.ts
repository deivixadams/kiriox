import { getAuditCatalogRisksHandler, postAuditCatalogRisksHandler } from '@/modules/audit/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request) => getAuditCatalogRisksHandler(request))
);

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) => postAuditCatalogRisksHandler(request))
);
