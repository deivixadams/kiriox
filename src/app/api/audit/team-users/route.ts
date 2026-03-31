import { Prisma } from '@prisma/client';
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
    const rows = await prisma.$queryRaw<
      {
        id: string;
        email: string;
        name: string | null;
        last_name: string | null;
        role_code: string | null;
      }[]
    >(Prisma.sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.last_name,
        r.code AS role_code
      FROM security.company_user cu
      JOIN security.security_users u
        ON u.id = cu.user_id
       AND COALESCE(u.is_active, true) = true
      LEFT JOIN security.company_user_role cur
        ON cur.company_id = cu.company_id
       AND cur.user_id = cu.user_id
       AND COALESCE(cur.is_active, true) = true
      LEFT JOIN security.role r
        ON r.id = cur.role_id
       AND COALESCE(r.is_active, true) = true
      WHERE cu.company_id = ${companyId}::uuid
        AND COALESCE(cu.is_active, true) = true
      ORDER BY u.name ASC NULLS LAST
    `);

    const shapedMap = new Map<
      string,
      {
        id: string;
        email: string;
        name: string | null;
        lastName: string | null;
        role: { roleCode: string } | null;
      }
    >();

    for (const row of rows) {
      if (!shapedMap.has(row.id)) {
        shapedMap.set(row.id, {
          id: row.id,
          email: row.email,
          name: row.name,
          lastName: row.last_name,
          role: row.role_code ? { roleCode: row.role_code } : null,
        });
      }
    }

    return NextResponse.json(Array.from(shapedMap.values()));
  } catch (error: any) {
    console.error('Error fetching team users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = nextHandler(withModuleAccess('audit', 'read', teamUsersHandler));

