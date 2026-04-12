
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id, title as name
        FROM core.frequency
        ORDER BY title ASC
      `
    );
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading frequency catalog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
