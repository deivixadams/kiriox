import { NextResponse } from 'next/server';
import { PrismaStructuralQuestionRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaStructuralQuestionRepository';
import { GetMainQuestionsUseCase } from '@/modules/structural-risk/application/use-cases/GetMainQuestionsUseCase';
import { withModuleAccess } from '@/shared/http';

export const GET = withModuleAccess('structural-risk', 'risk.structural.read', async function GET() {
  try {
    const repository = new PrismaStructuralQuestionRepository();
    const useCase = new GetMainQuestionsUseCase(repository);
    const questions = await useCase.execute();
    
    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Error fetching structural questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
