import { NextResponse } from 'next/server';
import { GetGraphViewUseCase } from '@/modules/structural-risk/application/use-cases/GetGraphViewUseCase';
import { PrismaStructuralGraphRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaStructuralGraphRepository';
import { parseGraphFilters } from '@/modules/structural-risk/api/schemas/graphQuerySchema';

export async function getGraphViewHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseGraphFilters(searchParams);

    const repository = new PrismaStructuralGraphRepository();
    const useCase = new GetGraphViewUseCase(repository);
    const result = await useCase.execute(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching graph view:', error);
    return NextResponse.json({ error: 'Failed to fetch graph' }, { status: 500 });
  }
}
