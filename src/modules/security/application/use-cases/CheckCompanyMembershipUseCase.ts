import type { AccessControlRepository } from '../../domain/contracts';

export class CheckCompanyMembershipUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(userId: string, companyId: string): Promise<boolean> {
    return this.repository.userBelongsToCompany(userId, companyId);
  }
}

