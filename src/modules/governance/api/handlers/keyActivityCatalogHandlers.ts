import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

type DomainElementRow = {
  id: string;
  code: string;
  name: string | null;
  title: string | null;
  description: string | null;
  rationale: unknown;
  is_active: boolean;
  is_hard_gate: boolean | null;
  criticality: number | null;
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


function mapRow(row: DomainElementRow) {
  const rationale =
    row.rationale && typeof row.rationale === 'object' && !Array.isArray(row.rationale)
      ? (row.rationale as Record<string, unknown>)
      : {};
  const cascadeFactorRaw = rationale.cascadeFactor;
  const riskWeightRaw = rationale.riskWeight;
  const cascadeFactor =
    typeof cascadeFactorRaw === 'number'
      ? String(cascadeFactorRaw)
      : typeof cascadeFactorRaw === 'string'
        ? cascadeFactorRaw
        : '0';
  const rationaleRiskWeight =
    typeof riskWeightRaw === 'number'
      ? String(Math.round(riskWeightRaw))
      : typeof riskWeightRaw === 'string'
        ? riskWeightRaw
        : '';

  return {
    id: row.id,
    code: row.code,
    name: row.name || row.title || '',
    description: row.description ?? '',
    responsible: row.id_lider ?? '',
    frequency: row.id_frequency ?? '',
    riskWeight: row.criticality != null ? String(row.criticality) : rationaleRiskWeight || '1',
    cascadeFactor,
    isHardGate: Boolean(row.is_hard_gate),
    isCascade: Number(cascadeFactor) > 0,
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
  if (!companyId || !reinoId || (!domainId && !processId)) return Response.json({ items: [] });
  if (domainId && processId && domainId !== processId) return Response.json({ items: [] });

  const selectedDomainId = domainId || processId;

  const rows = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
    SELECT DISTINCT
      de.id,
      de.code,
      de.name,
      de.title,
      de.description,
      de.rationale,
      COALESCE(de.is_active, true) AS is_active,
      COALESCE(de.is_hard_gate, false) AS is_hard_gate,
      de.criticality,
      de.id_lider::text AS id_lider,
      de.id_frequency::text AS id_frequency,
      de.created_at,
      de.updated_at
    FROM core.map_company_x_reino mcr
    JOIN core.map_reino_domain mrd
      ON mrd.reino_id = mcr.reino_id
    JOIN core.domain d
      ON d.id = mrd.domain_id
    JOIN core.map_domain_element mde
      ON mde.domain_id = d.id
    JOIN core.domain_elements de
      ON de.id = mde.element_id
    WHERE de.element_type = 'ACTIVITY'
      AND mcr.company_id = ${companyId}::uuid
      AND mrd.reino_id = ${reinoId}::uuid
      AND d.id = ${selectedDomainId}::uuid
      AND COALESCE(mcr.is_active, true) = true
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
      riskWeight?: string | number;
      cascadeFactor?: string | number;
      isHardGate?: boolean;
      isActive?: boolean;
    }>;
  };

  const companyId = String(body.companyId ?? '').trim();
  const reinoId = String(body.reinoId ?? '').trim();
  const domainId = String(body.domainId ?? '').trim();
  const processId = String(body.processId ?? '').trim();
  if (!companyId || !reinoId || !domainId) {
    throw ApiError.badRequest('companyId, reinoId and domainId are required');
  }

  const contextRows = await prisma.$queryRaw<Array<{ domain_id: string }>>(Prisma.sql`
    SELECT mrd.domain_id
    FROM core.map_reino_domain mrd
    JOIN core.map_company_x_reino mcr
      ON mcr.reino_id = mrd.reino_id
     AND mcr.company_id = ${companyId}::uuid
     AND COALESCE(mcr.is_active, true) = true
    WHERE mrd.reino_id = ${reinoId}::uuid
      AND mrd.domain_id = ${domainId}::uuid
    LIMIT 1
  `);
  if (contextRows.length === 0) {
    throw ApiError.badRequest('El proceso no pertenece al contexto empresa/macroproceso seleccionado.');
  }
  const validatedDomainId = contextRows[0].domain_id;
  if (processId && processId !== validatedDomainId) {
    throw ApiError.badRequest('processId no coincide con el proceso seleccionado.');
  }

  const activities = Array.isArray(body.activities) ? body.activities : [];
  const results: ReturnType<typeof mapRow>[] = [];

  for (const act of activities) {
    const name = String(act?.name ?? '').trim();
    if (!name) continue;
    const code = await buildUniqueElementCode(name);
    const id_lider = String(act?.responsible ?? '').trim() || null;
    const id_frequency = String(act?.frequency ?? '').trim() || null;
    const isActive = act?.isActive !== false;
    const isHardGate = act?.isHardGate === true;
    const description = String(act?.description ?? '').trim() || null;
    const riskWeightRaw = Number(act?.riskWeight);
    const riskWeight =
      Number.isFinite(riskWeightRaw) && riskWeightRaw >= 1 && riskWeightRaw <= 5
        ? Math.round(riskWeightRaw)
        : 1;
    const cascadeFactorRaw = Number(act?.cascadeFactor);
    const cascadeFactor =
      Number.isFinite(cascadeFactorRaw) && cascadeFactorRaw >= 0 && cascadeFactorRaw <= 1
        ? cascadeFactorRaw
        : 0;

    const inserted = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
      INSERT INTO core.domain_elements (
        id,
        element_type,
        code,
        name,
        title,
        description,
        rationale,
        is_active,
        is_hard_gate,
        criticality,
        id_lider,
        id_frequency,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        'ACTIVITY',
        ${code},
        ${name},
        ${name},
        ${description},
        jsonb_build_object(
          'riskWeight', ${riskWeight}::int,
          'cascadeFactor', ${cascadeFactor}::double precision
        ),
        ${isActive},
        ${isHardGate},
        ${riskWeight}::smallint,
        ${id_lider ? Prisma.sql`${id_lider}::uuid` : null},
        ${id_frequency ? Prisma.sql`${id_frequency}::uuid` : null},
        now(),
        now()
      )
      RETURNING *
    `);

    const newElement = inserted[0];

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.map_domain_element (id, map_code, domain_id, element_id, is_primary, created_at, updated_at)
      VALUES (gen_random_uuid(), ${`MDE-${newElement.id}`}, ${validatedDomainId}::uuid, ${newElement.id}::uuid, true, now(), now())
      ON CONFLICT DO NOTHING
    `);


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
    riskWeight?: string | number;
    cascadeFactor?: string | number;
    isHardGate?: boolean;
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
  const isHardGate = body.isHardGate === true;
  const riskWeightRaw = Number(body.riskWeight);
  const riskWeight =
    Number.isFinite(riskWeightRaw) && riskWeightRaw >= 1 && riskWeightRaw <= 5
      ? Math.round(riskWeightRaw)
      : 1;
  const cascadeFactorRaw = Number(body.cascadeFactor);
  const cascadeFactor =
    Number.isFinite(cascadeFactorRaw) && cascadeFactorRaw >= 0 && cascadeFactorRaw <= 1
      ? cascadeFactorRaw
      : 0;
  const isActive = body.isActive !== false;

  const updated = await prisma.$queryRaw<DomainElementRow[]>(Prisma.sql`
    UPDATE core.domain_elements
    SET
      code = ${code},
      name = ${name},
      title = ${name},
      description = ${description},
      rationale = jsonb_build_object(
        'riskWeight', ${riskWeight}::int,
        'cascadeFactor', ${cascadeFactor}::double precision
      ),
      id_lider = ${id_lider ? Prisma.sql`${id_lider}::uuid` : null},
      id_frequency = ${id_frequency ? Prisma.sql`${id_frequency}::uuid` : null},
      is_hard_gate = ${isHardGate},
      criticality = ${riskWeight}::smallint,
      is_active = ${isActive},
      updated_at = now()
    WHERE id = ${id}::uuid
      AND element_type = 'ACTIVITY'
    RETURNING *
  `);
  if (!updated[0]) throw ApiError.notFound('Activity not found');


  return Response.json({ item: mapRow(updated[0]) });
}

