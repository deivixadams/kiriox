import { NextResponse } from 'next/server';
import { PrismaDashboard2Repository } from '@/modules/structural-risk/infrastructure/repositories/PrismaDashboard2Repository';
import { GetDashboard2OverviewUseCase } from '@/modules/structural-risk/application/use-cases/GetDashboard2OverviewUseCase';

export async function getDashboard2OverviewHandler(): Promise<NextResponse> {
  const repo = new PrismaDashboard2Repository();
  const useCase = new GetDashboard2OverviewUseCase(repo);
  const result = await useCase.execute();

  // Handle BigInt serialization for Next.js JSON response
  const serializedResult = JSON.parse(
    JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );

  return NextResponse.json(serializedResult);
}
