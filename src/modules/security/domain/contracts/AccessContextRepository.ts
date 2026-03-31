import type { AccessContext, ModuleCode } from '../types';

export interface AccessContextRepository {
  getAccessContext(input: {
    userId: string;
    companyId: string;
    fallbackEmail?: string;
  }): Promise<AccessContext>;
  getEnabledModules(companyId: string): Promise<ModuleCode[]>;
  getPermissions(userId: string, companyId: string): Promise<string[]>;
}

