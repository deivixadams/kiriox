import { postGovernanceLicenseValidateHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withAccess } from '@/shared/http';

export const POST = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.license.write' }, async (_request, _context, access) =>
    postGovernanceLicenseValidateHandler({
      companyId: access.company.id,
      userId: access.user.id,
      roleCode: access.user.roleCode,
    })
  )
);
