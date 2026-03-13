import { NextResponse } from 'next/server';

/**
 * Returns the obligation ↔ risk mapping table
 * Used by the Corpus explorer for bidirectional cascading.
 */
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;

    const rows = await prisma.$queryRaw<
      { obligation_id: string; risk_id: string }[]
    >`
      SELECT obligation_id, risk_id
      FROM corpus.map_obligation_risk
      ORDER BY obligation_id, risk_id
    `;

    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching obligation-risk mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
  }
}
