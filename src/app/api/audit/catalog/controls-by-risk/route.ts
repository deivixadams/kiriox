import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type ControlRow = {
  risk_id: string;
  control_id: string;
  name: string;
  description: string | null;
};

type Payload = {
  riskIds?: string[];
};

export async function POST(request: Request) {
  try {
    const { riskIds = [] } = (await request.json()) as Payload;
    if (riskIds.length === 0) {
      return NextResponse.json({ byRisk: {} });
    }

    const prisma = (await import('@/lib/prisma')).default;
    const rows = await prisma.$queryRaw<ControlRow[]>(Prisma.sql`
      SELECT
        crm.risk_id,
        c.id AS control_id,
        c.name,
        c.description
      FROM corpus.corpus_control_risk_map crm
      JOIN corpus.corpus_control c ON c.id = crm.control_id
      WHERE crm.risk_id = ANY(${riskIds}::uuid[])
      ORDER BY crm.risk_id, c.name ASC
    `);

    const byRisk: Record<string, { id: string; name: string; description?: string | null }[]> = {};
    (rows || []).forEach((row) => {
      if (!byRisk[row.risk_id]) {
        byRisk[row.risk_id] = [];
      }
      byRisk[row.risk_id].push({
        id: row.control_id,
        name: row.name,
        description: row.description
      });
    });

    return NextResponse.json({ byRisk });
  } catch (error: any) {
    console.error('Error fetching controls by risk:', error);
    return NextResponse.json({ error: 'Failed to fetch controls' }, { status: 500 });
  }
}
