import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;

    const profiles = await prisma.$queryRaw<
      Array<{ id: string; code: string; name: string | null }>
    >(Prisma.sql`
      SELECT id, code, name
      FROM params.profile
      WHERE is_active = true
      LIMIT 1
    `);

    const profile = profiles[0];
    if (!profile) {
      return NextResponse.json({ profile: null, parameters: [] });
    }

    const parameters = await prisma.$queryRaw<
      Array<{ code: string; numeric_value: number | null }>
    >(Prisma.sql`
      SELECT pd.code, ppv.numeric_value
      FROM params.profile_parameter_value ppv
      JOIN params.parameter_definition pd
        ON pd.id = ppv.parameter_definition_id
      WHERE ppv.profile_id = ${profile.id}::uuid
      ORDER BY pd.sort_order NULLS LAST, pd.code
    `);

    return NextResponse.json({
      profile,
      parameters: parameters.map((p) => ({
        code: p.code,
        numeric_value: p.numeric_value === null ? null : Number(p.numeric_value),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching active params profile:', error);
    return NextResponse.json({ error: 'Failed to fetch params profile' }, { status: 500 });
  }
}
