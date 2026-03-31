import type { ModuleCode } from './AccessControlTypes';

export type AccessContext = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  company: {
    id: string;
    code: string;
    name: string;
  };
  enabledModules: ModuleCode[];
  permissions: string[];
};

