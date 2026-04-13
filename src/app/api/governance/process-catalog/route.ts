
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const reinoId = searchParams.get('reinoId');
    const domainId = searchParams.get('domainId');

    if (!companyId || !reinoId) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT DISTINCT
          d.id,
          d.code,
          d.name,
          d.id::text AS "domainId"
        FROM core.domain d
        JOIN core.map_reino_domain mrd
          ON mrd.domain_id = d.id
        JOIN core.map_company_x_reino mcr
          ON mcr.reino_id = mrd.reino_id
         AND mcr.company_id = ${companyId}::uuid
         AND COALESCE(mcr.is_active, true) = true
        WHERE mrd.reino_id = ${reinoId}::uuid
          AND COALESCE(d.status = 'active', true)
          AND (${domainId ? Prisma.sql`d.id = ${domainId}::uuid` : Prisma.sql`true`})
        ORDER BY d.code ASC, d.name ASC
      `
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading processes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
