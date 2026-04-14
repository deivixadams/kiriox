
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
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
  risk_emerging_source_id?: string | null;
  risk_emerging_status_id?: string | null;
  risk_factor_id?: string | null;
  operational_risk_loss_event_type_id?: string | null;
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

type RiskScaleRow = {
  code: string;
  name: string;
  min_value: number;
  max_value: number;
  severity_rank: number;
  color_hex?: string | null;
  applies_to: string;
  version: number;
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

function buildInternalRiskCode(seedName: string) {
  const seed = seedName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'RISK';
  const stamp = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSK_${seed}_${stamp}${rnd}`;
}

async function getRiskScaleBand(value: number, appliesTo: 'INHERENT' | 'RESIDUAL') {
  const rows = await prisma.$queryRaw<RiskScaleRow[]>(
    Prisma.sql`
      SELECT code, name, min_value, max_value, severity_rank, color_hex, applies_to, version
      FROM core.risk_scale
      WHERE is_active = true
        AND UPPER(applies_to) IN ('ALL', ${appliesTo})
        AND ${value} BETWEEN min_value AND max_value
      ORDER BY CASE WHEN UPPER(applies_to) = ${appliesTo} THEN 0 ELSE 1 END, version DESC
      LIMIT 1
    `
  );
  return rows[0] ?? null;
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
};

async function renderLinearRiskReportDocx(data: Record<string, any>) {
  const templatePath = path.resolve('C:\\_CRE\\PLANTILLA_INFORME.docx');
  const content = await fs.readFile(templatePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    modules: []
  });

  doc.render({ ...data });
  return doc.getZip().generate({ type: 'nodebuffer' });
}

async function buildLinearRiskReportData(auth: { tenantId: string }, draftId: string, draft: LinearDraftRow) {
  const canonical = await getCanonicalAuditDraftById(draftId, auth.tenantId);
  const acta = (canonical?.acta ?? {}) as any;
  const scopeDescription = acta.scope_description || acta.alcance || '';
  const businessContext = acta.business_context || acta.objetivo || '';
  const modelOfBusiness = acta.model_of_business || acta.entidad_nombre || '';
  const periodLabel = String(acta.assessment_period_label || '').trim();
  const periodFromLabel = periodLabel.includes(' a ') ? periodLabel.split(' a ')[0] : '';
  const periodToLabel = periodLabel.includes(' a ') ? periodLabel.split(' a ')[1] : '';

  const companyId = String(draft.company_id || '').trim();
  const companyRows = UUID_REGEX.test(companyId)
    ? await prisma.$queryRaw<Array<{ name: string }>>(Prisma.sql`
        SELECT name FROM core.company WHERE id = ${companyId}::uuid LIMIT 1
      `)
    : [];
  const companyName = companyRows[0]?.name || modelOfBusiness || '';

  const itemRows = await prisma.$queryRaw<Array<{
    activity_name: string;
    activity_code: string | null;
    risk_name: string | null;
    risk_description: string | null;
    probability_name: string | null;
    probability_value: number | null;
    impact_name: string | null;
    impact_value: number | null;
    inherent_risk_score: number | null;
  }>>(Prisma.sql`
    SELECT
      COALESCE(sa.name, sa.title, sa.code) AS activity_name,
      sa.code AS activity_code,
      rc.risk_name,
      rc.risk_description,
      cp.name AS probability_name,
      cp.numeric_value AS probability_value,
      ci.name AS impact_name,
      ci.numeric_value AS impact_value,
      dir.inherent_risk_score
    FROM core.risk_assessment_draft_item di
    JOIN core.domain_elements sa ON sa.id = di.significant_activity_id AND sa.element_type = 'ACTIVITY'
    LEFT JOIN core.risk_assessment_draft_item_risk dir ON dir.risk_assessment_draft_item_id = di.risk_assessment_draft_item_id
    LEFT JOIN core.risk_catalog rc ON rc.risk_catalog_id = dir.risk_catalog_id
    LEFT JOIN core.catalog_probability cp ON cp.catalog_probability_id = dir.catalog_probability_id
    LEFT JOIN core.catalog_impact ci ON ci.catalog_impact_id = dir.catalog_impact_id
    WHERE di.risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
      AND COALESCE(di.is_deleted, false) = false
    ORDER BY di.sort_order ASC, di.risk_assessment_draft_item_id ASC
  `);

  const activities = itemRows.map((row, idx) => ({
    numero: idx + 1,
    actividad: row.activity_name,
    codigo: row.activity_code || '',
    riesgo: row.risk_name || '',
    descripcion_riesgo: row.risk_description || '',
    probabilidad: row.probability_name || '',
    impacto: row.impact_name || '',
    riesgo_inherente: row.inherent_risk_score ?? null
  }));

  const notes = parseNotes(draft.notes);
  const riskRows = Array.isArray(notes?.wizard?.riskAnalysisRows) ? notes.wizard.riskAnalysisRows : [];
  const controlIds = riskRows.map((r: any) => String(r?.mitigatingControlId || '').trim()).filter(Boolean);
  const controlRows = controlIds.length
    ? await prisma.$queryRaw<Array<{ control_id: string; name: string; description: string | null }>>(Prisma.sql`
        SELECT control_id::text AS control_id, name, description
        FROM core.control_catalog
        WHERE control_id = ANY(${controlIds}::uuid[])
      `)
    : [];
  const controlMap = new Map(controlRows.map((c) => [c.control_id, c]));

  const mitigaciones = riskRows.map((row: any, idx: number) => {
    const control = row?.mitigatingControlId ? controlMap.get(String(row.mitigatingControlId)) : null;
    return {
      numero: idx + 1,
      control: control?.name || '',
      cobertura: row?.coveragePct ?? null,
      riesgo_residual: row?.residualScore ?? null
    };
  });

  const evaluations = Array.isArray(canonical?.questionnaire) ? canonical?.questionnaire : [];
  const hallazgos = evaluations
    .filter((ev: any) => ev.status === 'no_cumple' || ev.status === 'parcial')
    .map((ev: any, idx: number) => ({
      numero: idx + 1,
      titulo: `Control ${ev.controlId}`,
      condicion: ev.notes || '',
      evidencias: Array.isArray(ev.evidence) ? ev.evidence.join(', ') : ''
    }));

  return {
    empresa: companyName || '',
    periodo_inicio: formatDate(acta.periodo_inicio || periodFromLabel || null) || '',
    periodo_fin: formatDate(acta.periodo_fin || periodToLabel || null) || '',
    fecha_emision: formatDate(new Date().toISOString()) || '',
    resumen_ejecutivo: String(acta.scope_description || '').trim(),
    objetivos: String(acta.objetivo || businessContext || '').trim(),
    alcance: String(scopeDescription || '').trim(),
    metodologia: String(acta.metodologia || '').trim(),
    actividades: (activities || []).map((item) => ({
      numero: item.numero ?? '',
      actividad: item.actividad || '',
      codigo: item.codigo || '',
      riesgo: item.riesgo || '',
      descripcion_riesgo: item.descripcion_riesgo || '',
      probabilidad: item.probabilidad || '',
      impacto: item.impacto || '',
      riesgo_inherente: item.riesgo_inherente ?? ''
    })),
    mitigaciones: (mitigaciones || []).map((item) => ({
      numero: item.numero ?? '',
      control: item.control || '',
      cobertura: item.cobertura ?? '',
      riesgo_residual: item.riesgo_residual ?? ''
    })),
    hallazgos: (hallazgos || []).map((item) => ({
      numero: item.numero ?? '',
      titulo: item.titulo || '',
      condicion: item.condicion || '',
      evidencias: item.evidencias || ''
    }))
  };
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
      FROM core.catalog_probability
      WHERE is_active = true
    `),
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM core.catalog_impact
      WHERE is_active = true
    `),
  ]);

  const pCount = Number(pCountRows[0]?.count ?? 0);
  const iCount = Number(iCountRows[0]?.count ?? 0);

  if (pCount === 0) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.catalog_probability (code, name, description, numeric_value, ordinal, is_active, created_at, updated_at)
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
        SELECT 1 FROM core.catalog_probability p WHERE p.code = v.code
      )
    `);
  }

  if (iCount === 0) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.catalog_impact (code, name, description, numeric_value, ordinal, is_active, created_at, updated_at)
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
        SELECT 1 FROM core.catalog_impact i WHERE i.code = v.code
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
    WHERE table_schema = 'core'
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
    FROM core.risk_assessment_draft
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
    SELECT
      di.risk_assessment_draft_item_id,
      di.significant_activity_id,
      sa.code AS activity_code,
      COALESCE(sa.name, sa.title, sa.code) AS activity_name
    FROM core.risk_assessment_draft_item di
    JOIN core.domain_elements sa ON sa.id = di.significant_activity_id AND sa.element_type = 'ACTIVITY'
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
      sa.code AS activity_code,
      COALESCE(sa.name, sa.title, sa.code) AS activity_name,
      COALESCE(sa.description, sa.statement) AS activity_description,
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
    FROM core.risk_assessment_draft_item di
    JOIN core.domain_elements sa ON sa.id = di.significant_activity_id AND sa.element_type = 'ACTIVITY'
    LEFT JOIN core.risk_assessment_draft_item_risk dir
      ON dir.risk_assessment_draft_item_id = di.risk_assessment_draft_item_id
    LEFT JOIN core.risk_catalog rc ON rc.risk_catalog_id = dir.risk_catalog_id
    LEFT JOIN core.catalog_probability cp ON cp.catalog_probability_id = dir.catalog_probability_id
    LEFT JOIN core.catalog_impact ci ON ci.catalog_impact_id = dir.catalog_impact_id
    WHERE di.risk_assessment_draft_id = ${draftPk}
      AND COALESCE(di.is_deleted, false) = false
    ORDER BY di.sort_order ASC, di.risk_assessment_draft_item_id ASC, dir.risk_assessment_draft_item_risk_id ASC
  `);
}

async function ensureFirstItem(draftPk: bigint, companyId: string): Promise<bigint> {
  const items = await getItems(draftPk);
  if (items[0]) return items[0].risk_assessment_draft_item_id;

  const act = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    INSERT INTO core.domain_elements (
      element_type,
      code,
      name,
      title,
      description,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      'ACTIVITY',
      ${`KX_PLACEHOLDER_${Date.now()}`},
      'Actividad placeholder',
      'Actividad placeholder',
      'Generada automáticamente',
      true,
      now(),
      now()
    )
    RETURNING id
  `);

  if (UUID_REGEX.test(companyId)) {
    const companyDomain = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT DISTINCT d.id
      FROM core.domain d
      JOIN core.map_reino_domain mrd
        ON mrd.domain_id = d.id
      JOIN core.map_company_x_reino mcr
        ON mcr.reino_id = mrd.reino_id
       AND mcr.company_id = ${companyId}::uuid
       AND COALESCE(mcr.is_active, true) = true
      ORDER BY d.code
      LIMIT 1
    `);
    if (companyDomain[0]) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO core.map_domain_element (id, map_code, domain_id, element_id, is_primary, created_at, updated_at)
        VALUES (gen_random_uuid(), ${`MDE-${act[0].id}`}, ${companyDomain[0].id}::uuid, ${act[0].id}::uuid, true, now(), now())
        ON CONFLICT DO NOTHING
      `);
    }
    await upsertSignificantActivityMirror({
      id: act[0].id,
      companyId,
      code: `KX_PLACEHOLDER_${Date.now()}`,
      name: 'Actividad placeholder',
      description: 'Generada automáticamente',
      isActive: true,
    });
  }

  const item = await prisma.$queryRaw<{ risk_assessment_draft_item_id: bigint }[]>(Prisma.sql`
    INSERT INTO core.risk_assessment_draft_item (
      risk_assessment_draft_id, significant_activity_id, materiality_level, materiality_weight, materiality_justification,
      sort_order, notes, created_at, updated_at, is_deleted
    ) VALUES (
      ${draftPk}, ${act[0].id}, 'media', 50, 'Item placeholder', 1, '{}', now(), now(), false
    ) RETURNING risk_assessment_draft_item_id
  `);
  return item[0].risk_assessment_draft_item_id;
}
async function updateWizardNotes(draftPk: bigint, patch: any) {
  const rows = await prisma.$queryRaw<LinearDraftRow[]>(Prisma.sql`
    SELECT risk_assessment_draft_id, notes, assessment_code, company_id
    FROM core.risk_assessment_draft
    WHERE risk_assessment_draft_id = ${draftPk}
    LIMIT 1
  `);
  const row = rows[0];
  if (!row) return;
  const notes = parseNotes(row.notes);
  const next = { ...notes, wizard: { ...(notes?.wizard || {}), ...patch } };
  await prisma.$executeRaw(Prisma.sql`
    UPDATE core.risk_assessment_draft
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
        FROM core.catalog_probability
        WHERE is_active = true
        ORDER BY ordinal ASC
      `),
      prisma.$queryRaw<Array<{ catalog_impact_id: bigint; code: string; name: string; description: string | null; numeric_value: number; ordinal: number }>>(Prisma.sql`
        SELECT catalog_impact_id, code, name, description, numeric_value, ordinal
        FROM core.catalog_impact
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

async function upsertSignificantActivityMirror(input: {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO core.significant_activity (
      significant_activity_id,
      company_id,
      activity_code,
      activity_name,
      activity_description,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      ${input.id}::uuid,
      ${input.companyId}::uuid,
      ${input.code},
      ${input.name},
      ${input.description},
      ${input.isActive},
      now(),
      now()
    )
    ON CONFLICT (significant_activity_id)
    DO UPDATE SET
      company_id = EXCLUDED.company_id,
      activity_code = EXCLUDED.activity_code,
      activity_name = EXCLUDED.activity_name,
      activity_description = EXCLUDED.activity_description,
      is_active = EXCLUDED.is_active,
      updated_at = now()
  `);
}

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
          de.id::text AS significant_activity_id,
          COALESCE((
            SELECT mcr.company_id::text
            FROM core.map_domain_element mde
            JOIN core.map_reino_domain mrd ON mrd.domain_id = mde.domain_id
            JOIN core.map_company_x_reino mcr ON mcr.reino_id = mrd.reino_id
            WHERE mde.element_id = de.id
              AND COALESCE(mcr.is_active, true) = true
            ORDER BY mde.is_primary DESC, mde.created_at
            LIMIT 1
          ), ''::text) AS company_id,
          de.code AS activity_code,
          COALESCE(de.name, de.title, de.code) AS activity_name,
          COALESCE(de.description, de.statement) AS activity_description,
          COALESCE(de.is_active, true) AS is_active
        FROM core.domain_elements de
        WHERE de.id = ${activityId}::uuid
          AND de.element_type = 'ACTIVITY'
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
          SELECT DISTINCT
            de.id::text AS significant_activity_id,
            COALESCE((
              SELECT mcr2.company_id::text
              FROM core.map_domain_element mde2
              JOIN core.map_reino_domain mrd2 ON mrd2.domain_id = mde2.domain_id
              JOIN core.map_company_x_reino mcr2 ON mcr2.reino_id = mrd2.reino_id
              WHERE mde2.element_id = de.id
                AND COALESCE(mcr2.is_active, true) = true
              ORDER BY mde2.is_primary DESC, mde2.created_at
              LIMIT 1
            ), ''::text) AS company_id,
            de.code AS activity_code,
            COALESCE(de.name, de.title, de.code) AS activity_name,
            COALESCE(de.description, de.statement) AS activity_description,
            COALESCE(de.is_active, true) AS is_active
          FROM core.domain_elements de
          WHERE de.element_type = 'ACTIVITY'
            AND COALESCE(de.is_active, true) = true
          ORDER BY de.code ASC
        `)
      : await prisma.$queryRaw<SignificantActivityCatalogRow[]>(Prisma.sql`
          SELECT DISTINCT
            de.id::text AS significant_activity_id,
            ${companyId}::text AS company_id,
            de.code AS activity_code,
            COALESCE(de.name, de.title, de.code) AS activity_name,
            COALESCE(de.description, de.statement) AS activity_description,
            COALESCE(de.is_active, true) AS is_active
          FROM core.domain_elements de
          WHERE de.element_type = 'ACTIVITY'
            AND COALESCE(de.is_active, true) = true
            AND EXISTS (
              SELECT 1
              FROM core.map_domain_element mde
              JOIN core.map_reino_domain mrd ON mrd.domain_id = mde.domain_id
              JOIN core.map_company_x_reino mcr ON mcr.reino_id = mrd.reino_id
              WHERE mde.element_id = de.id
                AND mcr.company_id = ${companyId}::uuid
                AND COALESCE(mcr.is_active, true) = true
            )
          ORDER BY de.code ASC
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
      const domainRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT DISTINCT d.id
        FROM core.domain d
        JOIN core.map_reino_domain mrd
          ON mrd.domain_id = d.id
        JOIN core.map_company_x_reino mcr
          ON mcr.reino_id = mrd.reino_id
         AND mcr.company_id = ${companyId}::uuid
         AND COALESCE(mcr.is_active, true) = true
        ORDER BY d.code
        LIMIT 1
      `);
      if (!domainRows[0]) {
        return NextResponse.json({ error: 'La empresa no tiene dominios configurados para registrar actividades.' }, { status: 400 });
      }

      const created = await prisma.$queryRaw<Array<{
        id: string;
        code: string;
        activity_name: string;
        activity_description: string | null;
        is_active: boolean;
      }>>(Prisma.sql`
        INSERT INTO core.domain_elements (
          element_type,
          code,
          name,
          title,
          description,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          'ACTIVITY',
          ${activityCode},
          ${activityName},
          ${activityName},
          ${activityDescription || null},
          ${isActive},
          now(),
          now()
        )
        RETURNING id, code, COALESCE(name, title, code) AS activity_name, COALESCE(description, statement) AS activity_description, is_active
      `);

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO core.map_domain_element (id, map_code, domain_id, element_id, is_primary, created_at, updated_at)
        VALUES (gen_random_uuid(), ${`MDE-${created[0].id}`}, ${domainRows[0].id}::uuid, ${created[0].id}::uuid, true, now(), now())
        ON CONFLICT DO NOTHING
      `);

      await upsertSignificantActivityMirror({
        id: created[0].id,
        companyId,
        code: created[0].code,
        name: created[0].activity_name,
        description: created[0].activity_description,
        isActive: Boolean(created[0].is_active),
      });

      const row = created[0];
      return NextResponse.json({
        id: row.id,
        company_id: companyId,
        activity_code: row.code,
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
      const updated = await prisma.$queryRaw<Array<{
        id: string;
        code: string;
        activity_name: string;
        activity_description: string | null;
        is_active: boolean;
      }>>(Prisma.sql`
        UPDATE core.domain_elements
        SET
          code = ${activityCode},
          name = ${activityName},
          title = ${activityName},
          description = ${activityDescription || null},
          is_active = ${isActive},
          updated_at = now()
        WHERE id = ${id}::uuid
          AND element_type = 'ACTIVITY'
        RETURNING id, code, COALESCE(name, title, code) AS activity_name, COALESCE(description, statement) AS activity_description, is_active
      `);

      const row = updated[0];
      if (!row) return NextResponse.json({ error: 'Actividad no encontrada.' }, { status: 404 });

      await upsertSignificantActivityMirror({
        id: row.id,
        companyId,
        code: row.code,
        name: row.activity_name,
        description: row.activity_description,
        isActive: Boolean(row.is_active),
      });

      return NextResponse.json({
        id: row.id,
        company_id: companyId,
        activity_code: row.code,
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

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE core.domain_elements
      SET is_active = false, updated_at = now()
      WHERE id = ${id}::uuid
        AND element_type = 'ACTIVITY'
      RETURNING id
    `);
    if (!rows[0]) return NextResponse.json({ error: 'Actividad no encontrada.' }, { status: 404 });

    await prisma.$executeRaw(Prisma.sql`
      UPDATE core.significant_activity
      SET is_active = false, updated_at = now()
      WHERE significant_activity_id = ${id}::uuid
    `);

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
        r.id::text AS risk_catalog_id,
        mer.element_id::text AS significant_activity_id,
        r.code AS risk_code,
        r.name AS risk_name,
        r.description AS risk_description,
        r.risk_type AS risk_category,
        r.is_active,
        r.risk_emerging_source_id::text AS risk_emerging_source_id,
        r.risk_emerging_status_id::text AS risk_emerging_status_id,
        r.risk_factor_id::text AS risk_factor_id,
        r.operational_risk_loss_event_type_id::text AS operational_risk_loss_event_type_id
      FROM core.risk r
      JOIN core.map_elements_risk mer ON mer.risk_id = r.id
      WHERE mer.element_id = ${significantActivityId}::uuid
        AND COALESCE(r.is_active, true) = true
      ORDER BY r.name ASC
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
        risk_emerging_source_id: row.risk_emerging_source_id || null,
        risk_emerging_status_id: row.risk_emerging_status_id || null,
        risk_factor_id: row.risk_factor_id || null,
        operational_risk_loss_event_type_id: row.operational_risk_loss_event_type_id || null,
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
          r.id::text AS risk_catalog_id,
          mer.element_id::text AS significant_activity_id,
          r.code AS risk_code,
          r.name AS risk_name,
          r.description AS risk_description,
          r.risk_type AS risk_category,
          r.is_active,
          r.risk_emerging_source_id::text AS risk_emerging_source_id,
          r.risk_emerging_status_id::text AS risk_emerging_status_id,
          r.risk_factor_id::text AS risk_factor_id,
          r.operational_risk_loss_event_type_id::text AS operational_risk_loss_event_type_id
        FROM core.risk r
        LEFT JOIN core.map_elements_risk mer ON mer.risk_id = r.id
        WHERE r.id = ${riskId}::uuid
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
        risk_emerging_source_id: row.risk_emerging_source_id || null,
        risk_emerging_status_id: row.risk_emerging_status_id || null,
        risk_factor_id: row.risk_factor_id || null,
        operational_risk_loss_event_type_id: row.operational_risk_loss_event_type_id || null,
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
      risk_emerging_source_id?: string | null;
      risk_emerging_status_id?: string | null;
      risk_factor_id?: string | null;
      operational_risk_loss_event_type_id?: string | null;
    };
    const significantActivityId = String(body.significant_activity_id || '').trim();
    const inputRiskCode = String(body.risk_code || '').trim();
    const riskName = String(body.risk_name || '').trim();
    const riskDescription = typeof body.risk_description === 'string' ? body.risk_description.trim() : '';
    const riskCategory = typeof body.risk_category === 'string' ? body.risk_category.trim() : '';
    const isActive = body.is_active === false ? false : true;

    if (!UUID_REGEX.test(significantActivityId)) {
      return NextResponse.json({ error: 'significant_activity_id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!riskName) return NextResponse.json({ error: 'risk_name es obligatorio.' }, { status: 400 });
    const riskCode = inputRiskCode || buildInternalRiskCode(riskName);

    const codeResult = await prisma.$queryRaw<Array<{ codigo_reino: string }>>(Prisma.sql`
      SELECT mcr.reino_id::text as codigo_reino 
      FROM core.map_domain_element mde
      JOIN core.map_reino_domain mrd ON mrd.domain_id = mde.domain_id
      JOIN core.map_company_x_reino mcr ON mcr.reino_id = mrd.reino_id
      WHERE mde.element_id = ${significantActivityId}::uuid
      LIMIT 1
    `);
    const codigoReino = codeResult[0]?.codigo_reino || null;

    const rows = await prisma.$queryRaw<RiskCatalogByActivityRow[]>(Prisma.sql`
      WITH inserted_risk AS (
        INSERT INTO core.risk (
          code,
          name,
          risk_type,
          description,
          risk_layer_id,
          risk_origen,
          codigo_reino,
          is_active,
          risk_emerging_source_id,
          risk_emerging_status_id,
          risk_factor_id,
          operational_risk_loss_event_type_id,
          created_at,
          updated_at
        )
        VALUES (
          ${riskCode},
          ${riskName},
          ${riskCategory || 'linear'},
          ${riskDescription || null},
          2,
          'AML',
          ${codigoReino},
          ${isActive},
          ${body.risk_emerging_source_id ? Prisma.sql`${body.risk_emerging_source_id}::bigint` : Prisma.sql`NULL`},
          ${body.risk_emerging_status_id ? Prisma.sql`${body.risk_emerging_status_id}::bigint` : Prisma.sql`NULL`},
          ${body.risk_factor_id ? Prisma.sql`${body.risk_factor_id}::bigint` : Prisma.sql`NULL`},
          ${body.operational_risk_loss_event_type_id ? Prisma.sql`${body.operational_risk_loss_event_type_id}::bigint` : Prisma.sql`NULL`},
          now(),
          now()
        )
        RETURNING id, code, name, description, risk_type, is_active, risk_emerging_source_id, risk_emerging_status_id, risk_factor_id, operational_risk_loss_event_type_id
      ),
      inserted_map AS (
        INSERT INTO core.map_elements_risk (
          element_id,
          risk_id,
          link_strength
        )
        SELECT ${significantActivityId}::uuid, id, 3
        FROM inserted_risk
        RETURNING element_id, risk_id
      )
      SELECT 
        r.id::text AS risk_catalog_id,
        m.element_id::text AS significant_activity_id,
        r.code AS risk_code,
        r.name AS risk_name,
        r.description AS risk_description,
        r.risk_type AS risk_category,
        r.is_active,
        r.risk_emerging_source_id::text AS risk_emerging_source_id,
        r.risk_emerging_status_id::text AS risk_emerging_status_id,
        r.risk_factor_id::text AS risk_factor_id,
        r.operational_risk_loss_event_type_id::text AS operational_risk_loss_event_type_id
      FROM inserted_risk r
      JOIN inserted_map m ON m.risk_id = r.id
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
      risk_emerging_source_id: row.risk_emerging_source_id || null,
      risk_emerging_status_id: row.risk_emerging_status_id || null,
      risk_factor_id: row.risk_factor_id || null,
      operational_risk_loss_event_type_id: row.operational_risk_loss_event_type_id || null,
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
      risk_emerging_source_id?: string | null;
      risk_emerging_status_id?: string | null;
      risk_factor_id?: string | null;
      operational_risk_loss_event_type_id?: string | null;
    };
    const id = String(body.id || '').trim();
    const significantActivityId = String(body.significant_activity_id || '').trim();
    const inputRiskCode = String(body.risk_code || '').trim();
    const riskName = String(body.risk_name || '').trim();
    const riskDescription = typeof body.risk_description === 'string' ? body.risk_description.trim() : '';
    const riskCategory = typeof body.risk_category === 'string' ? body.risk_category.trim() : '';
    const isActive = body.is_active === false ? false : true;

    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'id inválido.' }, { status: 400 });
    if (!UUID_REGEX.test(significantActivityId)) {
      return NextResponse.json({ error: 'significant_activity_id es obligatorio y debe ser UUID válido.' }, { status: 400 });
    }
    if (!riskName) return NextResponse.json({ error: 'risk_name es obligatorio.' }, { status: 400 });

    const rows = await prisma.$queryRaw<RiskCatalogByActivityRow[]>(Prisma.sql`
      WITH updated_risk AS (
        UPDATE core.risk
        SET
          code = COALESCE(NULLIF(${inputRiskCode}, ''), code),
          name = ${riskName},
          description = ${riskDescription || null},
          risk_type = ${riskCategory || 'linear'},
          is_active = ${isActive},
          risk_emerging_source_id = ${body.risk_emerging_source_id ? Prisma.sql`${body.risk_emerging_source_id}::bigint` : Prisma.sql`NULL`},
          risk_emerging_status_id = ${body.risk_emerging_status_id ? Prisma.sql`${body.risk_emerging_status_id}::bigint` : Prisma.sql`NULL`},
          risk_factor_id = ${body.risk_factor_id ? Prisma.sql`${body.risk_factor_id}::bigint` : Prisma.sql`NULL`},
          operational_risk_loss_event_type_id = ${body.operational_risk_loss_event_type_id ? Prisma.sql`${body.operational_risk_loss_event_type_id}::bigint` : Prisma.sql`NULL`},
          updated_at = now()
        WHERE id = ${id}::uuid
        RETURNING id, code, name, description, risk_type, is_active, risk_emerging_source_id, risk_emerging_status_id, risk_factor_id, operational_risk_loss_event_type_id
      ),
      updated_map AS (
        UPDATE core.map_elements_risk
        SET element_id = ${significantActivityId}::uuid
        WHERE risk_id = ${id}::uuid
        RETURNING element_id, risk_id
      ),
      missing_map AS (
        INSERT INTO core.map_elements_risk (element_id, risk_id, link_strength)
        SELECT ${significantActivityId}::uuid, ${id}::uuid, 3
        WHERE NOT EXISTS (SELECT 1 FROM core.map_elements_risk WHERE risk_id = ${id}::uuid)
        RETURNING element_id, risk_id
      )
      SELECT 
        r.id::text AS risk_catalog_id,
        COALESCE(m.element_id, mm.element_id)::text AS significant_activity_id,
        r.code AS risk_code,
        r.name AS risk_name,
        r.description AS risk_description,
        r.risk_type AS risk_category,
        r.is_active,
        r.risk_emerging_source_id::text AS risk_emerging_source_id,
        r.risk_emerging_status_id::text AS risk_emerging_status_id,
        r.risk_factor_id::text AS risk_factor_id,
        r.operational_risk_loss_event_type_id::text AS operational_risk_loss_event_type_id
      FROM updated_risk r
      LEFT JOIN updated_map m ON m.risk_id = r.id
      LEFT JOIN missing_map mm ON mm.risk_id = r.id
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
      risk_emerging_source_id: row.risk_emerging_source_id || null,
      risk_emerging_status_id: row.risk_emerging_status_id || null,
      risk_factor_id: row.risk_factor_id || null,
      operational_risk_loss_event_type_id: row.operational_risk_loss_event_type_id || null,
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
      UPDATE core.risk
      SET is_active = false, updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING id::text AS risk_catalog_id
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
        FROM core.catalog_probability
        WHERE is_active = true
        ORDER BY ordinal ASC
      `),
      prisma.$queryRaw<Array<{ catalog_impact_id: bigint; code: string; name: string; description: string | null; numeric_value: number; ordinal: number }>>(Prisma.sql`
        SELECT catalog_impact_id, code, name, description, numeric_value, ordinal
        FROM core.catalog_impact
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
      FROM core.control_catalog c
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
        FROM core.map_lineal_risk_risk_control m
        JOIN core.control_catalog c
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

    const rows = await Promise.all(seedRows.map(async (row) => {
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

      let inherentScale: RiskScaleRow | null = null;
      let residualScale: RiskScaleRow | null = null;
      if (inherentRisk != null) {
        inherentScale = await getRiskScaleBand(inherentRisk, 'INHERENT');
        if (!inherentScale) {
          throw new Error(`Configuración de riesgo: sin banda para inherente=${inherentRisk}`);
        }
      }
      if (residualScore != null) {
        residualScale = await getRiskScaleBand(residualScore, 'RESIDUAL');
        if (!residualScale) {
          throw new Error(`Configuración de riesgo: sin banda para residual=${residualScore}`);
        }
      }

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
        inherentScale,
        residualScale,
        mitigatingControlId: validControlId,
        mitigatingControlCode: selectedControlMeta?.code ?? null,
        mitigatingControlName: selectedControlMeta?.name ?? null,
        mitigatingControlDescription: selectedControlMeta?.description ?? null,
        coveragePct,
        residualScore,
        availableControls,
      };
    }));

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
    SELECT catalog_probability_id FROM core.catalog_probability WHERE numeric_value = ${v} AND is_active = true ORDER BY ordinal ASC LIMIT 1
  `);
  return rows[0]?.catalog_probability_id ?? null;
}

