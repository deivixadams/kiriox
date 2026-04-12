
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
        SELECT DISTINCT reino_id as id, reino_name as name, reino_code as code
        FROM views.empresa_reino_dominio_elementos
        WHERE company_id = ${companyId}::uuid
        ORDER BY reino_code ASC
      `
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading reinos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
