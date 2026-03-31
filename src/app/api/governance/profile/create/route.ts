import { postGovernanceCreateProfileHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('governance', 'profiles.write', (request) =>
    postGovernanceCreateProfileHandler(request)
  )
);
