import type { ModuleCode, AccessContext } from '@/modules/security';

export type NavigationItem = {
  key: string;
  label: string;
  href?: string;
  icon?: string;
  module: ModuleCode;
  permission?: string;
  order: number;
  badge?: string;
  children?: NavigationItem[];
};

export type ResolvedNavigationItem = Omit<NavigationItem, 'children'> & {
  children?: ResolvedNavigationItem[];
};

export type NavigationAccessContext = Pick<AccessContext, 'enabledModules' | 'permissions'>;

