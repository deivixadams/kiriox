import { withAccess } from './withAccess';

type RouteContext = { params?: unknown } | undefined;
type RouteHandler = (request: Request, context?: RouteContext) => Promise<Response> | Response;
type LegacyModuleKey =
  | 'core'
  | 'governance'
  | 'security'
  | 'benchmark'
  | 'risk'
  | 'linear-risk'
  | 'structural-risk'
  | 'audit'
  | 'alerts'
  | 'simulation';

function normalizeModule(moduleKey: LegacyModuleKey) {
  if (moduleKey === 'risk') return 'structural-risk' as const;
  return moduleKey;
}

function normalizePermission(moduleKey: LegacyModuleKey, permission: string): string {
  if (permission.includes('.')) return permission;
  return `${normalizeModule(moduleKey)}.${permission}`;
}

export function withModuleAccess(moduleKey: LegacyModuleKey, permission: string, handler: RouteHandler): RouteHandler {
  return withAccess(
    {
      module: normalizeModule(moduleKey),
      permission: normalizePermission(moduleKey, permission),
    },
    (request, context) => handler(request, context)
  );
}
