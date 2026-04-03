import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { DraftRecord } from '@/modules/audit/domain/types/AuditOpsTypes';

type LinearRiskDraftRow = {
  assessment_code: string;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type DraftNotesPayload = {
  source?: string;
  tenantId?: string;
  auditDraftId?: string;
  wizard?: Partial<DraftRecord>;
};
let draftCompanyIsUuidCache: boolean | null = null;

async function isDraftCompanyUuidColumn(): Promise<boolean> {
  if (draftCompanyIsUuidCache !== null) return draftCompanyIsUuidCache;
  const rows = await prisma.$queryRaw<{ data_type: string }[]>(Prisma.sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'linear_risk'
      AND table_name = 'risk_assessment_draft'
      AND column_name = 'company_id'
    LIMIT 1
  `);
  draftCompanyIsUuidCache = rows[0]?.data_type === 'uuid';
  return draftCompanyIsUuidCache;
}

type ActaPayload = {
  title?: string;
  assessment_period_label?: string;
  scope_description?: string;
  business_context?: string;
  model_of_business?: string;
  entidad_nombre?: string;
  periodo_inicio?: string;
  periodo_fin?: string;
  objetivo?: string;
  alcance?: string;
  metodologia?: string;
};

export function buildLinearDraftCode(auditDraftId: string): string {
  return `AUDIT-WIZARD-${auditDraftId}`;
}

function asTrimmedText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function toUuidTextOrNull(value: unknown): string | null {
  const text = asTrimmedText(value);
  if (!text) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null;
}

function parseDateToIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function parseNotes(value: string | null): DraftNotesPayload {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') return parsed as DraftNotesPayload;
  } catch {
    // ignore malformed notes
  }
  return {};
}

function buildAssessmentPeriodLabel(draft: DraftRecord): string | null {
  const acta = (draft.acta && typeof draft.acta === 'object') ? (draft.acta as ActaPayload) : null;
  const explicit = asTrimmedText(acta?.assessment_period_label);
  if (explicit) return explicit;
  const from = asTrimmedText(acta?.periodo_inicio) ?? asTrimmedText(draft.windowStart);
  const to = asTrimmedText(acta?.periodo_fin) ?? asTrimmedText(draft.windowEnd);
  if (!from && !to) return null;
  if (from && to) return `${from} a ${to}`;
  return from ?? to;
}

function buildLinearDraftTitle(auditDraftId: string, draft: DraftRecord): string {
  const acta = (draft.acta && typeof draft.acta === 'object') ? (draft.acta as ActaPayload) : null;
  const explicitTitle = asTrimmedText(acta?.title);
  if (explicitTitle) return explicitTitle;
  const entity = asTrimmedText(acta?.model_of_business) ?? asTrimmedText(acta?.entidad_nombre);
  return entity ? `Evaluacion de Riesgo - ${entity}` : `Evaluacion de Riesgo - ${auditDraftId.slice(0, 8)}`;
}

function toCanonicalWizardDraft(auditDraftId: string, source: Partial<DraftRecord> | null): DraftRecord {
  const nowIso = new Date().toISOString();
  return {
    id: auditDraftId,
    step: source?.step ?? 1,
    jurisdictionId: source?.jurisdictionId ?? null,
    frameworkId: source?.frameworkId ?? null,
    frameworkVersionId: source?.frameworkVersionId ?? null,
    companyId: source?.companyId ?? null,
    acta: source?.acta ?? null,
    scopeConfig: source?.scopeConfig ?? null,
    objectives: source?.objectives ?? null,
    team: source?.team ?? null,
    questionnaire: source?.questionnaire ?? null,
    guide: source?.guide ?? null,
    manualExtensions: source?.manualExtensions ?? null,
    windowStart: source?.windowStart ?? null,
    windowEnd: source?.windowEnd ?? null,
    createdAt: source?.createdAt ?? nowIso,
    updatedAt: source?.updatedAt ?? nowIso,
  };
}

export async function getCanonicalAuditDraftById(auditDraftId: string, tenantId: string): Promise<DraftRecord | null> {
  const assessmentCode = buildLinearDraftCode(auditDraftId);
  const rows = await prisma.$queryRaw<LinearRiskDraftRow[]>(
    Prisma.sql`
      SELECT assessment_code, notes, created_at, updated_at
      FROM linear_risk.risk_assessment_draft
      WHERE assessment_code = ${assessmentCode}
        AND COALESCE(is_deleted, false) = false
      LIMIT 1
    `
  );

  const row = rows[0];
  if (!row) return null;

  const notes = parseNotes(row.notes);
  if (notes.tenantId && notes.tenantId !== tenantId) return null;

  const wizard = toCanonicalWizardDraft(auditDraftId, notes.wizard ?? null);
  wizard.createdAt = parseDateToIso(row.created_at);
  wizard.updatedAt = parseDateToIso(row.updated_at);
  return wizard;
}

export async function upsertCanonicalAuditDraft(input: {
  auditDraftId: string;
  tenantId: string;
  draft: DraftRecord;
}): Promise<void> {
  const assessmentCode = buildLinearDraftCode(input.auditDraftId);
  const canonicalDraft = toCanonicalWizardDraft(input.auditDraftId, input.draft);
  const acta = (canonicalDraft.acta && typeof canonicalDraft.acta === 'object') ? (canonicalDraft.acta as ActaPayload) : null;
  const companyIdAsUuid = toUuidTextOrNull(canonicalDraft.companyId) ?? '00000000-0000-0000-0000-000000000000';
  const draftCompanyIsUuid = await isDraftCompanyUuidColumn();
  const companyValueSql = draftCompanyIsUuid
    ? Prisma.sql`${companyIdAsUuid}::uuid`
    : Prisma.sql`1::bigint`;

  const notesPayload: DraftNotesPayload = {
    source: 'audit_wizard_canonical',
    auditDraftId: input.auditDraftId,
    tenantId: input.tenantId,
    wizard: canonicalDraft,
  };

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO linear_risk.risk_assessment_draft (
        assessment_code,
        title,
        company_id,
        assessment_period_label,
        scope_description,
        business_context,
        model_of_business,
        methodology_version,
        status,
        notes,
        root_assessment_code,
        version_no,
        is_current_version,
        is_deleted,
        updated_at
      )
      VALUES (
        ${assessmentCode},
        ${buildLinearDraftTitle(input.auditDraftId, canonicalDraft)},
        ${companyValueSql},
        ${buildAssessmentPeriodLabel(canonicalDraft)},
        ${asTrimmedText(acta?.scope_description) ?? asTrimmedText(acta?.alcance)},
        ${asTrimmedText(acta?.business_context) ?? asTrimmedText((canonicalDraft.objectives as any)?.narrative) ?? asTrimmedText(acta?.objetivo)},
        ${asTrimmedText(acta?.model_of_business) ?? asTrimmedText(acta?.entidad_nombre)},
        ${asTrimmedText(acta?.metodologia)},
        ${'draft'},
        ${JSON.stringify(notesPayload)},
        ${assessmentCode},
        1,
        true,
        false,
        now()
      )
      ON CONFLICT (assessment_code)
      DO UPDATE SET
        title = EXCLUDED.title,
        assessment_period_label = EXCLUDED.assessment_period_label,
        scope_description = EXCLUDED.scope_description,
        business_context = EXCLUDED.business_context,
        model_of_business = EXCLUDED.model_of_business,
        methodology_version = EXCLUDED.methodology_version,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        root_assessment_code = EXCLUDED.root_assessment_code,
        is_current_version = true,
        is_deleted = false,
        deleted_at = NULL,
        deleted_by_manager_id = NULL,
        updated_at = now()
    `
  );
}
