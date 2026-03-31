import { getGovernanceLicenseDashboardHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.license.read' }, async (_request, _context, access) =>
    getGovernanceLicenseDashboardHandler({
      companyId: access.company.id,
      roleCode: access.user.roleCode,
    })
  )
);
