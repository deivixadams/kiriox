import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

export async function getCompaniesWithMappingsHandler() {
  const [companies, mappings] = await Promise.all([
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT c.id, c.code, c.name
      FROM core.company c
      WHERE c.is_active = true
      ORDER BY c.name ASC
    `),
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT m.id, m.company_id, m.reino_id, r.name as realm_name
      FROM core.map_company_x_reino m
      INNER JOIN core.reino r ON m.reino_id = r.id
      WHERE m.is_active = true
    `),
  ]);

  return Response.json({
    companies: companies.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      mappings: mappings
        .filter(m => m.company_id === c.id)
        .map(m => ({
          id: m.id,
          realmName: m.realm_name
        }))
    }))
  });
}

export async function deleteCompanyHandler(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');

  if (!companyId) {
    throw ApiError.badRequest('companyId is required');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Remove mappings
    await tx.$executeRaw(Prisma.sql`
      DELETE FROM core.map_company_x_reino
      WHERE company_id = ${companyId}::uuid
    `);

    // 2. Remove company
    await tx.$executeRaw(Prisma.sql`
      DELETE FROM core.company
      WHERE id = ${companyId}::uuid
    `);

    return { ok: true };
  });
}
