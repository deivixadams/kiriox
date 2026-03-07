import prisma from '@/lib/prisma';
import type { AuthContext } from '@/lib/auth-server';

type DraftRecord = {
  id: string;
  step: number;
  jurisdictionId?: string | null;
  frameworkId?: string | null;
  frameworkVersionId?: string | null;
  companyId?: string | null;
  acta?: any;
  scopeConfig?: any;
  objectives?: any;
  team?: any;
  questionnaire?: any;
  guide?: any;
  manualExtensions?: any;
  windowStart?: string | null;
  windowEnd?: string | null;
  createdAt: string;
  updatedAt: string;
};

const normalizeDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapDraft = (draft: any): DraftRecord => ({
  id: draft.id,
  step: draft.step ?? 1,
  jurisdictionId: draft.jurisdiction_id ?? null,
  frameworkId: draft.framework_id ?? null,
  frameworkVersionId: draft.framework_version_id ?? null,
  companyId: draft.company_id ?? null,
  acta: draft.acta ?? null,
  scopeConfig: draft.scope_config ?? null,
  objectives: draft.objectives ?? null,
  team: draft.team ?? null,
  questionnaire: draft.questionnaire ?? null,
  guide: draft.guide ?? null,
  manualExtensions: draft.manual_extensions ?? null,
  windowStart: draft.window_start ? new Date(draft.window_start).toISOString() : null,
  windowEnd: draft.window_end ? new Date(draft.window_end).toISOString() : null,
  createdAt: draft.created_at ? new Date(draft.created_at).toISOString() : new Date().toISOString(),
  updatedAt: draft.updated_at ? new Date(draft.updated_at).toISOString() : new Date().toISOString()
});

export async function createDraft(auth: AuthContext) {
  const draft = await prisma.corpus.assessment_draft.create({
    data: {
      tenant_id: auth.tenantId,
      created_by: auth.userId,
      status: 'draft',
      step: 1
    }
  });
  return mapDraft(draft);
}

export async function getDraft(auth: AuthContext, id: string) {
  const draft = await prisma.corpus.assessment_draft.findFirst({
    where: { id, tenant_id: auth.tenantId }
  });
  return draft ? mapDraft(draft) : null;
}

export async function updateDraft(auth: AuthContext, id: string, patch: Partial<DraftRecord>) {
  const existing = await prisma.corpus.assessment_draft.findFirst({
    where: { id, tenant_id: auth.tenantId }
  });
  if (!existing) return null;

  const data: Record<string, any> = {
    updated_at: new Date()
  };

  if (patch.step !== undefined) {
    const nextStep = Number(patch.step);
    data.step = Number.isFinite(nextStep) ? nextStep : 1;
  }
  if (patch.jurisdictionId !== undefined) data.jurisdiction_id = patch.jurisdictionId;
  if (patch.frameworkId !== undefined) data.framework_id = patch.frameworkId;
  if (patch.frameworkVersionId !== undefined) data.framework_version_id = patch.frameworkVersionId;
  if (patch.companyId !== undefined) data.company_id = patch.companyId;
  if (patch.acta !== undefined) data.acta = patch.acta;
  if (patch.scopeConfig !== undefined) data.scope_config = patch.scopeConfig;
  if (patch.objectives !== undefined) data.objectives = patch.objectives;
  if (patch.team !== undefined) data.team = patch.team;
  if (patch.questionnaire !== undefined) data.questionnaire = patch.questionnaire;
  if (patch.guide !== undefined) data.guide = patch.guide;
  if (patch.manualExtensions !== undefined) data.manual_extensions = patch.manualExtensions;
  if (patch.windowStart !== undefined) data.window_start = normalizeDate(patch.windowStart);
  if (patch.windowEnd !== undefined) data.window_end = normalizeDate(patch.windowEnd);

  const draft = await prisma.corpus.assessment_draft.update({
    where: { id },
    data
  });
  return mapDraft(draft);
}
