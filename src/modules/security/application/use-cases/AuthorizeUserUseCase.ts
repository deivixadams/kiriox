import type { AccessDecisionInput } from '../../domain/types';
import { CheckCompanyMembershipUseCase } from './CheckCompanyMembershipUseCase';
import { CheckModuleAccessUseCase } from './CheckModuleAccessUseCase';
import { CheckPermissionUseCase } from './CheckPermissionUseCase';

export class AuthorizeUserUseCase {
  constructor(
    private readonly checkMembership: CheckCompanyMembershipUseCase,
    private readonly checkModuleAccess: CheckModuleAccessUseCase,
    private readonly checkPermission: CheckPermissionUseCase
  ) {}

  async execute(input: AccessDecisionInput): Promise<{
    allowed: boolean;
    reason?: 'membership' | 'module' | 'permission';
  }> {
    const belongs = await this.checkMembership.execute(input.userId, input.companyId);
    if (!belongs) return { allowed: false, reason: 'membership' };

    const moduleEnabled = await this.checkModuleAccess.execute(input.companyId, input.module);
    if (!moduleEnabled) return { allowed: false, reason: 'module' };

    const permitted = await this.checkPermission.execute(
      input.userId,
      input.companyId,
      input.permission
    );
    if (!permitted) return { allowed: false, reason: 'permission' };

    return { allowed: true };
  }
}

