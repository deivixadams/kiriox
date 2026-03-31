import { NextResponse } from 'next/server';
import { GetGraphSubgraphUseCase } from '@/modules/structural-risk/application/use-cases/GetGraphSubgraphUseCase';
import { PrismaStructuralGraphRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaStructuralGraphRepository';

export async function getGraphSubgraphHandler(nodeKeyParam: string) {
  try {
    const decodedNodeKey = decodeURIComponent(nodeKeyParam);

    if (!decodedNodeKey) {
      return NextResponse.json({ error: 'Missing node key' }, { status: 400 });
    }

    const repository = new PrismaStructuralGraphRepository();
    const useCase = new GetGraphSubgraphUseCase(repository);
    const result = await useCase.execute(decodedNodeKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching graph subgraph:', error);
    return NextResponse.json({ error: 'Failed to fetch graph subgraph' }, { status: 500 });
  }
}
