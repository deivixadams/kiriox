import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

type DomainElementRow = {
  id: string;
  element_type: string;
  code: string;
  name: string | null;
  title: string | null;
  description: string | null;
  is_active: boolean;
  id_lider: string | null;
  id_frequency: string | null;
  created_at: Date;
  updated_at: Date;
};

function normalizeCodeSeed(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

async function buildUniqueElementCode(name: string): Promise<string> {
  const seed = normalizeCodeSeed(name).slice(0, 40) || 'ACT';
  const rows = await prisma.$queryRaw<{ code: string }[]>(Prisma.sql`
    SELECT code
    FROM core.domain_elements
    WHERE code = ${seed} OR code LIKE ${`${seed}_%`}
  `);

  const existing = new Set(rows.map((row) => row.code));
  if (!existing.has(seed)) return seed;

  let suffix = 2;
  while (existing.has(`${seed}_${suffix}`)) {
    suffix += 1;
  }
  return `${seed}_${suffix}`;
}

function mapRow(row: DomainElementRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name || row.title || '',
    description: row.description ?? '',
    responsible: row.id_lider ?? '',
    frequency: row.id_frequency ?? '',
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getGovernanceKeyActivityCatalogHandler(request: Request) {
  const url = new URL(request.url);
  const companyId = String(url.searchParams.get('companyId') ?? '').trim();

  if (!companyId) {
    return Response.json({ items: [] });
  }

  const rows = await prisma.$queryRaw<KeyActivityRow[]>(Prisma.sql`
    SELECT
      significant_activity_id,
      company_id,
      activity_code,
      activity_name,
      activity_description,
      responsible,
      frequency,
      risk_weight,
      cascade_factor,
      is_cascade,
      is_active,
      created_at,
      updated_at
    FROM core.significant_activity
    WHERE company_id = ${companyId}::uuid
    ORDER BY created_at ASC, activity_code ASC
  `);

  return Response.json({ items: rows.map(mapRow) });
}

export async function postGovernanceKeyActivityCatalogHandler(request: Request) {
  const body = (await request.json()) as {
    batch?: boolean;
    companyId?: string;
    processId?: string;
    activities?: any[];
  };

  const companyId = String(body.companyId ?? '').trim();
  const processId = String(body.processId ?? '').trim();
  
  if (!companyId || !processId) throw ApiError.badRequest('companyId and processId are required');

  // Find the Domain (Macroproceso) for this process to link the activities
  const domainRows = await prisma.$queryRaw<{ domain_id: string }[]>(Prisma.sql`
    SELECT DISTINCT domain_id 
    FROM views.empresa_reino_dominio_elementos 
    WHERE element_id = ${processId}::uuid
  `);
  
  if (domainRows.length === 0) throw ApiError.badRequest('Process domain not found');
  const domainId = domainRows[0].domain_id;

  const activities = Array.isArray(body.activities) ? body.activities : [];
  const results = [];

  for (const act of activities) {
    const code = await buildUniqueElementCode(act.name);
    const id_lider = String(act.responsible ?? '').trim() || null;
    const id_frequency = String(act.frequency ?? '').trim() || null;

    // 1. Insert into domain_elements
    const inserted = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
      INSERT INTO core.domain_elements (
        element_type,
        code,
        name,
        title,
        description,
        is_active,
        is_hard_gate,
        id_lider,
        id_frequency,
        created_at,
        updated_at
      )
      VALUES (
        'ACTIVITY',
        ${code},
        ${act.name},
        ${act.name},
        ${act.description || null},
        ${act.isActive !== false},
        ${act.isHardGate === true},
        ${id_lider ? Prisma.sql`${id_lider}::uuid` : null},
        ${id_frequency ? Prisma.sql`${id_frequency}::uuid` : null},
        now(),
        now()
      )
      RETURNING *
    `);

    const newElementId = inserted[0].id;

    // 2. Link to Domain
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.map_domain_element (domain_id, element_id)
      VALUES (${domainId}::uuid, ${newElementId}::uuid)
    `);

    results.push(mapRow(inserted[0]));
  }

  return Response.json({ items: results }, { status: 201 });
}

export async function putGovernanceKeyActivityCatalogHandler(request: Request) {
  return Response.json({ message: 'Use POST with batch mode or a dedicated update handler.' }, { status: 405 });
}

export async function deleteGovernanceKeyActivityCatalogHandler(request: Request) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') ?? '').trim();
  if (!id) throw ApiError.badRequest('id is required');

  // Delete element and mapping
  await prisma.$executeRaw(Prisma.sql`DELETE FROM core.map_domain_element WHERE element_id = ${id}::uuid`);
  await prisma.$executeRaw(Prisma.sql`DELETE FROM core.domain_elements WHERE id = ${id}::uuid`);

  return Response.json({ ok: true });
}
