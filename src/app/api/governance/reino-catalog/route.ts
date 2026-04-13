
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT DISTINCT
          r.id,
          r.name,
          r.code
        FROM core.map_company_x_reino m
        JOIN core.reino r
          ON r.id = m.reino_id
        WHERE m.company_id = ${companyId}::uuid
          AND COALESCE(m.is_active, true) = true
          AND COALESCE(r.is_active, true) = true
        ORDER BY r.code ASC
      `
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading reinos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
