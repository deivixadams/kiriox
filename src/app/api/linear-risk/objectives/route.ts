import { getObjectivesHandler, putObjectiveHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.read' }, (_request, _context, access) =>
    getObjectivesHandler(access)
  )
);

export const PUT = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, (request, _context, access) =>
    putObjectiveHandler(request, access)
  )
);
