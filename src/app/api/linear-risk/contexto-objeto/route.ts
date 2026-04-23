import { getContextoObjetoHandler, putContextoObjetoHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withAccess, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request) => getContextoObjetoHandler(request))
);

export const PUT = nextHandler(
  withAccess({ module: 'linear-risk', permission: 'risk.linear.write' }, (request, _context, access) =>
    putContextoObjetoHandler(request, access)
  )
);
