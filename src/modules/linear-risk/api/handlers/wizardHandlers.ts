
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { getAuthContext } from '@/lib/auth-server';
import { getCanonicalAuditDraftById, upsertCanonicalAuditDraft } from '@/modules/audit/infrastructure/repositories/linearRiskDraftStore';

type DraftRecord = {
  id: string;
  step: number;
  createdAt?: string;
  updatedAt?: string;
  companyId?: string | null;
  acta?: any;
  questionnaire?: any;
  manualExtensions?: any;
  notes?: any;
  windowStart?: string | null;
  windowEnd?: string | null;
};

type ActivityItemInput = {
  tempId?: string;
  significant_activity_id?: string | null;
  inherent_risk_catalog_id?: string | null;
  activity_code?: string;
  activity_name?: string;
  activity_description?: string;
  materiality_level?: string;
  materiality_weight?: number | null;
  materiality_justification?: string;
  inherent_risk_description?: string;
  inherent_probability?: number | null;
  inherent_impact?: number | null;
  inherent_risk_score?: number | null;
  sort_order?: number;
};

type EvaluationInput = {
  riskId: string;
  controlId: string;
  status: 'cumple' | 'parcial' | 'no_cumple' | '';
  notes?: string;
  howToEvaluate?: string;
};

type ExtensionInput = { title?: string; notes?: string };

type RiskRowInput = {
  rowId?: string;
  draftItemId: string;
  riskCatalogId: string;
  mitigatingControlId?: string | null;
  coveragePct?: number | null;
  residualScore?: number | null;
  probability?: number | null;
  impact?: number | null;
};

type SignificantActivityCatalogRow = {
  significant_activity_id: string;
  company_id: string;
  activity_code: string;
  activity_name: string;
  activity_description: string | null;
  is_active: boolean;
};

type RiskCatalogByActivityRow = {
  risk_catalog_id: string;
  significant_activity_id: string | null;
  risk_code: string | null;
  risk_name: string | null;
  risk_description: string | null;
  risk_category: string | null;
  is_active?: boolean;
};

type LinearDraftRow = {
  risk_assessment_draft_id: bigint;
  assessment_code: string;
  company_id: string | number | null;
  notes: string | null;
};

type DraftItemRow = {
  risk_assessment_draft_item_id: bigint;
  significant_activity_id: string;
  activity_code: string;
  activity_name: string;
};

type DraftInherentSeedRow = {
  risk_assessment_draft_item_id: bigint;
  significant_activity_id: string;
  activity_code: string;
  activity_name: string;
  activity_description: string | null;
  draft_item_notes: string | null;
  risk_assessment_draft_item_risk_id: bigint | null;
  risk_catalog_id: string | null;
  risk_code: string | null;
  risk_name: string | null;
  risk_description: string | null;
  probability_name: string | null;
  rationale: string | null;
  probability_value: number | null;
  impact_name: string | null;
  impact_value: number | null;
  inherent_risk_score: number | null;
};

let cacheDraftUuid: boolean | null = null;
let cacheActivityUuid: boolean | null = null;

function parseNotes(value: string | null) {
  if (!value) return {};
  try { return JSON.parse(value); } catch { return {}; }
}

function mapRiskLevel(score: number) {
  if (score >= 16) return 'alto';
  if (score >= 9) return 'medio';
  return 'bajo';
}

function normalizeMaterialityWeight(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 0) return 0;
  if (rounded > 100) return 100;
  return rounded;
}

async function ensureLinearRiskScaleCatalogs() {
  const [pCountRows, iCountRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM linear_risk.catalog_probability
      WHERE is_active = true
    `),
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM linear_risk.catalog_impact
      WHERE is_active = true
    `),
  ]);

  const pCount = Number(pCountRows[0]?.count ?? 0);
  const iCount = Number(iCountRows[0]?.count ?? 0);

  if (pCount === 0) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO linear_risk.catalog_probability (code, name, description, numeric_value, ordinal, is_active, created_at, updated_at)
      SELECT v.code, v.name, v.description, v.numeric_value, v.ordinal, true, now(), now()
      FROM (
        VALUES
          ('P1', 'Muy baja', 'Ocurrencia remota o excepcional.', 1.0::numeric, 1),
          ('P2', 'Baja', 'Ocurrencia poco frecuente.', 2.0::numeric, 2),
          ('P3', 'Media', 'Ocurrencia posible en condiciones normales.', 3.0::numeric, 3),
          ('P4', 'Alta', 'Ocurrencia frecuente.', 4.0::numeric, 4),
          ('P5', 'Muy alta', 'Ocurrencia casi cierta.', 5.0::numeric, 5)
      ) AS v(code, name, description, numeric_value, ordinal)
      WHERE NOT EXISTS (
        SELECT 1 FROM linear_risk.catalog_probability p WHERE p.code = v.code
      )
    `);
  }

  if (iCount === 0) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO linear_risk.catalog_impact (code, name, description, numeric_value, ordinal, is_active, created_at, updated_at)
      SELECT v.code, v.name, v.description, v.numeric_value, v.ordinal, true, now(), now()
      FROM (
        VALUES
          ('I1', 'Insignificante', 'Impacto mínimo sin efectos materiales.', 1.0::numeric, 1),
          ('I2', 'Menor', 'Impacto acotado y manejable.', 2.0::numeric, 2),
          ('I3', 'Moderado', 'Impacto relevante con afectación controlable.', 3.0::numeric, 3),
          ('I4', 'Mayor', 'Impacto severo con alta afectación operativa.', 4.0::numeric, 4),
          ('I5', 'Crítico', 'Impacto extremo con compromiso significativo.', 5.0::numeric, 5)
      ) AS v(code, name, description, numeric_value, ordinal)
      WHERE NOT EXISTS (
        SELECT 1 FROM linear_risk.catalog_impact i WHERE i.code = v.code
      )
    `);
  }
}

function defaultDraft(id: string, companyId: string): DraftRecord {
  return { id, step: 1, companyId, acta: null, questionnaire: [], manualExtensions: [], notes: {}, windowStart: null, windowEnd: null };
}

function mapEffectiveness(status: EvaluationInput['status']) {
  if (status === 'cumple') return 'effective';
  if (status === 'parcial') return 'partial';
  if (status === 'no_cumple') return 'ineffective';
  return 'not_evaluated';
}

