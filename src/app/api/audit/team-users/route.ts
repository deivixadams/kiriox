import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
  }

  if (!isAdmin(auth.roleCode) && auth.tenantId !== companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.securityUser.findMany({
      where: { tenantId: companyId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        roleCode: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching team users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
