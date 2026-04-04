import { AnalyticalQuestion, ExecutionContext, ExecutionResult } from '../types/AnalyticalQuestion';

export interface StructuralQuestionRepository {
  getMainQuestions(): Promise<AnalyticalQuestion[]>;
  executeMainQuestion(code: string, context: ExecutionContext, debug: boolean): Promise<ExecutionResult>;
}
