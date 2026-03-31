import { getGraphViewHandler } from '@/modules/structural-risk/api/handlers/getGraphViewHandler';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('risk', 'read', (request) => getGraphViewHandler(request))
);
