import type { ModuleCode } from '../types';

export interface AccessControlRepository {
  userBelongsToCompany(userId: string, companyId: string): Promise<boolean>;
  isModuleEnabled(companyId: string, module: ModuleCode): Promise<boolean>;
  hasPermission(userId: string, companyId: string, permission: string): Promise<boolean>;
}

