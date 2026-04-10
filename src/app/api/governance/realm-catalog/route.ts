import {
  deleteGovernanceRealmCatalogHandler,
  getGovernanceRealmCatalogHandler,
  postGovernanceRealmCatalogHandler,
  putGovernanceRealmCatalogHandler,
} from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.read' }, async () =>
    getGovernanceRealmCatalogHandler()
  )
);

export const POST = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    postGovernanceRealmCatalogHandler(request)
  )
);

export const PUT = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    putGovernanceRealmCatalogHandler(request)
  )
);

export const DELETE = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    deleteGovernanceRealmCatalogHandler(request)
  )
);
