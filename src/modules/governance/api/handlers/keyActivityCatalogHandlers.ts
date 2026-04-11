import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

type KeyActivityRow = {
  significant_activity_id: string;
  company_id: string;
  activity_code: string;
  activity_name: string;
  activity_description: string | null;
  is_active: boolean;
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

async function buildUniqueActivityCode(companyId: string, name: string): Promise<string> {
  const seed = normalizeCodeSeed(name).slice(0, 40) || 'ACTIVIDAD';
  const rows = await prisma.$queryRaw<{ activity_code: string }[]>(Prisma.sql`
    SELECT activity_code
    FROM core.significant_activity
    WHERE company_id = ${companyId}::uuid
      AND (
        activity_code = ${seed}
        OR activity_code LIKE ${`${seed}_%`}
      )
  `);

  const existing = new Set(rows.map((row) => row.activity_code));
  if (!existing.has(seed)) return seed;

  let suffix = 2;
  while (existing.has(`${seed}_${suffix}`)) {
    suffix += 1;
  }
  return `${seed}_${suffix}`;
}

function mapRow(row: KeyActivityRow) {
  return {
    id: row.significant_activity_id,
    companyId: row.company_id,
    code: row.activity_code,
    name: row.activity_name,
    description: row.activity_description ?? '',
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
    companyId?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  const companyId = String(body.companyId ?? '').trim();
  if (!companyId) throw ApiError.badRequest('companyId is required');

  const name = String(body.name ?? '').trim();
  if (!name) throw ApiError.badRequest('name is required');

  const description = String(body.description ?? '').trim();
  const isActive = body.isActive !== false;
  const createdAt = String(body.createdAt ?? '').trim();
  const updatedAt = String(body.updatedAt ?? '').trim();
  const code = await buildUniqueActivityCode(companyId, name);

  const rows = await prisma.$queryRaw<KeyActivityRow[]>(Prisma.sql`
    INSERT INTO core.significant_activity (
      company_id,
      activity_code,
      activity_name,
      activity_description,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      ${companyId}::uuid,
      ${code},
      ${name},
      ${description || null},
      ${isActive},
      ${createdAt ? Prisma.sql`${createdAt}::timestamp` : Prisma.sql`now()`},
      ${updatedAt ? Prisma.sql`${updatedAt}::timestamp` : Prisma.sql`now()`}
    )
    RETURNING
      significant_activity_id,
      company_id,
      activity_code,
      activity_name,
      activity_description,
      is_active,
      created_at,
      updated_at
  `);

  return Response.json({ item: mapRow(rows[0]) }, { status: 201 });
}

export async function putGovernanceKeyActivityCatalogHandler(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    companyId?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  const id = String(body.id ?? '').trim();
  if (!id) throw ApiError.badRequest('id is required');

  const companyId = String(body.companyId ?? '').trim();
  if (!companyId) throw ApiError.badRequest('companyId is required');

  const name = String(body.name ?? '').trim();
  if (!name) throw ApiError.badRequest('name is required');

  const description = String(body.description ?? '').trim();
  const isActive = body.isActive !== false;
  const createdAt = String(body.createdAt ?? '').trim();
  const updatedAt = String(body.updatedAt ?? '').trim();

  const rows = await prisma.$queryRaw<KeyActivityRow[]>(Prisma.sql`
    UPDATE core.significant_activity
    SET
      company_id = ${companyId}::uuid,
      activity_name = ${name},
      activity_description = ${description || null},
      is_active = ${isActive},
      created_at = ${createdAt ? Prisma.sql`${createdAt}::timestamp` : Prisma.sql`created_at`},
      updated_at = ${updatedAt ? Prisma.sql`${updatedAt}::timestamp` : Prisma.sql`now()`}
    WHERE significant_activity_id = ${id}::uuid
    RETURNING
      significant_activity_id,
      company_id,
      activity_code,
      activity_name,
      activity_description,
      is_active,
      created_at,
      updated_at
  `);

  if (!rows[0]) throw ApiError.badRequest('Key activity not found');
  return Response.json({ item: mapRow(rows[0]) });
}

export async function deleteGovernanceKeyActivityCatalogHandler(request: Request) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') ?? '').trim();
  if (!id) throw ApiError.badRequest('id is required');

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM core.significant_activity
    WHERE significant_activity_id = ${id}::uuid
  `);

  return Response.json({ ok: true });
}

