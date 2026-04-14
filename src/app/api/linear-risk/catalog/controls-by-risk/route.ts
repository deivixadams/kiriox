import { postLinearRiskControlsByRiskHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) => postLinearRiskControlsByRiskHandler(request))
);
