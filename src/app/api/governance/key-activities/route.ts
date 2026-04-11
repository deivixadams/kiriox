import {
  deleteGovernanceKeyActivityCatalogHandler,
  getGovernanceKeyActivityCatalogHandler,
  postGovernanceKeyActivityCatalogHandler,
  putGovernanceKeyActivityCatalogHandler,
} from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.read' }, async (request) =>
    getGovernanceKeyActivityCatalogHandler(request)
  )
);

export const POST = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    postGovernanceKeyActivityCatalogHandler(request)
  )
);

export const PUT = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    putGovernanceKeyActivityCatalogHandler(request)
  )
);

export const DELETE = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    deleteGovernanceKeyActivityCatalogHandler(request)
  )
);

