import { getControlClassificationsHandler } from '@/modules/linear-risk/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const dynamic = 'force-dynamic';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', () =>
    getControlClassificationsHandler()
  )
);
