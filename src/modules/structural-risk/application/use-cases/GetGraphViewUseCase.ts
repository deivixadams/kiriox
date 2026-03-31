import type { StructuralGraphRepository } from '@/modules/structural-risk/domain/contracts/StructuralGraphRepository';
import type { GraphFilters, GraphResponse } from '@/modules/structural-risk/domain/types/GraphTypes';

export class GetGraphViewUseCase {
  constructor(private readonly graphRepository: StructuralGraphRepository) {}

  async execute(filters: GraphFilters): Promise<GraphResponse> {
    const [nodesRaw, edgesRaw, nodeTypeRows, edgeTypeRows] = await Promise.all([
      this.graphRepository.getGraphNodes(filters),
      this.graphRepository.getGraphEdges(filters),
      this.graphRepository.getNodeTypeCounts(),
      this.graphRepository.getEdgeTypeCounts(),
    ]);

    return {
      elements: [...nodesRaw, ...edgesRaw],
      meta: {
        counts: {
          nodes: nodesRaw.length,
          edges: edgesRaw.length,
          total: nodesRaw.length + edgesRaw.length,
        },
        availableFilters: {
          nodeTypes: nodeTypeRows
            .filter((row) => row.value)
            .map((row) => ({ value: String(row.value), count: Number(row.count) })),
          edgeTypes: edgeTypeRows
            .filter((row) => row.value)
            .map((row) => ({ value: String(row.value), count: Number(row.count) })),
        },
      },
    };
  }
}
