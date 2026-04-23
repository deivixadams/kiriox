import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContext } from '@/shared/http';

const DEFAULT_CONTEXT_CODE = 'GESTION_EVALUACION_RIESGO';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ContextoObjetoRow = {
  id: string;
  code: string;
  titulo_evaluacion: string;
  objeto_evaluado_id: string;
  objetivo_evaluacion: string;
  alcance: string;
  contexto_externo_especifico: string | null;
  contexto_interno_especifico: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
};

type ElementTypeRow = {
  id: string;
  code: string;
  name: string;
};

type ContextoObjetoPayload = {
  titulo_evaluacion?: unknown;
  objeto_evaluado_id?: unknown;
  objetivo_evaluacion?: unknown;
  alcance?: unknown;
  contexto_externo_especifico?: unknown;
  contexto_interno_especifico?: unknown;
};

function parseCodeFromRequest(request: Request): string {
  const code = new URL(request.url).searchParams.get('code');
  const parsed = (code || DEFAULT_CONTEXT_CODE).trim();
  return parsed.length > 0 ? parsed : DEFAULT_CONTEXT_CODE;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeOptionalText(value: unknown): string | null {
  const parsed = normalizeText(value);
  return parsed.length > 0 ? parsed : null;
}

function validatePayload(payload: ContextoObjetoPayload) {
  const tituloEvaluacion = normalizeText(payload.titulo_evaluacion);
  const objetoEvaluadoId = normalizeText(payload.objeto_evaluado_id);
  const objetivoEvaluacion = normalizeText(payload.objetivo_evaluacion);
  const alcance = normalizeText(payload.alcance);
  const contextoExternoEspecifico = normalizeOptionalText(payload.contexto_externo_especifico);
  const contextoInternoEspecifico = normalizeOptionalText(payload.contexto_interno_especifico);

  if (!tituloEvaluacion) throw new Error('El campo "Título de la evaluación" es obligatorio.');
  if (!objetoEvaluadoId || !UUID_REGEX.test(objetoEvaluadoId)) {
    throw new Error('El campo "Objeto evaluado" es obligatorio y debe ser UUID válido.');
  }
  if (!objetivoEvaluacion) throw new Error('El campo "Objetivo de la evaluación" es obligatorio.');
  if (!alcance) throw new Error('El campo "Alcance" es obligatorio.');

  return {
    tituloEvaluacion,
    objetoEvaluadoId,
    objetivoEvaluacion,
    alcance,
    contextoExternoEspecifico,
    contextoInternoEspecifico,
  };
}

async function getElementTypes() {
  return prisma.$queryRaw<ElementTypeRow[]>(Prisma.sql`
    SELECT id::text AS id, code, name
    FROM core._element_types
    WHERE status = true
    ORDER BY name ASC
  `);
}

async function getContextoObjetoByCode(code: string) {
  const rows = await prisma.$queryRaw<ContextoObjetoRow[]>(Prisma.sql`
    SELECT
      id::text AS id,
      code,
      titulo_evaluacion,
      objeto_evaluado_id::text AS objeto_evaluado_id,
      objetivo_evaluacion,
      alcance,
      contexto_externo_especifico,
      contexto_interno_especifico,
      is_active,
      created_by::text AS created_by,
      created_at,
      updated_at
    FROM core.contexto_objeto
    WHERE code = ${code}
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function getContextoObjetoHandler(request: Request) {
  const code = parseCodeFromRequest(request);
  const [item, elementTypes] = await Promise.all([getContextoObjetoByCode(code), getElementTypes()]);
  return NextResponse.json({ code, item, elementTypes });
}

export async function putContextoObjetoHandler(request: Request, access: AccessContext) {
  let payload: ContextoObjetoPayload;
  try {
    payload = (await request.json()) as ContextoObjetoPayload;
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  let values: ReturnType<typeof validatePayload>;
  try {
    values = validatePayload(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Datos inválidos.' }, { status: 400 });
  }

  const code = parseCodeFromRequest(request);
  const createdBy = access.user.id && UUID_REGEX.test(access.user.id) ? access.user.id : null;

  const rows = await prisma.$queryRaw<ContextoObjetoRow[]>(Prisma.sql`
    INSERT INTO core.contexto_objeto (
      id,
      code,
      titulo_evaluacion,
      objeto_evaluado_id,
      objetivo_evaluacion,
      alcance,
      contexto_externo_especifico,
      contexto_interno_especifico,
      is_active,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      ${code},
      ${values.tituloEvaluacion},
      ${values.objetoEvaluadoId}::uuid,
      ${values.objetivoEvaluacion},
      ${values.alcance},
      ${values.contextoExternoEspecifico},
      ${values.contextoInternoEspecifico},
      true,
      ${createdBy}::uuid,
      now(),
      now()
    )
    ON CONFLICT (code) DO UPDATE
    SET
      titulo_evaluacion = EXCLUDED.titulo_evaluacion,
      objeto_evaluado_id = EXCLUDED.objeto_evaluado_id,
      objetivo_evaluacion = EXCLUDED.objetivo_evaluacion,
      alcance = EXCLUDED.alcance,
      contexto_externo_especifico = EXCLUDED.contexto_externo_especifico,
      contexto_interno_especifico = EXCLUDED.contexto_interno_especifico,
      is_active = true,
      updated_at = now()
    RETURNING
      id::text AS id,
      code,
      titulo_evaluacion,
      objeto_evaluado_id::text AS objeto_evaluado_id,
      objetivo_evaluacion,
      alcance,
      contexto_externo_especifico,
      contexto_interno_especifico,
      is_active,
      created_by::text AS created_by,
      created_at,
      updated_at
  `);

  const item = rows[0] ?? null;
  const elementTypes = await getElementTypes();
  return NextResponse.json({ code, item, elementTypes });
}
