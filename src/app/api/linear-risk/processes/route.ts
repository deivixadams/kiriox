import prisma from '@/infrastructure/db/prisma/client';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'read', async (_request, _context, access) => {
    const rows = await prisma.process.findMany({
      where: { company_id: access.company.id },
      orderBy: { sequence_order: 'asc' },
    });

    return Response.json({ rows });
  })
);

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'write', async (request, _context, access) => {
    const payload = await request.json();

    const row = await prisma.process.create({
      data: {
        company_id: access.company.id,
        process_code: String(payload.process_code || '').trim(),
        process_name: String(payload.process_name || '').trim(),
        process_description: payload.process_description || null,
        process_owner_user_id: payload.process_owner_user_id || null,
        rationale: payload.rationale ?? null,
        sequence_order: payload.sequence_order ?? null,
        is_active: payload.is_active ?? true,
      },
    });

    return Response.json({ row }, { status: 201 });
  })
);
