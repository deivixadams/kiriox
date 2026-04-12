
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const reinoId = searchParams.get('reinoId');

    if (!companyId || !reinoId) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT DISTINCT domain_id as id, domain_name as name, domain_code as code
        FROM views.empresa_reino_dominio_elementos
        WHERE company_id = ${companyId}::uuid
          AND reino_id = ${reinoId}::uuid
        ORDER BY domain_code ASC
      `
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading domains:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