async function isUuidCompany(tableName: 'risk_assessment_draft' | 'significant_activity') {
  if (tableName === 'risk_assessment_draft' && cacheDraftUuid !== null) return cacheDraftUuid;
  if (tableName === 'significant_activity' && cacheActivityUuid !== null) return cacheActivityUuid;

  const rows = await prisma.$queryRaw<{ data_type: string }[]>(Prisma.sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'linear_risk'
      AND table_name = ${tableName}
      AND column_name = 'company_id'
    LIMIT 1
  `);
  const isUuid = rows[0]?.data_type === 'uuid';
  if (tableName === 'risk_assessment_draft') cacheDraftUuid = isUuid;
  if (tableName === 'significant_activity') cacheActivityUuid = isUuid;
  return isUuid;
}

async function findDraft(id: string, tenantId: string): Promise<LinearDraftRow | null> {
  const rows = await prisma.$queryRaw<LinearDraftRow[]>(Prisma.sql`
    SELECT risk_assessment_draft_id, assessment_code, company_id, notes
    FROM linear_risk.risk_assessment_draft
    WHERE COALESCE(is_deleted, false) = false
      AND (assessment_code = ${id} OR assessment_code = ${`LR-WIZARD-${id}`} OR assessment_code = ${`AUDIT-WIZARD-${id}`})
    ORDER BY risk_assessment_draft_id DESC
    LIMIT 1
  `);
  const row = rows[0];
  if (!row) return null;
  const notes = parseNotes(row.notes);
  if (notes?.tenantId && notes.tenantId !== tenantId) return null;
  return row;
}

async function getItems(draftPk: bigint): Promise<DraftItemRow[]> {
  return prisma.$queryRaw<DraftItemRow[]>(Prisma.sql`
    SELECT di.risk_assessment_draft_item_id, di.significant_activity_id, sa.activity_code, sa.activity_name
    FROM linear_risk.risk_assessment_draft_item di
    JOIN linear_risk.significant_activity sa ON sa.significant_activity_id = di.significant_activity_id
    WHERE di.risk_assessment_draft_id = ${draftPk}
      AND COALESCE(di.is_deleted, false) = false
    ORDER BY di.sort_order ASC, di.risk_assessment_draft_item_id ASC
  `);
}

async function getInherentSeedRows(draftPk: bigint): Promise<DraftInherentSeedRow[]> {
  return prisma.$queryRaw<DraftInherentSeedRow[]>(Prisma.sql`
    SELECT
      di.risk_assessment_draft_item_id,
      di.significant_activity_id::text AS significant_activity_id,
      sa.activity_code,
      sa.activity_name,
      sa.activity_description,
      di.notes AS draft_item_notes,
      dir.risk_assessment_draft_item_risk_id,
      dir.risk_catalog_id::text AS risk_catalog_id,
      rc.risk_code,
      rc.risk_name,
      rc.risk_description,
      cp.name AS probability_name,
      dir.rationale,
      cp.numeric_value AS probability_value,
      ci.name AS impact_name,
      ci.numeric_value AS impact_value,
      dir.inherent_risk_score
    FROM linear_risk.risk_assessment_draft_item di
    JOIN linear_risk.significant_activity sa ON sa.significant_activity_id = di.significant_activity_id
    LEFT JOIN linear_risk.risk_assessment_draft_item_risk dir
      ON dir.risk_assessment_draft_item_id = di.risk_assessment_draft_item_id
    LEFT JOIN linear_risk.risk_catalog rc ON rc.risk_catalog_id = dir.risk_catalog_id
    LEFT JOIN linear_risk.catalog_probability cp ON cp.catalog_probability_id = dir.catalog_probability_id
    LEFT JOIN linear_risk.catalog_impact ci ON ci.catalog_impact_id = dir.catalog_impact_id
    WHERE di.risk_assessment_draft_id = ${draftPk}
      AND COALESCE(di.is_deleted, false) = false
    ORDER BY di.sort_order ASC, di.risk_assessment_draft_item_id ASC, dir.risk_assessment_draft_item_risk_id ASC
  `);
}

async function ensureFirstItem(draftPk: bigint, companyId: string): Promise<bigint> {
  const items = await getItems(draftPk);
  if (items[0]) return items[0].risk_assessment_draft_item_id;

  const activityUuid = await isUuidCompany('significant_activity');
  const act = activityUuid
    ? await prisma.$queryRaw<{ significant_activity_id: string }[]>(Prisma.sql`
        INSERT INTO linear_risk.significant_activity (company_id, activity_code, activity_name, activity_description, is_active, created_at, updated_at)
        VALUES (${companyId}::uuid, 'KX-PLACEHOLDER', 'Actividad placeholder', 'Generada automáticamente', true, now(), now())
        RETURNING significant_activity_id
      `)
    : await prisma.$queryRaw<{ significant_activity_id: string }[]>(Prisma.sql`
        INSERT INTO linear_risk.significant_activity (company_id, activity_code, activity_name, activity_description, is_active, created_at, updated_at)
        VALUES (1, 'KX-PLACEHOLDER', 'Actividad placeholder', 'Generada automáticamente', true, now(), now())
        RETURNING significant_activity_id
      `);

  const item = await prisma.$queryRaw<{ risk_assessment_draft_item_id: bigint }[]>(Prisma.sql`
    INSERT INTO linear_risk.risk_assessment_draft_item (
      risk_assessment_draft_id, significant_activity_id, materiality_level, materiality_weight, materiality_justification,
      sort_order, notes, created_at, updated_at, is_deleted
    ) VALUES (
      ${draftPk}, ${act[0].significant_activity_id}, 'media', 50, 'Item placeholder', 1, '{}', now(), now(), false
    ) RETURNING risk_assessment_draft_item_id
  `);
  return item[0].risk_assessment_draft_item_id;
}
async function updateWizardNotes(draftPk: bigint, patch: any) {
  const rows = await prisma.$queryRaw<LinearDraftRow[]>(Prisma.sql`
    SELECT risk_assessment_draft_id, notes, assessment_code, company_id
    FROM linear_risk.risk_assessment_draft
    WHERE risk_assessment_draft_id = ${draftPk}
    LIMIT 1
  `);
  const row = rows[0];
  if (!row) return;
  const notes = parseNotes(row.notes);
  const next = { ...notes, wizard: { ...(notes?.wizard || {}), ...patch } };
  await prisma.$executeRaw(Prisma.sql`
    UPDATE linear_risk.risk_assessment_draft
    SET notes = ${JSON.stringify(next)}, updated_at = now()
    WHERE risk_assessment_draft_id = ${draftPk}
  `);
}

export async function postCreateLinearRiskDraftHandler(auth: { tenantId: string; userId: string }) {
  try {
    const id = crypto.randomUUID();
    const draft = defaultDraft(id, auth.tenantId);
    await upsertCanonicalAuditDraft({ auditDraftId: id, tenantId: auth.tenantId, draft: draft as any });
    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error creating linear draft:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}

export async function getLinearRiskScalesHandler() {
  try {
    await ensureLinearRiskScaleCatalogs();

    const [probabilityCatalog, impactCatalog] = await Promise.all([
      prisma.$queryRaw<Array<{ catalog_probability_id: bigint; code: string; name: string; description: string | null; numeric_value: number; ordinal: number }>>(Prisma.sql`
        SELECT catalog_probability_id, code, name, description, numeric_value, ordinal
        FROM linear_risk.catalog_probability
        WHERE is_active = true
        ORDER BY ordinal ASC
      `),
      prisma.$queryRaw<Array<{ catalog_impact_id: bigint; code: string; name: string; description: string | null; numeric_value: number; ordinal: number }>>(Prisma.sql`
        SELECT catalog_impact_id, code, name, description, numeric_value, ordinal
        FROM linear_risk.catalog_impact
        WHERE is_active = true
        ORDER BY ordinal ASC
      `),
    ]);

    return NextResponse.json({
      probabilityCatalog: probabilityCatalog.map((p) => ({
        id: Number(p.catalog_probability_id),
        code: p.code,
        name: p.name,
        description: p.description,
        baseValue: Number(p.numeric_value),
        sortOrder: p.ordinal,
      })),
      impactCatalog: impactCatalog.map((i) => ({
        id: Number(i.catalog_impact_id),
        code: i.code,
        name: i.name,
        description: i.description,
        baseValue: Number(i.numeric_value),
        sortOrder: i.ordinal,
      })),
    });
  } catch (error) {
    console.error('Error loading linear-risk scales:', error);
    return NextResponse.json({ error: 'Failed to load scales catalog' }, { status: 500 });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getLinearRiskSignificantActivitiesCatalogHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const activityId = (url.searchParams.get('id') || '').trim();
    const companyId = (url.searchParams.get('companyId') || '').trim();
    const fallbackAll = url.searchParams.get('fallbackAll') === '1';
    if (UUID_REGEX.test(activityId)) {
      const rows = await prisma.$queryRaw<SignificantActivityCatalogRow[]>(Prisma.sql`
        SELECT
          sa.significant_activity_id,
          sa.company_id::text AS company_id,
          sa.activity_code,
          sa.activity_name,
          sa.activity_description,
          sa.is_active
        FROM linear_risk.significant_activity sa
        WHERE sa.significant_activity_id = ${activityId}::uuid
        LIMIT 1
      `);
      return NextResponse.json({
        items: rows.map((row) => ({
          id: row.significant_activity_id,
          company_id: row.company_id,
          activity_code: row.activity_code,
          activity_name: row.activity_name,
          activity_description: row.activity_description,
          is_active: Boolean(row.is_active),
        })),
      });
    }
    if (!UUID_REGEX.test(companyId) && !fallbackAll) {
      return NextResponse.json({ error: 'companyId es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }

    const rows = fallbackAll
      ? await prisma.$queryRaw<SignificantActivityCatalogRow[]>(Prisma.sql`
          SELECT
            sa.significant_activity_id,
            sa.company_id::text AS company_id,
            sa.activity_code,
            sa.activity_name,
            sa.activity_description,
            sa.is_active
          FROM linear_risk.significant_activity sa
          WHERE COALESCE(sa.is_active, true) = true
          ORDER BY sa.activity_code ASC, sa.activity_name ASC
        `)
      : await prisma.$queryRaw<SignificantActivityCatalogRow[]>(Prisma.sql`
          SELECT
            sa.significant_activity_id,
            sa.company_id::text AS company_id,
            sa.activity_code,
            sa.activity_name,
            sa.activity_description,
            sa.is_active
          FROM linear_risk.significant_activity sa
          WHERE sa.company_id = ${companyId}::uuid
            AND COALESCE(sa.is_active, true) = true
          ORDER BY sa.activity_code ASC, sa.activity_name ASC
        `);

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.significant_activity_id,
        company_id: row.company_id,
        activity_code: row.activity_code,
        activity_name: row.activity_name,
        activity_description: row.activity_description,
        is_active: Boolean(row.is_active),
      })),
    });
  } catch (error) {
    console.error('Error loading significant activities catalog:', error);
    return NextResponse.json({ error: 'No se pudo cargar el catalogo de actividades.' }, { status: 500 });
  }
}

export async function postLinearRiskSignificantActivitiesCatalogHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      company_id?: string;
      activity_code?: string;
      activity_name?: string;
      activity_description?: string | null;
      is_active?: boolean;
    };

    const companyId = String(body.company_id || '').trim();
    const activityCode = String(body.activity_code || '').trim();
    const activityName = String(body.activity_name || '').trim();
    const activityDescription = typeof body.activity_description === 'string' ? body.activity_description.trim() : '';
    const isActive = body.is_active === false ? false : true;

    if (!UUID_REGEX.test(companyId)) {
      return NextResponse.json({ error: 'company_id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!activityCode) {
      return NextResponse.json({ error: 'activity_code es obligatorio.' }, { status: 400 });
    }
    if (!activityName) {
      return NextResponse.json({ error: 'activity_name es obligatorio.' }, { status: 400 });
    }

    try {
      const created = await prisma.$queryRaw<SignificantActivityCatalogRow[]>(Prisma.sql`
        INSERT INTO linear_risk.significant_activity (
          company_id,
          activity_code,
          activity_name,
          activity_description,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          ${companyId}::uuid,
          ${activityCode},
          ${activityName},
          ${activityDescription || null},
          ${isActive},
          now(),
          now()
        )
        RETURNING
          significant_activity_id,
          company_id::text AS company_id,
          activity_code,
          activity_name,
          activity_description,
          is_active
      `);

      const row = created[0];
      return NextResponse.json({
        id: row.significant_activity_id,
        company_id: row.company_id,
        activity_code: row.activity_code,
        activity_name: row.activity_name,
        activity_description: row.activity_description,
        is_active: Boolean(row.is_active),
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe una actividad con ese código para la empresa seleccionada.' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating significant activity:', error);
    return NextResponse.json({ error: 'No se pudo crear la actividad significativa.' }, { status: 500 });
  }
}

export async function putLinearRiskSignificantActivitiesCatalogHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      id?: string;
      company_id?: string;
      activity_code?: string;
      activity_name?: string;
      activity_description?: string | null;
      is_active?: boolean;
    };

    const id = String(body.id || '').trim();
    const companyId = String(body.company_id || '').trim();
    const activityCode = String(body.activity_code || '').trim();
    const activityName = String(body.activity_name || '').trim();
    const activityDescription = typeof body.activity_description === 'string' ? body.activity_description.trim() : '';
    const isActive = body.is_active === false ? false : true;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!UUID_REGEX.test(companyId)) {
      return NextResponse.json({ error: 'company_id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!activityCode) {
      return NextResponse.json({ error: 'activity_code es obligatorio.' }, { status: 400 });
    }
    if (!activityName) {
      return NextResponse.json({ error: 'activity_name es obligatorio.' }, { status: 400 });
    }

    try {
      const updated = await prisma.$queryRaw<SignificantActivityCatalogRow[]>(Prisma.sql`
        UPDATE linear_risk.significant_activity
        SET
          company_id = ${companyId}::uuid,
          activity_code = ${activityCode},
          activity_name = ${activityName},
          activity_description = ${activityDescription || null},
          is_active = ${isActive},
          updated_at = now()
        WHERE significant_activity_id = ${id}::uuid
        RETURNING
          significant_activity_id,
          company_id::text AS company_id,
          activity_code,
          activity_name,
          activity_description,
          is_active
      `);

      const row = updated[0];
      if (!row) return NextResponse.json({ error: 'Actividad no encontrada.' }, { status: 404 });

      return NextResponse.json({
        id: row.significant_activity_id,
        company_id: row.company_id,
        activity_code: row.activity_code,
        activity_name: row.activity_name,
        activity_description: row.activity_description,
        is_active: Boolean(row.is_active),
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe una actividad con ese código para la empresa seleccionada.' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating significant activity:', error);
    return NextResponse.json({ error: 'No se pudo actualizar la actividad significativa.' }, { status: 500 });
  }
}

export async function deleteLinearRiskSignificantActivitiesCatalogHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = String(url.searchParams.get('id') || '').trim();
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<Array<{ significant_activity_id: string }>>(Prisma.sql`
      UPDATE linear_risk.significant_activity
      SET is_active = false, updated_at = now()
      WHERE significant_activity_id = ${id}::uuid
      RETURNING significant_activity_id
    `);
    if (!rows[0]) return NextResponse.json({ error: 'Actividad no encontrada.' }, { status: 404 });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('Error deleting significant activity:', error);
    return NextResponse.json({ error: 'No se pudo eliminar la actividad significativa.' }, { status: 500 });
  }
}

export async function getLinearRiskRisksBySignificantActivityHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const significantActivityId = (url.searchParams.get('significantActivityId') || '').trim();
    if (!UUID_REGEX.test(significantActivityId)) {
      return NextResponse.json({ error: 'significantActivityId es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<RiskCatalogByActivityRow[]>(Prisma.sql`
      SELECT
        rc.risk_catalog_id::text AS risk_catalog_id,
        rc.significant_activity_id::text AS significant_activity_id,
        rc.risk_code,
        rc.risk_name,
        rc.risk_description,
        rc.risk_category,
        rc.is_active
      FROM linear_risk.risk_catalog rc
      WHERE rc.significant_activity_id = ${significantActivityId}::uuid
        AND COALESCE(rc.is_active, true) = true
      ORDER BY rc.risk_name ASC
    `);

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.risk_catalog_id,
        significant_activity_id: row.significant_activity_id,
        risk_code: row.risk_code || '',
        risk_name: row.risk_name || '',
        risk_description: row.risk_description || '',
        risk_category: row.risk_category || '',
        is_active: Boolean(row.is_active ?? true),
      })),
    });
  } catch (error) {
    console.error('Error loading risks by significant activity:', error);
    return NextResponse.json({ error: 'No se pudo cargar el catálogo de riesgos por actividad.' }, { status: 500 });
  }
}

export async function getLinearRiskCatalogRiskHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const riskId = (url.searchParams.get('id') || '').trim();
    const significantActivityId = (url.searchParams.get('significantActivityId') || '').trim();

    if (riskId && UUID_REGEX.test(riskId)) {
      const rows = await prisma.$queryRaw<RiskCatalogByActivityRow[]>(Prisma.sql`
        SELECT
          rc.risk_catalog_id::text AS risk_catalog_id,
          rc.significant_activity_id::text AS significant_activity_id,
          rc.risk_code,
          rc.risk_name,
          rc.risk_description,
          rc.risk_category,
          rc.is_active
        FROM linear_risk.risk_catalog rc
        WHERE rc.risk_catalog_id = ${riskId}::uuid
        LIMIT 1
      `);
      const row = rows[0];
      if (!row) return NextResponse.json({ error: 'Riesgo no encontrado.' }, { status: 404 });
      return NextResponse.json({
        id: row.risk_catalog_id,
        significant_activity_id: row.significant_activity_id,
        risk_code: row.risk_code || '',
        risk_name: row.risk_name || '',
        risk_description: row.risk_description || '',
        risk_category: row.risk_category || '',
        is_active: Boolean(row.is_active ?? true),
      });
    }

    if (!UUID_REGEX.test(significantActivityId)) {
      return NextResponse.json({ error: 'significantActivityId es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    return getLinearRiskRisksBySignificantActivityHandler(request);
  } catch (error) {
    console.error('Error loading risk catalog:', error);
    return NextResponse.json({ error: 'No se pudo cargar el riesgo.' }, { status: 500 });
  }
}

export async function postLinearRiskCatalogRiskHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      significant_activity_id?: string;
      risk_code?: string;
      risk_name?: string;
      risk_description?: string | null;
      risk_category?: string | null;
      is_active?: boolean;
    };
    const significantActivityId = String(body.significant_activity_id || '').trim();
    const riskCode = String(body.risk_code || '').trim();
    const riskName = String(body.risk_name || '').trim();
    const riskDescription = typeof body.risk_description === 'string' ? body.risk_description.trim() : '';
    const riskCategory = typeof body.risk_category === 'string' ? body.risk_category.trim() : '';
    const isActive = body.is_active === false ? false : true;

    if (!UUID_REGEX.test(significantActivityId)) {
      return NextResponse.json({ error: 'significant_activity_id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!riskCode) return NextResponse.json({ error: 'risk_code es obligatorio.' }, { status: 400 });
    if (!riskName) return NextResponse.json({ error: 'risk_name es obligatorio.' }, { status: 400 });

    const rows = await prisma.$queryRaw<RiskCatalogByActivityRow[]>(Prisma.sql`
      INSERT INTO linear_risk.risk_catalog (
        significant_activity_id,
        risk_code,
        risk_name,
        risk_description,
        risk_category,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${significantActivityId}::uuid,
        ${riskCode},
        ${riskName},
        ${riskDescription || null},
        ${riskCategory || null},
        ${isActive},
        now(),
        now()
      )
      RETURNING
        risk_catalog_id::text AS risk_catalog_id,
        significant_activity_id::text AS significant_activity_id,
        risk_code,
        risk_name,
        risk_description,
        risk_category,
        is_active
    `);
    const row = rows[0];
    return NextResponse.json({
      id: row.risk_catalog_id,
      significant_activity_id: row.significant_activity_id,
      risk_code: row.risk_code || '',
      risk_name: row.risk_name || '',
      risk_description: row.risk_description || '',
      risk_category: row.risk_category || '',
      is_active: Boolean(row.is_active ?? true),
    });
  } catch (error: any) {
    console.error('Error creating risk catalog row:', error);
    return NextResponse.json({ error: 'No se pudo crear el riesgo.' }, { status: 500 });
  }
}

export async function putLinearRiskCatalogRiskHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      id?: string;
      significant_activity_id?: string;
      risk_code?: string;
      risk_name?: string;
      risk_description?: string | null;
      risk_category?: string | null;
      is_active?: boolean;
    };
    const id = String(body.id || '').trim();
    const significantActivityId = String(body.significant_activity_id || '').trim();
    const riskCode = String(body.risk_code || '').trim();
    const riskName = String(body.risk_name || '').trim();
    const riskDescription = typeof body.risk_description === 'string' ? body.risk_description.trim() : '';
    const riskCategory = typeof body.risk_category === 'string' ? body.risk_category.trim() : '';
    const isActive = body.is_active === false ? false : true;

    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'id inválido.' }, { status: 400 });
    if (!UUID_REGEX.test(significantActivityId)) {
      return NextResponse.json({ error: 'significant_activity_id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!riskCode) return NextResponse.json({ error: 'risk_code es obligatorio.' }, { status: 400 });
    if (!riskName) return NextResponse.json({ error: 'risk_name es obligatorio.' }, { status: 400 });

    const rows = await prisma.$queryRaw<RiskCatalogByActivityRow[]>(Prisma.sql`
      UPDATE linear_risk.risk_catalog
      SET
        significant_activity_id = ${significantActivityId}::uuid,
        risk_code = ${riskCode},
        risk_name = ${riskName},
        risk_description = ${riskDescription || null},
        risk_category = ${riskCategory || null},
        is_active = ${isActive},
        updated_at = now()
      WHERE risk_catalog_id = ${id}::uuid
      RETURNING
        risk_catalog_id::text AS risk_catalog_id,
        significant_activity_id::text AS significant_activity_id,
        risk_code,
        risk_name,
        risk_description,
        risk_category,
        is_active
    `);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'Riesgo no encontrado.' }, { status: 404 });

    return NextResponse.json({
      id: row.risk_catalog_id,
      significant_activity_id: row.significant_activity_id,
      risk_code: row.risk_code || '',
      risk_name: row.risk_name || '',
      risk_description: row.risk_description || '',
      risk_category: row.risk_category || '',
      is_active: Boolean(row.is_active ?? true),
    });
  } catch (error) {
    console.error('Error updating risk catalog row:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el riesgo.' }, { status: 500 });
  }
}

export async function deleteLinearRiskCatalogRiskHandler(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = String(url.searchParams.get('id') || '').trim();
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'id inválido.' }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ risk_catalog_id: string }>>(Prisma.sql`
      UPDATE linear_risk.risk_catalog
      SET is_active = false, updated_at = now()
      WHERE risk_catalog_id = ${id}::uuid
      RETURNING risk_catalog_id::text AS risk_catalog_id
    `);
    if (!rows[0]) return NextResponse.json({ error: 'Riesgo no encontrado.' }, { status: 404 });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('Error deleting risk catalog row:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el riesgo.' }, { status: 500 });
  }
}

export async function getLinearRiskDraftHandler(auth: { tenantId: string }, id: string) {
  try {
    const draft = await getCanonicalAuditDraftById(id, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error loading linear draft:', error);
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
  }
}

export async function patchLinearRiskDraftHandler(auth: { tenantId: string }, id: string, request: Request) {
  try {
    const patch = (await request.json()) as Partial<DraftRecord>;
    const current = (await getCanonicalAuditDraftById(id, auth.tenantId)) ?? defaultDraft(id, auth.tenantId);
    const next = { ...current, ...patch, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() };
    await upsertCanonicalAuditDraft({ auditDraftId: id, tenantId: auth.tenantId, draft: next as any });
    return NextResponse.json(next);
  } catch (error) {
    console.error('Error updating linear draft:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

export async function getLinearRiskDraftAnalysisHandler(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const draft = await findDraft(id, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    const notes = parseNotes(draft.notes);
    const storedRows = Array.isArray(notes?.wizard?.riskAnalysisRows) ? (notes.wizard.riskAnalysisRows as RiskRowInput[]) : [];

    const [probabilityCatalog, impactCatalog, seedRows] = await Promise.all([
      prisma.$queryRaw<Array<{ catalog_probability_id: bigint; code: string; name: string; description: string | null; numeric_value: number; ordinal: number }>>(Prisma.sql`
        SELECT catalog_probability_id, code, name, description, numeric_value, ordinal
        FROM linear_risk.catalog_probability
        WHERE is_active = true
        ORDER BY ordinal ASC
      `),
      prisma.$queryRaw<Array<{ catalog_impact_id: bigint; code: string; name: string; description: string | null; numeric_value: number; ordinal: number }>>(Prisma.sql`
        SELECT catalog_impact_id, code, name, description, numeric_value, ordinal
        FROM linear_risk.catalog_impact
        WHERE is_active = true
        ORDER BY ordinal ASC
      `),
      getInherentSeedRows(draft.risk_assessment_draft_id),
    ]);

    const controlCatalog = await prisma.$queryRaw<Array<{ id: string; code: string | null; name: string; description: string | null }>>(Prisma.sql`
      SELECT
        c.control_id::text AS id,
        NULL::text AS code,
        c.name AS name,
        c.description AS description
      FROM linear_risk.control_catalog c
      ORDER BY c.name ASC
    `);

    let mappedControlsByRisk = new Map<string, Array<{ id: string; name: string; code: string | null; description: string | null }>>();
    try {
      const rows = await prisma.$queryRaw<Array<{
        risk_catalog_id: string;
        control_id: string;
        control_name: string;
        control_code: string | null;
        control_description: string | null;
      }>>(Prisma.sql`
        SELECT
          m.catalog_lineal_risk_id::text AS risk_catalog_id,
          c.control_id::text AS control_id,
          c.name AS control_name,
          NULL::text AS control_code,
          c.description AS control_description
        FROM linear_risk.map_lineal_risk_risk_control m
        JOIN linear_risk.control_catalog c
          ON c.control_id = m.catalog_lineal_control_id
      `);
      for (const row of rows) {
        const current = mappedControlsByRisk.get(row.risk_catalog_id) ?? [];
        current.push({
          id: row.control_id,
          name: row.control_name,
          code: row.control_code,
          description: row.control_description,
        });
        mappedControlsByRisk.set(row.risk_catalog_id, current);
      }
    } catch {
      mappedControlsByRisk = new Map();
    }

    const savedByCompositeKey = new Map<string, RiskRowInput>();
    for (const saved of storedRows) {
      const key = `${saved.draftItemId}::${saved.riskCatalogId}`;
      savedByCompositeKey.set(key, saved);
    }

    const rows = seedRows.map((row) => {
      const notesObj = parseNotes(row.draft_item_notes);
      const noteProbability = Number(notesObj?.inherent_probability ?? NaN);
      const noteImpact = Number(notesObj?.inherent_impact ?? NaN);
      const probability = row.probability_value ?? (Number.isFinite(noteProbability) ? noteProbability : null);
      const impact = row.impact_value ?? (Number.isFinite(noteImpact) ? noteImpact : null);
      const inherentRisk = probability != null && impact != null
        ? Number((probability * impact).toFixed(6))
        : row.inherent_risk_score != null
          ? Number(Number(row.inherent_risk_score).toFixed(6))
          : null;

      const riskCatalogId = String(row.risk_catalog_id || '').trim();
      const draftItemId = String(row.risk_assessment_draft_item_id);
      const compositeKey = `${draftItemId}::${riskCatalogId}`;
      const saved = savedByCompositeKey.get(compositeKey);

      const availableControls =
        (riskCatalogId && mappedControlsByRisk.get(riskCatalogId)) ||
        controlCatalog.map((c) => ({ id: c.id, name: c.name, code: c.code, description: c.description }));
      const selectedControlId = String(saved?.mitigatingControlId || '').trim();
      const validControlId = selectedControlId && availableControls.some((c) => c.id === selectedControlId) ? selectedControlId : null;

      const coverageRaw = Number(saved?.coveragePct ?? NaN);
      const coveragePct = Number.isFinite(coverageRaw) ? Math.max(0, Math.min(100, Math.round(coverageRaw))) : 0;
      const residualScore = inherentRisk == null
        ? null
        : Number((inherentRisk * (1 - coveragePct / 100)).toFixed(6));
      const selectedControlMeta = validControlId ? availableControls.find((c) => c.id === validControlId) ?? null : null;

      return {
        rowId: saved?.rowId || `row-${draftItemId}-${riskCatalogId || 'none'}`,
        draftItemId,
        riskId: riskCatalogId,
        significantActivityId: row.significant_activity_id,
        activityCode: row.activity_code,
        activityName: row.activity_name,
        elementName: row.activity_name,
        activityDescription: row.activity_description,
        riskCatalogId,
        riskCode: row.risk_code || null,
        riskName: row.risk_name || null,
        riskDescription: row.risk_description || row.rationale || null,
        probabilityLabel: row.probability_name || null,
        probability,
        impactLabel: row.impact_name || null,
        impact,
        inherentRisk,
        mitigatingControlId: validControlId,
        mitigatingControlCode: selectedControlMeta?.code ?? null,
        mitigatingControlName: selectedControlMeta?.name ?? null,
        mitigatingControlDescription: selectedControlMeta?.description ?? null,
        coveragePct,
        residualScore,
        availableControls,
      };
    });

    const totalResidual = rows.reduce((acc, row) => acc + (row.residualScore ?? 0), 0);

    return NextResponse.json({
      probabilityCatalog: probabilityCatalog.map((p) => ({ id: Number(p.catalog_probability_id), code: p.code, name: p.name, description: p.description, baseValue: Number(p.numeric_value), sortOrder: p.ordinal })),
      impactCatalog: impactCatalog.map((i) => ({ id: Number(i.catalog_impact_id), code: i.code, name: i.name, description: i.description, baseValue: Number(i.numeric_value), sortOrder: i.ordinal })),
      rows,
      totals: {
        residual: Number(totalResidual.toFixed(6)),
      },
    });
  } catch (error) {
    console.error('Error loading linear risk analysis:', error);
    return NextResponse.json({ error: 'Failed to load risk analysis rows' }, { status: 500 });
  }
}
async function resolveProbId(v: number) {
  const rows = await prisma.$queryRaw<{ catalog_probability_id: bigint }[]>(Prisma.sql`
    SELECT catalog_probability_id FROM linear_risk.catalog_probability WHERE numeric_value = ${v} AND is_active = true ORDER BY ordinal ASC LIMIT 1
  `);
  return rows[0]?.catalog_probability_id ?? null;
}

async function resolveImpactId(v: number) {
  const rows = await prisma.$queryRaw<{ catalog_impact_id: bigint }[]>(Prisma.sql`
    SELECT catalog_impact_id FROM linear_risk.catalog_impact WHERE numeric_value = ${v} AND is_active = true ORDER BY ordinal ASC LIMIT 1
  `);
  return rows[0]?.catalog_impact_id ?? null;
}

async function resolveRiskCatalogId(
  significantActivityId: string | null,
  code: string,
  name: string,
  description: string | null,
) {
  const existing = await prisma.$queryRaw<{ risk_catalog_id: string }[]>(Prisma.sql`
    SELECT risk_catalog_id::text AS risk_catalog_id
    FROM linear_risk.risk_catalog
    WHERE risk_code = ${code}
      AND (
        (${significantActivityId ? Prisma.sql`${significantActivityId}::uuid` : Prisma.sql`NULL`} IS NULL AND significant_activity_id IS NULL)
        OR significant_activity_id = ${significantActivityId ? Prisma.sql`${significantActivityId}::uuid` : Prisma.sql`NULL`}
      )
    LIMIT 1
  `);
  if (existing[0]) return existing[0].risk_catalog_id;

  const inserted = await prisma.$queryRaw<{ risk_catalog_id: string }[]>(Prisma.sql`
    INSERT INTO linear_risk.risk_catalog (significant_activity_id, risk_code, risk_name, risk_description, risk_category, is_active, created_at, updated_at)
    VALUES (${significantActivityId ? Prisma.sql`${significantActivityId}::uuid` : Prisma.sql`NULL`}, ${code}, ${name}, ${description}, 'general', true, now(), now())
    RETURNING risk_catalog_id::text AS risk_catalog_id
  `);
  return inserted[0].risk_catalog_id;
}

export async function putLinearRiskDraftAnalysisHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const draft = await findDraft(id, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    const body = (await request.json()) as { rows?: RiskRowInput[] };
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const sanitizedRows: RiskRowInput[] = rows
      .map((row) => {
        const draftItemId = String(row?.draftItemId || '').trim();
        const riskCatalogId = String(row?.riskCatalogId || '').trim();
        if (!draftItemId || !riskCatalogId) return null;

        const probability = Number(row?.probability ?? NaN);
        const impact = Number(row?.impact ?? NaN);
        const safeProbability = Number.isFinite(probability) ? probability : null;
        const safeImpact = Number.isFinite(impact) ? impact : null;

        const coverageRaw = Number(row?.coveragePct ?? NaN);
        const coveragePct = Number.isFinite(coverageRaw)
          ? Math.max(0, Math.min(100, Math.round(coverageRaw)))
          : 0;

        const inherent = safeProbability != null && safeImpact != null
          ? Number((safeProbability * safeImpact).toFixed(6))
          : null;
        const residualScore = inherent == null
          ? null
          : Number((inherent * (1 - coveragePct / 100)).toFixed(6));

        return {
          rowId: String(row?.rowId || '').trim() || undefined,
          draftItemId,
          riskCatalogId,
          mitigatingControlId: row?.mitigatingControlId ? String(row.mitigatingControlId).trim() : null,
          coveragePct,
          residualScore,
          probability: safeProbability,
          impact: safeImpact,
        } as RiskRowInput;
      })
      .filter((row): row is RiskRowInput => Boolean(row));

    await updateWizardNotes(draft.risk_assessment_draft_id, { riskAnalysisRows: sanitizedRows });

    return NextResponse.json({ ok: true, count: sanitizedRows.length });
  } catch (error) {
    console.error('Error saving linear risk analysis:', error);
    return NextResponse.json({ error: 'Failed to save risk analysis rows' }, { status: 500 });
  }
}

export async function putLinearRiskDraftActivitiesHandler(request: Request, draftId: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const draft = await findDraft(draftId, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });

    const body = (await request.json()) as { items?: ActivityItemInput[]; companyId?: string | null };
    const items = Array.isArray(body.items) ? body.items : [];
    const selectedCompanyId = String(body.companyId || '').trim();
    if (!UUID_REGEX.test(selectedCompanyId)) {
      return NextResponse.json({ error: 'companyId es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM linear_risk.risk_assessment_draft_item_risk
      WHERE risk_assessment_draft_item_id IN (
        SELECT risk_assessment_draft_item_id
        FROM linear_risk.risk_assessment_draft_item
        WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
      )
    `);
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM linear_risk.risk_assessment_draft_item
      WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
    `);

    for (let idx = 0; idx < items.length; idx += 1) {
      const item = items[idx];
      const significantActivityId = String(item.significant_activity_id || '').trim();
      if (!UUID_REGEX.test(significantActivityId)) {
        return NextResponse.json(
          { error: `Actividad inválida en la fila ${idx + 1}: debes seleccionar una actividad significativa.` },
          { status: 400 }
        );
      }

      const activityRows = await prisma.$queryRaw<Array<{
        significant_activity_id: string;
        activity_code: string;
        activity_name: string;
        activity_description: string | null;
      }>>(Prisma.sql`
        SELECT significant_activity_id, activity_code, activity_name, activity_description
        FROM linear_risk.significant_activity
        WHERE significant_activity_id = ${significantActivityId}::uuid
          AND company_id = ${selectedCompanyId}::uuid
          AND COALESCE(is_active, true) = true
        LIMIT 1
      `);

      const activity = activityRows[0];
      if (!activity) {
        return NextResponse.json(
          { error: `La actividad seleccionada en la fila ${idx + 1} no existe o no pertenece a la empresa activa.` },
          { status: 400 }
        );
      }

      const code = activity.activity_code;
      const name = activity.activity_name;
      const desc = activity.activity_description;
      const materialityWeight = normalizeMaterialityWeight(item.materiality_weight);

      const draftItem = await prisma.$queryRaw<{ risk_assessment_draft_item_id: bigint }[]>(Prisma.sql`
        INSERT INTO linear_risk.risk_assessment_draft_item (
          risk_assessment_draft_id, significant_activity_id, materiality_level, materiality_weight,
          materiality_justification, sort_order, notes, created_at, updated_at, is_deleted
        ) VALUES (
          ${draft.risk_assessment_draft_id}, ${activity.significant_activity_id}::uuid, ${item.materiality_level?.trim() || 'media'}, ${materialityWeight},
          ${item.materiality_justification?.trim() || null}, ${item.sort_order ?? idx + 1}, ${JSON.stringify({
            tempId: item.tempId ?? null,
            significant_activity_id: activity.significant_activity_id,
            inherent_risk_catalog_id: item.inherent_risk_catalog_id ?? null,
            inherent_risk_description: item.inherent_risk_description?.trim() || null,
            inherent_probability: item.inherent_probability ?? null,
            inherent_impact: item.inherent_impact ?? null,
            inherent_risk_score:
              item.inherent_probability != null && item.inherent_impact != null
                ? Number((item.inherent_probability * item.inherent_impact).toFixed(6))
                : item.inherent_risk_score ?? null,
          })}, now(), now(), false
        )
        RETURNING risk_assessment_draft_item_id
      `);

      const probability = Number(item.inherent_probability ?? NaN);
      const impact = Number(item.inherent_impact ?? NaN);
      if (Number.isFinite(probability) && Number.isFinite(impact)) {
        const pId = await resolveProbId(probability);
        const iId = await resolveImpactId(impact);
        if (pId && iId) {
          const score = Number((probability * impact).toFixed(6));
          const riskCode = `${code}-IR`;
          const riskName = item.inherent_risk_description?.trim() || `Riesgo inherente de ${name}`;
          let riskCatalogId: string | null = null;
          if (item.inherent_risk_catalog_id && UUID_REGEX.test(String(item.inherent_risk_catalog_id))) {
            const existing = await prisma.$queryRaw<Array<{ risk_catalog_id: string }>>(Prisma.sql`
              SELECT risk_catalog_id::text AS risk_catalog_id
              FROM linear_risk.risk_catalog
              WHERE risk_catalog_id = ${String(item.inherent_risk_catalog_id)}::uuid
                AND significant_activity_id = ${activity.significant_activity_id}::uuid
                AND COALESCE(is_active, true) = true
              LIMIT 1
            `);
            riskCatalogId = existing[0]?.risk_catalog_id ?? null;
          }
          if (!riskCatalogId) {
            riskCatalogId = await resolveRiskCatalogId(activity.significant_activity_id, riskCode, riskName, item.inherent_risk_description?.trim() || null);
          }

          await prisma.$executeRaw(Prisma.sql`
            INSERT INTO linear_risk.risk_assessment_draft_item_risk (
              risk_assessment_draft_item_id, risk_catalog_id, catalog_probability_id, catalog_impact_id,
              inherent_risk_score, inherent_risk_level, inherent_risk_trend, rationale, created_at, updated_at
            ) VALUES (
              ${draftItem[0].risk_assessment_draft_item_id}, ${riskCatalogId}, ${pId}, ${iId},
              ${score}, ${mapRiskLevel(score)}, 'stable', ${item.inherent_risk_description?.trim() || null}, now(), now()
            )
          `);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving activities:', error);
    return NextResponse.json({ error: 'No se pudieron guardar las actividades' }, { status: 500 });
  }
}
export async function putLinearRiskDraftControlsHandler(request: Request, draftId: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const draft = await findDraft(draftId, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });

    const itemId = await ensureFirstItem(draft.risk_assessment_draft_id, auth.tenantId);
    const body = (await request.json()) as { evaluations?: EvaluationInput[] };
    const evaluations = Array.isArray(body.evaluations) ? body.evaluations : [];

    await prisma.$executeRaw(Prisma.sql`DELETE FROM linear_risk.risk_assessment_draft_item_control WHERE risk_assessment_draft_item_id = ${itemId}`);

    for (const ev of evaluations) {
      if (!ev.status) continue;
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO linear_risk.risk_assessment_draft_item_control (
          risk_assessment_draft_item_id, evaluation_scope, control_name, control_description,
          effectiveness_level, effectiveness_trend, net_risk_score, net_risk_level, rationale, created_at, updated_at
        ) VALUES (
          ${itemId}, 'riesgo_lineal', ${`Control ${ev.controlId}`}, ${ev.howToEvaluate?.trim() || null},
          ${mapEffectiveness(ev.status)}, ${null}, ${null}, ${null}, ${ev.notes?.trim() || null}, now(), now()
        )
      `);
    }

    return NextResponse.json({ ok: true, count: evaluations.length });
  } catch (error) {
    console.error('Error saving controls:', error);
    return NextResponse.json({ error: 'No se pudo guardar gestion y controles' }, { status: 500 });
  }
}

