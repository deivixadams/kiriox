import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

type DomainElementRow = {
  id: string;
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
  while (existing.has(`${seed}_${suffix}`)) suffix += 1;
  return `${seed}_${suffix}`;
}

async function upsertSignificantActivityMirror(input: {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  responsible?: string | null;
  frequency?: string | null;
}) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO core.significant_activity (
      significant_activity_id,
      company_id,
      activity_code,
      activity_name,
      activity_description,
      responsible,
      frequency,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      ${input.id}::uuid,
      ${input.companyId}::uuid,
      ${input.code},
      ${input.name},
      ${input.description},
      ${input.responsible ?? null},
      ${input.frequency ?? null},
      ${input.isActive},
      now(),
      now()
    )
    ON CONFLICT (significant_activity_id)
    DO UPDATE SET
      company_id = EXCLUDED.company_id,
      activity_code = EXCLUDED.activity_code,
      activity_name = EXCLUDED.activity_name,
      activity_description = EXCLUDED.activity_description,
      responsible = EXCLUDED.responsible,
      frequency = EXCLUDED.frequency,
      is_active = EXCLUDED.is_active,
      updated_at = now()
  `);
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
  const reinoId = String(url.searchParams.get('reinoId') ?? '').trim();
  const domainId = String(url.searchParams.get('domainId') ?? '').trim();
  const processId = String(url.searchParams.get('processId') ?? '').trim();
  if (!companyId) return Response.json({ items: [] });

  const rows = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
    SELECT DISTINCT
      de.id,
      de.code,
      de.name,
      de.title,
      de.description,
      COALESCE(de.is_active, true) AS is_active,
      de.id_lider::text AS id_lider,
      de.id_frequency::text AS id_frequency,
      de.created_at,
      de.updated_at
    FROM core.domain_elements de
    JOIN core.map_domain_element mde ON mde.element_id = de.id
    JOIN core.domain d ON d.id = mde.domain_id
    WHERE de.element_type = 'ACTIVITY'
      AND d.company_id = ${companyId}::uuid
      AND (${reinoId ? Prisma.sql`EXISTS (
        SELECT 1
        FROM views.empresa_reino_dominio_elementos v
        WHERE v.company_id = ${companyId}::uuid
          AND v.reino_id = ${reinoId}::uuid
          AND v.domain_id = d.id
      )` : Prisma.sql`true`})
      AND (${domainId ? Prisma.sql`d.id = ${domainId}::uuid` : Prisma.sql`true`})
      AND (${processId ? Prisma.sql`EXISTS (
        SELECT 1
        FROM views.empresa_reino_dominio_elementos v
        WHERE v.company_id = ${companyId}::uuid
          AND (${reinoId ? Prisma.sql`v.reino_id = ${reinoId}::uuid` : Prisma.sql`true`})
          AND (${domainId ? Prisma.sql`v.domain_id = ${domainId}::uuid` : Prisma.sql`true`})
          AND v.element_id = ${processId}::uuid
          AND v.domain_id = d.id
      )` : Prisma.sql`true`})
      AND COALESCE(de.is_active, true) = true
    ORDER BY de.code ASC
  `);

  return Response.json({ items: rows.map(mapRow) });
}

