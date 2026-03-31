import type { AccessControlRepository } from '../../domain/contracts';
import type { ModuleCode } from '../../domain/types';

export class CheckModuleAccessUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(companyId: string, module: ModuleCode): Promise<boolean> {
    return this.repository.isModuleEnabled(companyId, module);
  }
}

