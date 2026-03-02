import { NextResponse } from 'next/server';
type Payload = {
  domainIds?: string[];
  obligationIds?: string[];
};

export async function POST(request: Request) {
  try {
    const { domainIds = [], obligationIds = [] } = (await request.json()) as Payload;

    let resolvedObligationIds = obligationIds;
    if (resolvedObligationIds.length === 0 && domainIds.length > 0) {
      const prisma = (await import('@/lib/prisma')).default;
      const obligations = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM corpus.corpus_obligation
        WHERE domain_id = ANY(${domainIds}::uuid[])
      `;
      resolvedObligationIds = (obligations || []).map((o) => o.id);
    }

    const obligationCount = resolvedObligationIds.length;

    let riskCount = 0;
    let controlCount = 0;
    if (resolvedObligationIds.length > 0) {
      const prisma = (await import('@/lib/prisma')).default;
      const risks = await prisma.$queryRaw<{ risk_id: string }[]>`
        SELECT DISTINCT risk_id
        FROM corpus.corpus_obligation_risk
        WHERE obligation_id = ANY(${resolvedObligationIds}::uuid[])
      `;
      riskCount = (risks || []).length;

      const controls = await prisma.$queryRaw<{ control_id: string }[]>`
        SELECT control_id
        FROM corpus.corpus_control_obligation
        WHERE obligation_id = ANY(${resolvedObligationIds}::uuid[])
      `;
      controlCount = new Set((controls || []).map((c) => c.control_id)).size;
    }

    return NextResponse.json({
      obligationCount,
      riskCount,
      controlCount,
      testCount: 0,
    });
  } catch (error: any) {
    console.error('Error deriving scope:', error);
    return NextResponse.json({ error: 'Failed to derive scope' }, { status: 500 });
  }
}
