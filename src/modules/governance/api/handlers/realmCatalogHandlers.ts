import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

type RealmRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
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

async function buildUniqueRealmCode(name: string): Promise<string> {
  const seed = normalizeCodeSeed(name).slice(0, 40) || 'REINO';
  const rows = await prisma.$queryRaw<{ code: string }[]>(Prisma.sql`
    SELECT code
    FROM core.reino
    WHERE code = ${seed}
       OR code LIKE ${`${seed}_%`}
  `);

  const existing = new Set(rows.map((row) => row.code));
  if (!existing.has(seed)) return seed;

  let suffix = 2;
  while (existing.has(`${seed}_${suffix}`)) {
    suffix += 1;
  }
  return `${seed}_${suffix}`;
}

function mapRealm(row: RealmRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getGovernanceRealmCatalogHandler() {
  const rows = await prisma.$queryRaw<RealmRow[]>(Prisma.sql`
    SELECT id, code, name, description, is_active, created_at, updated_at
    FROM core.reino
    ORDER BY created_at ASC, code ASC
  `);

  return Response.json({
    items: rows.map(mapRealm),
  });
}

export async function postGovernanceRealmCatalogHandler(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  const name = String(body.name ?? '').trim();
  if (!name) {
    throw ApiError.badRequest('name is required');
  }

  const description = String(body.description ?? '').trim();
  const isActive = body.isActive !== false;
  const createdAt = String(body.createdAt ?? '').trim();
  const updatedAt = String(body.updatedAt ?? '').trim();
  const code = await buildUniqueRealmCode(name);

  const rows = await prisma.$queryRaw<RealmRow[]>(Prisma.sql`
    INSERT INTO core.reino (
      code,
      name,
      description,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      ${code},
      ${name},
      ${description || null},
      ${isActive},
      ${createdAt ? Prisma.sql`${createdAt}::timestamp` : Prisma.sql`now()`},
      ${updatedAt ? Prisma.sql`${updatedAt}::timestamp` : Prisma.sql`now()`}
    )
    RETURNING id, code, name, description, is_active, created_at, updated_at
  `);

  return Response.json({
    item: mapRealm(rows[0]),
  }, { status: 201 });
}

export async function putGovernanceRealmCatalogHandler(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  const id = String(body.id ?? '').trim();
  if (!id) {
    throw ApiError.badRequest('id is required');
  }

  const name = String(body.name ?? '').trim();
  if (!name) {
    throw ApiError.badRequest('name is required');
  }

  const description = String(body.description ?? '').trim();
  const isActive = body.isActive !== false;
  const createdAt = String(body.createdAt ?? '').trim();
  const updatedAt = String(body.updatedAt ?? '').trim();

  const existingRows = await prisma.$queryRaw<{ id: string; code: string }[]>(Prisma.sql`
    SELECT id, code
    FROM core.reino
    WHERE id = ${id}::uuid
    LIMIT 1
  `);
  const existing = existingRows[0];
  if (!existing) {
    throw ApiError.badRequest('Realm not found');
  }

  const rows = await prisma.$queryRaw<RealmRow[]>(Prisma.sql`
    UPDATE core.reino
    SET
      name = ${name},
      description = ${description || null},
      is_active = ${isActive},
      created_at = ${createdAt ? Prisma.sql`${createdAt}::timestamp` : Prisma.sql`created_at`},
      updated_at = ${updatedAt ? Prisma.sql`${updatedAt}::timestamp` : Prisma.sql`now()`}
    WHERE id = ${id}::uuid
    RETURNING id, code, name, description, is_active, created_at, updated_at
  `);

  return Response.json({
    item: mapRealm(rows[0]),
  });
}

export async function deleteGovernanceRealmCatalogHandler(request: Request) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') ?? '').trim();

  if (!id) {
    throw ApiError.badRequest('id is required');
  }

  const existingRows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id
    FROM core.reino
    WHERE id = ${id}::uuid
    LIMIT 1
  `);

  if (!existingRows[0]) {
    throw ApiError.badRequest('Realm not found');
  }

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM core.reino
    WHERE id = ${id}::uuid
  `);

  return Response.json({ ok: true });
}
