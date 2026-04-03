import { getLinearRiskRisksBySignificantActivityHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request) =>
    getLinearRiskRisksBySignificantActivityHandler(request)
  )
);
