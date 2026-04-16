import type { PrismaDashboard2Repository } from '@/modules/structural-risk/infrastructure/repositories/PrismaDashboard2Repository';
import type { TopRankingsResponse } from '@/modules/structural-risk/domain/types/Dashboard2Types';

export class GetDashboard2TopRankingsUseCase {
  constructor(private readonly repo: PrismaDashboard2Repository) {}

  async execute(): Promise<TopRankingsResponse> {
    const [top_controls, ultra_critical, fragile_nodes] = await Promise.all([
      this.repo.getTopControls(),
      this.repo.getUltraCritical(),
      this.repo.getFragileNodes(),
    ]);

    return { top_controls, ultra_critical, fragile_nodes };
  }
}