export async function deleteGovernanceKeyActivityCatalogHandler(request: Request) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') ?? '').trim();
  const companyId = String(url.searchParams.get('companyId') ?? '').trim();
  const reinoId = String(url.searchParams.get('reinoId') ?? '').trim();
  const domainId = String(url.searchParams.get('domainId') ?? '').trim();
  const processId = String(url.searchParams.get('processId') ?? '').trim();
  const selectedDomainId = domainId || processId;
  if (!id) throw ApiError.badRequest('id is required');
  if (!companyId || !reinoId || !selectedDomainId) {
    throw ApiError.badRequest('companyId, reinoId and process/domain are required');
  }

  const contextRows = await prisma.$queryRaw<Array<{ ok: number }>>(Prisma.sql`
    SELECT 1 AS ok
    FROM core.map_domain_element mde
    JOIN core.map_reino_domain mrd
      ON mrd.domain_id = mde.domain_id
    JOIN core.map_company_x_reino mcr
      ON mcr.reino_id = mrd.reino_id
    JOIN core.domain_elements de
      ON de.id = mde.element_id
    WHERE de.id = ${id}::uuid
      AND de.element_type = 'ACTIVITY'
      AND mde.domain_id = ${selectedDomainId}::uuid
      AND mrd.reino_id = ${reinoId}::uuid
      AND mcr.company_id = ${companyId}::uuid
      AND COALESCE(mcr.is_active, true) = true
    LIMIT 1
  `);
  if (!contextRows[0]) throw ApiError.notFound('Activity not found in selected context');

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM core.map_domain_element
    WHERE domain_id = ${selectedDomainId}::uuid
      AND element_id = ${id}::uuid
  `);

  const remainingMappings = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS total
    FROM core.map_domain_element
    WHERE element_id = ${id}::uuid
  `);

  if (Number(remainingMappings[0]?.total ?? 0) === 0) {
    try {
      await prisma.$executeRaw(Prisma.sql`
        DELETE FROM core.domain_elements
        WHERE id = ${id}::uuid
          AND element_type = 'ACTIVITY'
      `);
    } catch (error) {
      throw ApiError.badRequest(
        'No se pudo eliminar físicamente la actividad porque tiene dependencias en otras tablas.'
      );
    }
  }

  return Response.json({ ok: true, deletedPhysical: Number(remainingMappings[0]?.total ?? 0) === 0 });
}
