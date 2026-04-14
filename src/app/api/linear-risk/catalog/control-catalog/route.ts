import {
  getControlsByRiskHandler,
  postControlHandler,
  putControlHandler,
} from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', (request) =>
    getControlsByRiskHandler(request)
  )
);

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    postControlHandler(request)
  )
);

export const PUT = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.run', (request) =>
    putControlHandler(request)
  )
);
