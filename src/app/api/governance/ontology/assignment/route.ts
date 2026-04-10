import { getGovernanceOntologyAssignmentContextHandler, putGovernanceOntologyAssignmentHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.read' }, async () =>
    getGovernanceOntologyAssignmentContextHandler()
  )
);

export const PUT = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request, _context, access) =>
    putGovernanceOntologyAssignmentHandler(request, {
      userId: access.user.id,
    })
  )
);
