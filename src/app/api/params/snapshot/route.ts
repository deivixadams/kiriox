import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;

    const activeProfile = await prisma.$queryRaw<
      Array<{ id: string; code: string }>
    >(Prisma.sql`
      SELECT id, code
      FROM params.profile
      WHERE is_active = true
      LIMIT 1
    `);

    if (!activeProfile[0]) {
      return NextResponse.json({ error: 'No active profile found' }, { status: 400 });
    }

    const profile = activeProfile[0];

    await prisma.$queryRaw(Prisma.sql`
      INSERT INTO params.profile_snapshot (
        profile_id,
        profile_code,
        release_version,
        mathematical_model,
        algorithm_version,
        parameters_hash,
        parameter_values_json,
        created_at
      )
      SELECT
        p.id,
        p.code,
        p.code,
        'CRE_DETERMINISTIC_V1',
        '1.0',
        md5(jsonb_object_agg(d.code, v.numeric_value)::text),
        jsonb_object_agg(d.code, v.numeric_value),
        now()
      FROM params.profile p
      JOIN params.profile_parameter_value v
        ON v.profile_id = p.id
      JOIN params.parameter_definition d
        ON d.id = v.parameter_definition_id
      WHERE p.id = ${profile.id}::uuid
      GROUP BY p.id, p.code
    `);

    const redirectUrl = new URL('/modelo/parametros', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error creating profile snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}