export async function postGovernanceKeyActivityCatalogHandler(request: Request) {
  const body = (await request.json()) as {
    companyId?: string;
    reinoId?: string;
    domainId?: string;
    processId?: string;
    activities?: Array<{
      code?: string;
      name?: string;
      description?: string;
      responsible?: string;
      frequency?: string;
      isActive?: boolean;
    }>;
  };

  const companyId = String(body.companyId ?? '').trim();
  const reinoId = String(body.reinoId ?? '').trim();
  const domainId = String(body.domainId ?? '').trim();
  const processId = String(body.processId ?? '').trim();
  if (!companyId || !reinoId || !domainId || !processId) {
    throw ApiError.badRequest('companyId, reinoId, domainId and processId are required');
  }

  const contextRows = await prisma.$queryRaw<Array<{ domain_id: string }>>(Prisma.sql`
    SELECT DISTINCT domain_id
    FROM views.empresa_reino_dominio_elementos
    WHERE company_id = ${companyId}::uuid
      AND reino_id = ${reinoId}::uuid
      AND domain_id = ${domainId}::uuid
      AND element_id = ${processId}::uuid
  `);
  if (contextRows.length === 0) {
    throw ApiError.badRequest('El proceso no pertenece al contexto empresa/reino/macroproceso seleccionado.');
  }
  const validatedDomainId = contextRows[0].domain_id;

  const activities = Array.isArray(body.activities) ? body.activities : [];
  const results: ReturnType<typeof mapRow>[] = [];

  for (const act of activities) {
    const name = String(act?.name ?? '').trim();
    if (!name) continue;
    const code = String(act?.code ?? '').trim() || (await buildUniqueElementCode(name));
    const id_lider = String(act?.responsible ?? '').trim() || null;
    const id_frequency = String(act?.frequency ?? '').trim() || null;
    const isActive = act?.isActive !== false;
    const description = String(act?.description ?? '').trim() || null;

    const inserted = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
      INSERT INTO core.domain_elements (
        element_type,
        code,
        name,
        title,
        description,
        is_active,
        id_lider,
        id_frequency,
        created_at,
        updated_at
      )
      VALUES (
        'ACTIVITY',
        ${code},
        ${name},
        ${name},
        ${description},
        ${isActive},
        ${id_lider ? Prisma.sql`${id_lider}::uuid` : null},
        ${id_frequency ? Prisma.sql`${id_frequency}::uuid` : null},
        now(),
        now()
      )
      RETURNING *
    `);

    const newElement = inserted[0];

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.map_domain_element (domain_id, element_id, is_primary, created_at, updated_at)
      VALUES (${validatedDomainId}::uuid, ${newElement.id}::uuid, true, now(), now())
      ON CONFLICT DO NOTHING
    `);

    await upsertSignificantActivityMirror({
      id: newElement.id,
      companyId,
      code: newElement.code,
      name: newElement.name || newElement.title || newElement.code,
      description: newElement.description ?? null,
      isActive: Boolean(newElement.is_active),
      responsible: id_lider,
      frequency: id_frequency,
    });

    results.push(mapRow(newElement));
  }

  return Response.json({ items: results }, { status: 201 });
}

export async function putGovernanceKeyActivityCatalogHandler(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    companyId?: string;
    code?: string;
    name?: string;
    description?: string;
    responsible?: string;
    frequency?: string;
    isActive?: boolean;
  };

  const id = String(body.id ?? '').trim();
  const companyId = String(body.companyId ?? '').trim();
  if (!id || !companyId) throw ApiError.badRequest('id and companyId are required');

  const code = String(body.code ?? '').trim();
  const name = String(body.name ?? '').trim();
  if (!code || !name) throw ApiError.badRequest('code and name are required');

  const description = String(body.description ?? '').trim() || null;
  const id_lider = String(body.responsible ?? '').trim() || null;
  const id_frequency = String(body.frequency ?? '').trim() || null;
  const isActive = body.isActive !== false;

  const updated = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
    UPDATE core.domain_elements
    SET
      code = ${code},
      name = ${name},
      title = ${name},
      description = ${description},
      id_lider = ${id_lider ? Prisma.sql`${id_lider}::uuid` : null},
      id_frequency = ${id_frequency ? Prisma.sql`${id_frequency}::uuid` : null},
      is_active = ${isActive},
      updated_at = now()
    WHERE id = ${id}::uuid
      AND element_type = 'ACTIVITY'
    RETURNING *
  `);
  if (!updated[0]) throw ApiError.notFound('Activity not found');

  await upsertSignificantActivityMirror({
    id,
    companyId,
    code,
    name,
    description,
    isActive,
    responsible: id_lider,
    frequency: id_frequency,
  });

  return Response.json({ item: mapRow(updated[0]) });
}

export async function deleteGovernanceKeyActivityCatalogHandler(request: Request) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') ?? '').trim();
  const companyId = String(url.searchParams.get('companyId') ?? '').trim();
  if (!id) throw ApiError.badRequest('id is required');

  await prisma.$executeRaw(Prisma.sql`
    UPDATE core.domain_elements
    SET is_active = false, updated_at = now()
    WHERE id = ${id}::uuid
      AND element_type = 'ACTIVITY'
  `);

  if (companyId) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE core.significant_activity
      SET is_active = false, updated_at = now()
      WHERE significant_activity_id = ${id}::uuid
        AND company_id = ${companyId}::uuid
    `);
  } else {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE core.significant_activity
      SET is_active = false, updated_at = now()
      WHERE significant_activity_id = ${id}::uuid
    `);
  }

  return Response.json({ ok: true });
}
