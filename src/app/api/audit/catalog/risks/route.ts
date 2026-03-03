import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type RiskRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  status: string;
  risk_type: string | null;
  risk_type_name: string | null;
  risk_layer_name: string | null;
  domain_ids: string[] | null;
};

type Payload = {
  domainIds?: string[];
  obligationIds?: string[];
  riskIds?: string[];
};

async function fetchRisks(domainIds: string[], obligationIds: string[], riskIds: string[]) {
  const prisma = (await import('@/lib/prisma')).default;
  const filters: Prisma.Sql[] = [];

  if (riskIds.length > 0) {
    filters.push(Prisma.sql`r.id = ANY(${riskIds}::uuid[])`);
  } else if (obligationIds.length > 0) {
    filters.push(Prisma.sql`orr.obligation_id = ANY(${obligationIds}::uuid[])`);
  } else if (domainIds.length > 0) {
    filters.push(Prisma.sql`o.domain_id = ANY(${domainIds}::uuid[])`);
  }

  const whereSql = filters.length
    ? Prisma.sql`WHERE ${Prisma.join(filters, Prisma.sql` AND `)}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<RiskRow[]>(Prisma.sql`
    SELECT
      r.id,
      r.code,
      r.name,
      r.description,
      r.status,
      r.risk_type,
      rt.name AS risk_type_name,
      rl.name AS risk_layer_name,
      COALESCE(
        array_agg(DISTINCT o.domain_id) FILTER (WHERE o.domain_id IS NOT NULL),
        ARRAY[]::uuid[]
      ) AS domain_ids
    FROM corpus.corpus_risk r
    LEFT JOIN corpus.corpus_catalog_risk_type rt ON rt.id = r.risk_type_id
    LEFT JOIN corpus.corpus_catalog_risk_layer rl ON rl.id = r.risk_layer_id
    LEFT JOIN corpus.corpus_obligation_risk orr ON orr.risk_id = r.id
    LEFT JOIN corpus.corpus_obligation o ON o.id = orr.obligation_id
    ${whereSql}
    GROUP BY r.id, r.code, r.name, r.description, r.status, r.risk_type, rt.name, rl.name
    ORDER BY r.name ASC
  `);

  return (rows || []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    riskTypeName: row.risk_type_name ?? row.risk_type ?? null,
    riskLayerName: row.risk_layer_name ?? null,
    domainIds: row.domain_ids ?? []
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domain_id');
    const obligationIds = searchParams.getAll('obligation_id');
    const riskIds = searchParams.getAll('risk_id');

    const normalized = await fetchRisks(domainIds, obligationIds, riskIds);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { domainIds = [], obligationIds = [], riskIds = [] } = (await request.json()) as Payload;
    const normalized = await fetchRisks(domainIds, obligationIds, riskIds);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}
