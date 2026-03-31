import type { AccessContextRepository } from '../../domain/contracts';
import type { AccessContext } from '../../domain/types';

export class GetAccessContextUseCase {
  constructor(private readonly repository: AccessContextRepository) {}

  async execute(input: {
    userId: string;
    companyId: string;
    fallbackEmail?: string;
  }): Promise<AccessContext> {
    return this.repository.getAccessContext(input);
  }
}

