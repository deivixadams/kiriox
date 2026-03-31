import { postGovernanceCreateSnapshotHandler } from '@/modules/governance/api/handlers';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const POST = nextHandler(
  withModuleAccess('governance', 'snapshots.write', (request) =>
    postGovernanceCreateSnapshotHandler(request)
  )
);
