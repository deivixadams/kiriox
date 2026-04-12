
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const reinoId = searchParams.get('reinoId');
    const domainId = searchParams.get('domainId');

    if (!companyId || !reinoId || !domainId) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT DISTINCT
          element_id as id,
          element_code as code,
          COALESCE(element_title, element_name) AS name
        FROM views.empresa_reino_dominio_elementos
        WHERE company_id = ${companyId}::uuid
          AND reino_id = ${reinoId}::uuid
          AND domain_id = ${domainId}::uuid
        ORDER BY element_code ASC
      `
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading processes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