async function resolveImpactId(v: number) {
  const rows = await prisma.$queryRaw<{ catalog_impact_id: bigint }[]>(Prisma.sql`
    SELECT catalog_impact_id FROM core.catalog_impact WHERE numeric_value = ${v} AND is_active = true ORDER BY ordinal ASC LIMIT 1
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
    FROM core.risk_catalog
    WHERE risk_code = ${code}
      AND (
        (${significantActivityId ? Prisma.sql`${significantActivityId}::uuid` : Prisma.sql`NULL`} IS NULL AND significant_activity_id IS NULL)
        OR significant_activity_id = ${significantActivityId ? Prisma.sql`${significantActivityId}::uuid` : Prisma.sql`NULL`}
      )
    LIMIT 1
  `);
  if (existing[0]) return existing[0].risk_catalog_id;

  const inserted = await prisma.$queryRaw<{ risk_catalog_id: string }[]>(Prisma.sql`
    INSERT INTO core.risk_catalog (significant_activity_id, risk_code, risk_name, risk_description, risk_category, is_active, created_at, updated_at)
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
    const selectedCompanyIdRaw = String(body.companyId || '').trim();
    const selectedCompanyId = UUID_REGEX.test(selectedCompanyIdRaw) ? selectedCompanyIdRaw : null;
    if (!selectedCompanyId) {
      return NextResponse.json({ error: 'Debes seleccionar una empresa antes de guardar las actividades.' }, { status: 400 });
    }

    const seenActivities = new Map<string, number>();
    for (let idx = 0; idx < items.length; idx += 1) {
      const id = String(items[idx]?.significant_activity_id || '').trim();
      if (!UUID_REGEX.test(id)) {
        return NextResponse.json(
          { error: `Actividad inválida en la fila ${idx + 1}: debes seleccionar una actividad significativa.` },
          { status: 400 }
        );
      }
      if (seenActivities.has(id)) {
        const first = seenActivities.get(id) as number;
        return NextResponse.json(
          { error: `Actividad duplicada: filas ${first} y ${idx + 1}.` },
          { status: 400 }
        );
      }
      seenActivities.set(id, idx + 1);
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM core.risk_assessment_draft_item_risk
      WHERE risk_assessment_draft_item_id IN (
        SELECT risk_assessment_draft_item_id
        FROM core.risk_assessment_draft_item
        WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
      )
    `);
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM core.risk_assessment_draft_item
      WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
    `);

    for (let idx = 0; idx < items.length; idx += 1) {
      const item = items[idx];
      const significantActivityId = String(item.significant_activity_id || '').trim();

      const activityRows = await prisma.$queryRaw<Array<{
        significant_activity_id: string;
        activity_code: string;
        activity_name: string;
        activity_description: string | null;
      }>>(Prisma.sql`
        SELECT
          de.id::text AS significant_activity_id,
          de.code AS activity_code,
          COALESCE(de.name, de.title, de.code) AS activity_name,
          COALESCE(de.description, de.statement) AS activity_description
        FROM core.domain_elements de
        WHERE de.id = ${significantActivityId}::uuid
          AND de.element_type = 'ACTIVITY'
          AND COALESCE(de.is_active, true) = true
          AND EXISTS (
            SELECT 1
            FROM core.map_domain_element mde
            JOIN core.map_reino_domain mrd ON mrd.domain_id = mde.domain_id
            JOIN core.map_company_x_reino mcr ON mcr.reino_id = mrd.reino_id
            WHERE mde.element_id = de.id
              AND mcr.company_id = ${selectedCompanyId}::uuid
              AND COALESCE(mcr.is_active, true) = true
          )
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

      await upsertSignificantActivityMirror({
        id: activity.significant_activity_id,
        companyId: selectedCompanyId,
        code,
        name,
        description: desc,
        isActive: true,
      });

      const draftItem = await prisma.$queryRaw<{ risk_assessment_draft_item_id: bigint }[]>(Prisma.sql`
        INSERT INTO core.risk_assessment_draft_item (
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
              FROM core.risk_catalog
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
            INSERT INTO core.risk_assessment_draft_item_risk (
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
    const message =
      (error as any)?.code === '23505'
        ? 'Actividad o riesgo duplicado: revisa que no estés repitiendo la misma actividad.'
        : 'No se pudieron guardar las actividades';
    return NextResponse.json({ error: message }, { status: 500 });
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

    await prisma.$executeRaw(Prisma.sql`DELETE FROM core.risk_assessment_draft_item_control WHERE risk_assessment_draft_item_id = ${itemId}`);

    for (const ev of evaluations) {
      if (!ev.status) continue;
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO core.risk_assessment_draft_item_control (
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

    await prisma.$executeRaw(Prisma.sql`DELETE FROM core.risk_assessment_draft_item_action WHERE risk_assessment_draft_item_id = ${itemId}`);
    await prisma.$executeRaw(Prisma.sql`DELETE FROM core.risk_assessment_draft_item_finding WHERE risk_assessment_draft_item_id = ${itemId}`);

    for (const ext of extensions) {
      const title = ext.title?.trim();
      const desc = ext.notes?.trim();
      if (!title && !desc) continue;

      const finding = await prisma.$queryRaw<{ risk_assessment_draft_item_finding_id: bigint }[]>(Prisma.sql`
        INSERT INTO core.risk_assessment_draft_item_finding (
          risk_assessment_draft_item_id, finding_type, title, description, severity_level, recommendation, created_at, updated_at
        ) VALUES (${itemId}, 'gap', ${title || 'Hallazgo'}, ${desc || ''}, 'media', ${null}, now(), now())
        RETURNING risk_assessment_draft_item_finding_id
      `);

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO core.risk_assessment_draft_item_action (
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

async function ensureLinearRiskFinal(auth: { tenantId: string }, draft: LinearDraftRow) {
  const existing = await prisma.$queryRaw<Array<{ risk_assessment_final_id: bigint }>>(Prisma.sql`
    SELECT risk_assessment_final_id
    FROM core.risk_assessment_final
    WHERE source_draft_id = ${draft.risk_assessment_draft_id}
    LIMIT 1
  `);
  if (existing[0]) return existing[0].risk_assessment_final_id;

  const source = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT * FROM core.risk_assessment_draft
    WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
    LIMIT 1
  `);
  const row = source[0];
  if (!row) throw new Error('Draft fuente no encontrado');

  const companyUuidRows = await prisma.$queryRaw<{ data_type: string }[]>(Prisma.sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'risk_assessment_final'
      AND column_name = 'company_id'
    LIMIT 1
  `);
  const finalCompanyUuid = companyUuidRows[0]?.data_type === 'uuid';

  const inserted = finalCompanyUuid
    ? await prisma.$queryRaw<{ risk_assessment_final_id: bigint }[]>(Prisma.sql`
        INSERT INTO core.risk_assessment_final (
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
        INSERT INTO core.risk_assessment_final (
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

  await prisma.$executeRaw(Prisma.sql`
    UPDATE core.risk_assessment_draft
    SET status = 'concluded', concluded_at = now(), updated_at = now()
    WHERE risk_assessment_draft_id = ${draft.risk_assessment_draft_id}
  `);

  return inserted[0].risk_assessment_final_id;
}

export async function postLinearRiskDraftFinalizeHandler(draftId: string) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const draft = await findDraft(draftId, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });
    const finalId = await ensureLinearRiskFinal(auth, draft);
    return NextResponse.json({ ok: true, risk_assessment_final_id: Number(finalId) });
  } catch (error) {
    console.error('Error finalizing linear risk draft:', error);
    return NextResponse.json({ error: 'No se pudo finalizar la evaluación' }, { status: 500 });
  }
}

export async function postLinearRiskDraftReportHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const draft = await findDraft(id, auth.tenantId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });

    await request.json().catch(() => ({}));

    await ensureLinearRiskFinal(auth, draft);
    const data = await buildLinearRiskReportData(auth, id, draft);
    const buffer = await renderLinearRiskReportDocx(data);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Informe_Riesgo_Lineal_${draft.assessment_code}.docx"`
      }
    });
  } catch (error) {
    console.error('Error generating linear risk report:', error);
    return NextResponse.json({ error: 'No se pudo generar el informe' }, { status: 500 });
  }
}


