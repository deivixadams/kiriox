import {
  deleteLinearRiskSignificantActivitiesCatalogHandler,
  getLinearRiskSignificantActivitiesCatalogHandler,
  postLinearRiskSignificantActivitiesCatalogHandler,
  putLinearRiskSignificantActivitiesCatalogHandler,
} from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request) =>
    getLinearRiskSignificantActivitiesCatalogHandler(request)
  )
);

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    postLinearRiskSignificantActivitiesCatalogHandler(request)
  )
);

export const PUT = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    putLinearRiskSignificantActivitiesCatalogHandler(request)
  )
);

export const DELETE = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    deleteLinearRiskSignificantActivitiesCatalogHandler(request)
  )
);
