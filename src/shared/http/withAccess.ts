import { getAuthContext, isDevAuthBypassEnabled, type AuthContext } from '@/lib/auth-server';
import {
  AuthorizeUserUseCase,
  CheckCompanyMembershipUseCase,
  CheckModuleAccessUseCase,
  CheckPermissionUseCase,
  PrismaAccessControlRepository,
  type AccessRequirement,
  type ModuleCode,
} from '@/modules/security';
import { ApiError } from './ApiError';

type RouteContext = { params?: unknown } | undefined;
type RouteHandler = (request: Request, context?: RouteContext) => Promise<Response> | Response;
type AccessRouteHandler = (
  request: Request,
  context: RouteContext | undefined,
  access: AccessContext
) => Promise<Response> | Response;

export type AccessContext = {
  auth: AuthContext;
  user: { id: string; roleCode: string; email?: string };
  company: { id: string };
  access: AccessRequirement;
};

function resolveCompanyId(request: Request, auth: AuthContext): string {
  const url = new URL(request.url);
  const queryCompany = url.searchParams.get('company_id');
  const headerCompany = request.headers.get('x-company-id');
  const selected = queryCompany || headerCompany || auth.tenantId;

  if (!selected) {
    throw ApiError.forbidden('Company context missing');
  }

  return selected;
}

function normalizeModule(module: string): ModuleCode {
  if (module === 'risk') return 'structural-risk';
  return module as ModuleCode;
}

export function withAccess(requirement: AccessRequirement, handler: AccessRouteHandler): RouteHandler {
  return async (request: Request, context?: RouteContext) => {
    const auth = await getAuthContext();
    if (!auth) {
      throw ApiError.unauthorized();
    }

    const companyId = resolveCompanyId(request, auth);
    const moduleCode = normalizeModule(requirement.module);

    if (isDevAuthBypassEnabled()) {
      return handler(request, context, {
        auth,
        user: { id: auth.userId, roleCode: auth.roleCode, email: auth.email },
        company: { id: companyId },
        access: { module: moduleCode, permission: requirement.permission },
      });
    }

    const repository = new PrismaAccessControlRepository();
    const useCase = new AuthorizeUserUseCase(
      new CheckCompanyMembershipUseCase(repository),
      new CheckModuleAccessUseCase(repository),
      new CheckPermissionUseCase(repository)
    );

    const decision = await useCase.execute({
      userId: auth.userId,
      companyId,
      module: moduleCode,
      permission: requirement.permission,
    });

    if (!decision.allowed) {
      if (decision.reason === 'membership') {
        throw ApiError.forbidden('User is not a member of the selected company');
      }
      if (decision.reason === 'module') {
        throw ApiError.forbidden(`Module "${moduleCode}" is not enabled for this company`);
      }
      throw ApiError.forbidden(`Missing permission: ${requirement.permission}`);
    }

    return handler(request, context, {
      auth,
      user: { id: auth.userId, roleCode: auth.roleCode, email: auth.email },
      company: { id: companyId },
      access: { module: moduleCode, permission: requirement.permission },
    });
  };
}
