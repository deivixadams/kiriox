import { StructuralQuestionRepository } from '../../domain/contracts/StructuralQuestionRepository';
import { ExecutionContext, ExecutionResult } from '../../domain/types/AnalyticalQuestion';

export class ExecuteMainQuestionUseCase {
  constructor(private repository: StructuralQuestionRepository) {}

  async execute(code: string, context: ExecutionContext, debug: boolean = false): Promise<ExecutionResult> {
    if (!code) throw new Error('Question code is required');
    if (!context?.companyId) throw new Error('Company ID is required in context');
    
    return this.repository.executeMainQuestion(code, context, debug);
  }
}
