import { NextResponse } from 'next/server';
import { PrismaDashboard2Repository } from '@/modules/structural-risk/infrastructure/repositories/PrismaDashboard2Repository';
import { GetDashboard2TopRankingsUseCase } from '@/modules/structural-risk/application/use-cases/GetDashboard2TopRankingsUseCase';

export async function getDashboard2TopHandler(): Promise<NextResponse> {
  const repo = new PrismaDashboard2Repository();
  const useCase = new GetDashboard2TopRankingsUseCase(repo);
  const result = await useCase.execute();

  // Handle BigInt serialization for Next.js JSON response
  const serializedResult = JSON.parse(
    JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );

  return NextResponse.json(serializedResult);
}
