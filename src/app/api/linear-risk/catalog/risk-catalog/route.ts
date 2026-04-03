import {
  deleteLinearRiskCatalogRiskHandler,
  getLinearRiskCatalogRiskHandler,
  postLinearRiskCatalogRiskHandler,
  putLinearRiskCatalogRiskHandler,
} from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request) =>
    getLinearRiskCatalogRiskHandler(request)
  )
);

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    postLinearRiskCatalogRiskHandler(request)
  )
);

export const PUT = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    putLinearRiskCatalogRiskHandler(request)
  )
);

export const DELETE = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    deleteLinearRiskCatalogRiskHandler(request)
  )
);