export async function putLinearRiskDraftFindingsActionsHandler(request: Request, draftId: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const draft = await findDraft(draftId, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });

    const itemId = await ensureFirstItem(draft.risk_assessment_draft_id, auth.tenantId);
    const body = (await request.json()) as { extensions?: ExtensionInput[] };
    const extensions = Array.isArray(body.extensions) ? body.extensions : [];

    await prisma.$executeRaw(Prisma.sql`DELETE FROM linear_risk.risk_assessment_draft_item_action WHERE risk_assessment_draft_item_id = ${itemId}`);
    await prisma.$executeRaw(Prisma.sql`DELETE FROM linear_risk.risk_assessment_draft_item_finding WHERE risk_assessment_draft_item_id = ${itemId}`);

    for (const ext of extensions) {
      const title = ext.title?.trim();
      const desc = ext.notes?.trim();
      if (!title && !desc) continue;

      const finding = await prisma.$queryRaw<{ risk_assessment_draft_item_finding_id: bigint }[]>(Prisma.sql`
        INSERT INTO linear_risk.risk_assessment_draft_item_finding (
          risk_assessment_draft_item_id, finding_type, title, description, severity_level, recommendation, created_at, updated_at
        ) VALUES (${itemId}, 'gap', ${title || 'Hallazgo'}, ${desc || ''}, 'media', ${null}, now(), now())
        RETURNING risk_assessment_draft_item_finding_id
      `);

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO linear_risk.risk_assessment_draft_item_action (
          risk_assessment_draft_item_id, related_finding_id, action_title, action_description,
          owner_manager_id, target_date, status, progress_notes, created_at, updated_at
        ) VALUES (
          ${itemId}, ${finding[0]?.risk_assessment_draft_item_finding_id ?? null}, ${title || 'Accion'}, ${desc || null},
          ${null}, ${null}, 'open', ${null}, now(), now()
        )
      `);
    }

    return NextResponse.json({ ok: true, count: extensions.length });
  } catch (error) {
    console.error('Error saving findings/actions:', error);
    return NextResponse.json({ error: 'No se pudo guardar hallazgos y acciones' }, { status: 500 });
  }
}

export async function postLinearRiskDraftFinalizeHandler(draftId: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const draft = await findDraft(draftId, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });

    const source = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM linear_risk.risk_assessment_draft
      WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
      LIMIT 1
    `);
    const row = source[0];
    if (!row) return NextResponse.json({ error: 'Draft fuente no encontrado' }, { status: 404 });

    const companyUuidRows = await prisma.$queryRaw<{ data_type: string }[]>(Prisma.sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'linear_risk'
        AND table_name = 'risk_assessment_final'
        AND column_name = 'company_id'
      LIMIT 1
    `);
    const finalCompanyUuid = companyUuidRows[0]?.data_type === 'uuid';

    const inserted = finalCompanyUuid
      ? await prisma.$queryRaw<{ risk_assessment_final_id: bigint }[]>(Prisma.sql`
          INSERT INTO linear_risk.risk_assessment_final (
            source_draft_id, assessment_code, title, company_id, assessment_period_label,
            scope_description, business_context, model_of_business, methodology_version,
            root_assessment_code, version_no, is_current_version, concluded_at,
            global_net_risk_score, global_net_risk_level, composite_risk_score, composite_risk_level,
            executive_summary, draft_snapshot_hash, created_at, updated_at, is_deleted
          ) VALUES (
            ${row.risk_assessment_draft_id}, ${`${row.assessment_code}-FINAL`}, ${row.title}, ${auth.tenantId}::uuid, ${row.assessment_period_label},
            ${row.scope_description}, ${row.business_context}, ${row.model_of_business}, ${row.methodology_version},
            ${row.root_assessment_code}, ${row.version_no}, true, now(),
            ${null}, ${null}, ${null}, ${null}, 'Resumen ejecutivo generado desde wizard riesgo-lineal.', ${null}, now(), now(), false
          ) RETURNING risk_assessment_final_id
        `)
      : await prisma.$queryRaw<{ risk_assessment_final_id: bigint }[]>(Prisma.sql`
          INSERT INTO linear_risk.risk_assessment_final (
            source_draft_id, assessment_code, title, company_id, assessment_period_label,
            scope_description, business_context, model_of_business, methodology_version,
            root_assessment_code, version_no, is_current_version, concluded_at,
            global_net_risk_score, global_net_risk_level, composite_risk_score, composite_risk_level,
            executive_summary, draft_snapshot_hash, created_at, updated_at, is_deleted
          ) VALUES (
            ${row.risk_assessment_draft_id}, ${`${row.assessment_code}-FINAL`}, ${row.title}, 1, ${row.assessment_period_label},
            ${row.scope_description}, ${row.business_context}, ${row.model_of_business}, ${row.methodology_version},
            ${row.root_assessment_code}, ${row.version_no}, true, now(),
            ${null}, ${null}, ${null}, ${null}, 'Resumen ejecutivo generado desde wizard riesgo-lineal.', ${null}, now(), now(), false
          ) RETURNING risk_assessment_final_id
        `);

    const finalId = inserted[0].risk_assessment_final_id;

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO linear_risk.risk_assessment_report (
        risk_assessment_final_id, report_code, report_type, report_title,
        matrix_summary, executive_summary, report_body, issued_at, created_at, updated_at
      ) VALUES (
        ${finalId}, ${`REP-${row.assessment_code}`}, 'formal', ${`Informe ${row.title}`},
        'Matriz consolidada generada desde borrador de riesgo lineal.',
        'Resumen ejecutivo generado en cierre automático.',
        'Cuerpo base del informe generado por el wizard de riesgo lineal.',
        now(), now(), now()
      )
    `);

    await prisma.$executeRaw(Prisma.sql`
      UPDATE linear_risk.risk_assessment_draft
      SET status = 'concluded', concluded_at = now(), updated_at = now()
      WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
    `);

    return NextResponse.json({ ok: true, risk_assessment_final_id: Number(finalId) });
  } catch (error) {
    console.error('Error finalizing linear risk draft:', error);
    return NextResponse.json({ error: 'No se pudo finalizar la evaluación' }, { status: 500 });
  }
}
