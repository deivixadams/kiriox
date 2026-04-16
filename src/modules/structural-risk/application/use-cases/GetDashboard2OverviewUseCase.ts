import type { PrismaDashboard2Repository } from '@/modules/structural-risk/infrastructure/repositories/PrismaDashboard2Repository';
import type { OverviewResponse } from '@/modules/structural-risk/domain/types/Dashboard2Types';

export class GetDashboard2OverviewUseCase {
  constructor(private readonly repo: PrismaDashboard2Repository) {}

  async execute(): Promise<OverviewResponse> {
    const nodes = await this.repo.getOverviewNodes();
    const nodeIds = nodes.map((n) => n.node_id);
    const edges = await this.repo.getOverviewEdges(nodeIds);

    return {
      nodes,
      edges,
      meta: {
        node_count: nodes.length,
        edge_count: edges.length,
      },
    };
  }
}
