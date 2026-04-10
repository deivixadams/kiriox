import {
  getGovernanceCompanyRealmContextHandler,
  putGovernanceCompanyRealmSelectionHandler,
} from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.read' }, async (request) =>
    getGovernanceCompanyRealmContextHandler(request)
  )
);

export const PUT = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request, _context, access) =>
    putGovernanceCompanyRealmSelectionHandler(request, {
      userId: access.user.id,
    })
  )
);

