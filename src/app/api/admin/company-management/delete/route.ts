import { nextHandler, withAccess } from '@/shared/http';
import { 
  getCompaniesWithMappingsHandler, 
  deleteCompanyHandler 
} from '@/modules/admin/api/handlers/CompanyDeleteHandlers';

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async () =>
    getCompaniesWithMappingsHandler()
  )
);

export const DELETE = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.write' }, async (request) =>
    deleteCompanyHandler(request)
  )
);
