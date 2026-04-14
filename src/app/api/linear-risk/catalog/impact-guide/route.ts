import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';

export async function GET() {
  try {
    const guideData = await prisma.$queryRaw<any[]>`
      WITH data AS (
          SELECT categoria, level, description, impact_score
          FROM core.catalog_impact_guia
      ),
      rows_out AS (
          SELECT
              categoria AS categoria_grupo,
              categoria,
              NULL::text AS level,
              NULL::text AS description,
              NULL::int AS impact_score,
              0 AS orden
          FROM (
              SELECT DISTINCT categoria
              FROM data
          ) c

          UNION ALL

          SELECT
              categoria AS categoria_grupo,
              NULL::text AS categoria,
              level,
              description,
              impact_score,
              1 AS orden
          FROM data
      )
      SELECT
          categoria,
          level,
          description,
          impact_score
      FROM rows_out
      ORDER BY
          categoria_grupo,
          orden,
          impact_score;
    `;

    return NextResponse.json(guideData);
  } catch (error: any) {
    console.error('Error fetching impact guide:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
