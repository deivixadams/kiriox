import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type ParameterDefinition = {
  id: string;
  code: string;
  data_type_code: string;
  min_numeric: number | null;
  max_numeric: number | null;
  default_numeric: number | null;
  default_boolean: boolean | null;
  default_text: string | null;
  default_jsonb: any | null;
};

function parseBoolean(value: FormDataEntryValue | null, fallback: boolean | null) {
  if (value === null) return fallback;
  const raw = value.toString().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'on' || raw === 'si' || raw === 'sí') return true;
  if (raw === 'false' || raw === '0' || raw === 'off' || raw === 'no') return false;
  return fallback;
}

export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const formData = await request.formData();

    const profileCode = formData.get('profile_code')?.toString().trim();
    const profileName = formData.get('profile_name')?.toString().trim();
    const profileDescription = formData.get('profile_description')?.toString().trim() || null;
    const activateProfile = formData.get('activate_profile') !== null;

    if (!profileCode || !profileName) {
      return NextResponse.json({ error: 'Missing profile_code or profile_name' }, { status: 400 });
    }

    const activeProfile = await prisma.$queryRaw<
      Array<{ id: string; code: string; version_no: number | null }>
    >(Prisma.sql`
      SELECT id, code, version_no
      FROM params.profile
      WHERE is_active = true
      LIMIT 1
    `);

    if (!activeProfile[0]) {
      return NextResponse.json({ error: 'No active profile found' }, { status: 400 });
    }

    const definitions = await prisma.$queryRaw<ParameterDefinition[]>(
      Prisma.sql`
        SELECT
          id,
          code,
          data_type_code,
          min_numeric,
          max_numeric,
          default_numeric,
          default_boolean,
          default_text,
          default_jsonb
        FROM params.parameter_definition
        WHERE is_active = true
        ORDER BY group_code NULLS LAST, sort_order NULLS LAST, code
      `
    );

    const values = definitions.map((def) => {
      const key = `param_${def.code}`;
      const raw = formData.get(key);

      if (def.data_type_code === 'BOOLEAN') {
        return {
          defId: def.id,
          numeric_value: null,
          boolean_value: parseBoolean(raw, def.default_boolean),
          text_value: null,
          jsonb_value: null,
        };
      }

      if (def.data_type_code === 'TEXT') {
        return {
          defId: def.id,
          numeric_value: null,
          boolean_value: null,
          text_value: raw?.toString() ?? def.default_text ?? null,
          jsonb_value: null,
        };
      }

      if (def.data_type_code === 'JSONB') {
        const parsed = raw ? JSON.parse(raw.toString()) : def.default_jsonb ?? null;
        return {
          defId: def.id,
          numeric_value: null,
          boolean_value: null,
          text_value: null,
          jsonb_value: parsed,
        };
      }

      const numeric = raw === null || raw === '' ? def.default_numeric : Number(raw);
      if (numeric === null || Number.isNaN(numeric)) {
        throw new Error(`Valor inválido para ${def.code}`);
      }
      if (def.min_numeric !== null && numeric < Number(def.min_numeric)) {
        throw new Error(`Valor menor al mínimo para ${def.code}`);
      }
      if (def.max_numeric !== null && numeric > Number(def.max_numeric)) {
        throw new Error(`Valor mayor al máximo para ${def.code}`);
      }

      return {
        defId: def.id,
        numeric_value: numeric,
        boolean_value: null,
        text_value: null,
        jsonb_value: null,
      };
    });

    const baseProfile = activeProfile[0];
    const newVersionNo = (baseProfile.version_no ?? 0) + 1;

    await prisma.$transaction(async (tx) => {
      const inserted = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO params.profile (
          code,
          name,
          description,
          parent_profile_id,
          version_no,
          is_active,
          activated_at,
          is_official,
          is_default,
          is_locked
        )
        VALUES (
          ${profileCode},
          ${profileName},
          ${profileDescription},
          ${baseProfile.id}::uuid,
          ${newVersionNo},
          false,
          null,
          false,
          false,
          false
        )
        RETURNING id
      `);

      const newProfileId = inserted[0]?.id;
      if (!newProfileId) {
        throw new Error('No se pudo crear el perfil');
      }

      for (const value of values) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO params.profile_parameter_value (
            profile_id,
            parameter_definition_id,
            numeric_value,
            boolean_value,
            text_value,
            jsonb_value
          )
          VALUES (
            ${newProfileId}::uuid,
            ${value.defId}::uuid,
            ${value.numeric_value},
            ${value.boolean_value},
            ${value.text_value},
            ${value.jsonb_value}
          )
        `);
      }

      await tx.$executeRaw(Prisma.sql`
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
        WHERE p.id = ${newProfileId}::uuid
        GROUP BY p.id, p.code
      `);

      if (activateProfile) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE params.profile
          SET is_active = false
          WHERE id <> ${newProfileId}::uuid
        `);

        await tx.$executeRaw(Prisma.sql`
          UPDATE params.profile
          SET is_active = true,
              activated_at = now()
          WHERE id = ${newProfileId}::uuid
        `);
      }
    });

    const redirectUrl = new URL('/modelo/parametros', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error creating new parameter version:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create version' }, { status: 500 });
  }
}
