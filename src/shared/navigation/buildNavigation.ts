import type { NavigationAccessContext, NavigationItem, ResolvedNavigationItem } from './navigation.types';
import { NAVIGATION_CONFIG } from './navigation.config';

function hasPermission(permissions: string[], required?: string): boolean {
  if (!required) return true;
  if (permissions.includes('*')) return true;
  if (permissions.includes(required)) return true;

  const [modulePrefix] = required.split('.');
  return permissions.includes(`${modulePrefix}.*`);
}

function resolveItem(item: NavigationItem, access: NavigationAccessContext): ResolvedNavigationItem | null {
  const moduleEnabled = access.enabledModules.includes(item.module);
  const permissionOk = hasPermission(access.permissions, item.permission);
  if (!moduleEnabled || !permissionOk) return null;

  if (item.children && item.children.length > 0) {
    const children = item.children
      .map((child) => resolveItem(child, access))
      .filter((child): child is ResolvedNavigationItem => Boolean(child))
      .sort((a, b) => a.order - b.order);

    if (children.length === 0 && !item.href) return null;
    return { ...item, children };
  }

  return { ...item };
}

export function buildNavigation(access: NavigationAccessContext): ResolvedNavigationItem[] {
  return NAVIGATION_CONFIG
    .map((item) => resolveItem(item, access))
    .filter((item): item is ResolvedNavigationItem => Boolean(item))
    .sort((a, b) => a.order - b.order);
}

