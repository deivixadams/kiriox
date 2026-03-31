import type { StructuralGraphRepository } from '@/modules/structural-risk/domain/contracts/StructuralGraphRepository';
import type { GraphSubgraphResponse } from '@/modules/structural-risk/domain/types/GraphTypes';

export class GetGraphSubgraphUseCase {
  constructor(private readonly graphRepository: StructuralGraphRepository) {}

  async execute(nodeId: string): Promise<GraphSubgraphResponse> {
    const [nodeRows, edgeRows] = await Promise.all([
      this.graphRepository.getNodeById(nodeId),
      this.graphRepository.getEdgesByNodeId(nodeId),
    ]);

    const connectedNodeIds = new Set<string>([nodeId]);
    edgeRows.forEach((row) => {
      const source = row.element_data?.source;
      const target = row.element_data?.target;

      if (source) connectedNodeIds.add(String(source));
      if (target) connectedNodeIds.add(String(target));
    });

    const connectedNodeArray = Array.from(connectedNodeIds);
    const neighborRows = connectedNodeArray.length > 0
      ? await this.graphRepository.getNodesByIds(connectedNodeArray)
      : [];

    const uniqueNodes = new Map<string, (typeof nodeRows)[number]>();
    [...nodeRows, ...neighborRows].forEach((row) => {
      uniqueNodes.set(row.element_key, row);
    });

    return {
      elements: [...uniqueNodes.values(), ...edgeRows],
      meta: {
        rootNodeId: nodeId,
        counts: {
          nodes: uniqueNodes.size,
          edges: edgeRows.length,
          total: uniqueNodes.size + edgeRows.length,
        },
      },
    };
  }
}
