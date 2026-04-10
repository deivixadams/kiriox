import prisma from '@/infrastructure/db/prisma/client';
import { nextHandler, withAccess } from '@/shared/http';

function toJsonSafe<T>(value: T): T {
  if (typeof value === 'bigint') {
    return Number(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toJsonSafe(entry)])
    ) as T;
  }
  return value;
}

export const GET = nextHandler(
  withAccess({ module: 'governance', permission: 'governance.objectives.read' }, async () => {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        risk_appetite_catalog_id,
        appetite_code,
        appetite_name,
        appetite_description,
        rationale,
        appetite_level,
        min_score,
        max_score,
        sequence_order,
        is_active,
        created_at,
        updated_at
      FROM core.risk_appetite_catalog
      WHERE is_active = true
      ORDER BY sequence_order NULLS LAST, appetite_level NULLS LAST, risk_appetite_catalog_id
    `);

    return Response.json({ data: toJsonSafe(rows) });
  })
);

