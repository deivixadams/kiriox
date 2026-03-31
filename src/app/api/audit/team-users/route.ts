import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { nextHandler, withModuleAccess } from '@/shared/http';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

const teamUsersHandler = async (request: Request) => {
  const auth = await getAuthContext();

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
  }

  if (!isAdmin(auth!.roleCode) && auth!.tenantId !== companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.securityUser.findMany({
      where: { tenant_id: companyId, is_active: true },
      select: {
        id: true,
        email: true,
        name: true,
        last_name: true,
        user_x_rbac: {
          select: {
            security_rbac: { select: { role_code: true } }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    const shaped = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      lastName: u.last_name,
      role: u.user_x_rbac?.[0]?.security_rbac?.role_code ? { roleCode: u.user_x_rbac[0].security_rbac.role_code } : null
    }));

    return NextResponse.json(shaped);
  } catch (error: any) {
    console.error('Error fetching team users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = nextHandler(
  withModuleAccess('audit', 'read', teamUsersHandler)
);
