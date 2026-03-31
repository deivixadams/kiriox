import { getGraphSubgraphHandler } from '@/modules/structural-risk/api/handlers/getGraphSubgraphHandler';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('risk', 'read', async (_request, context) => {
    const params = context?.params as Promise<{ nodeKey: string }>;
    const { nodeKey } = await params;
    return getGraphSubgraphHandler(nodeKey);
  })
);
