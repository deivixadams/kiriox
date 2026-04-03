import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'risk.linear.read', async () => {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await prisma.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        SELECT c.id::text AS id, c.name
        FROM security.company c
        WHERE COALESCE(c.is_active, true) = true
        ORDER BY c.name ASC
      `
    );

    const companies = rows.length > 0
      ? rows
      : [{ id: auth.tenantId, name: 'Empresa actual' }];

    return NextResponse.json({
      companies,
    });
  })
);
