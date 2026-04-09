import prisma from '@/infrastructure/db/prisma/client';
import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('linear-risk', 'read', async (_request, _context, access) => {
    const rows = await prisma.macro_process.findMany({
      where: { company_id: access.company.id },
      orderBy: { sequence_order: 'asc' },
    });

    return Response.json({ rows });
  })
);

export const POST = nextHandler(
  withModuleAccess('linear-risk', 'write', async (request, _context, access) => {
    const payload = await request.json();

    const row = await prisma.macro_process.create({
      data: {
        company_id: access.company.id,
        macro_process_code: String(payload.macro_process_code || '').trim(),
        macro_process_name: String(payload.macro_process_name || '').trim(),
        macro_process_description: payload.macro_process_description || null,
        rationale: payload.rationale ?? null,
        sequence_order: payload.sequence_order ?? null,
        is_active: payload.is_active ?? true,
      },
    });

    return Response.json({ row }, { status: 201 });
  })
);
