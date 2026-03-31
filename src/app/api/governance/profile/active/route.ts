import { getGovernanceActiveProfileHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('governance', 'profiles.read', (request) =>
    getGovernanceActiveProfileHandler(request)
  )
);
