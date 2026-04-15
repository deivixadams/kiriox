import { NextResponse } from 'next/server';
import { PrismaStructuralQuestionRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaStructuralQuestionRepository';
import { ExecuteMainQuestionUseCase } from '@/modules/structural-risk/application/use-cases/ExecuteMainQuestionUseCase';
import { withModuleAccess } from '@/shared/http';

export const POST = withModuleAccess('structural-risk', 'risk.structural.run', async function POST(req: Request) {
  try {
    const { code, context, debug } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Question code is required' }, { status: 400 });
    }
    
    const repository = new PrismaStructuralQuestionRepository();
    const useCase = new ExecuteMainQuestionUseCase(repository);
    
    const result = await useCase.execute(code, context, debug);
    
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error executing structural question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
