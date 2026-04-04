import { AnalyticalQuestion } from '../../domain/types/AnalyticalQuestion';
import { StructuralQuestionRepository } from '../../domain/contracts/StructuralQuestionRepository';

export class GetMainQuestionsUseCase {
  constructor(private repository: StructuralQuestionRepository) {}

  async execute(): Promise<AnalyticalQuestion[]> {
    return this.repository.getMainQuestions();
  }
}
