import prisma from '@/infrastructure/db/prisma/client';
import type { AuditOpsRepository } from '@/modules/audit/domain/contracts/AuditOpsRepository';
import type { AuditAssessmentListItem, AuditScopeSummary, AuditStatItem, DraftRecord } from '@/modules/audit/domain/types/AuditOpsTypes';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

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
  updatedAt: draft.updated_at ? new Date(draft.updated_at).toISOString() : new Date().toISOString(),
});

export class PrismaAuditOpsRepository implements AuditOpsRepository {
  async listAssessments(auth: { roleCode: string; tenantId: string }): Promise<AuditAssessmentListItem[]> {
    const where = isAdmin(auth.roleCode) ? {} : { company_id: auth.tenantId };

    const rows = await prisma.corpusAssessment.findMany({
      where,
      include: {
        company: { select: { name: true } },
        framework_version: { select: { version: true, corpus_framework: { select: { name: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });

    return rows.map((row: any) => {
      const frameworkLabel = row.framework_version
        ? `${row.framework_version.corpus_framework?.name ?? 'Marco'} v${row.framework_version.version ?? ''}`.trim()
        : 'Sin marco';
      return {
        id: row.id,
        name: row.name,
        company: row.company?.name ?? 'Sin empresa',
        framework: frameworkLabel,
        status: 'Registrado',
        findings: 0,
        readiness: null,
        createdAt: row.created_at?.toISOString(),
      };
    });
  }

  async getStats(): Promise<AuditStatItem[]> {
    const stats = await prisma.$transaction([
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM graph.domain`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM graph.domain_elements WHERE element_type = 'OBLIGATION'`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM graph.risk`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM graph.control`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM graph.map_risk_control`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM core.map_elements_risk`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM core.map_elements_control`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM corpus.audit_assessment`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM corpus.audit_evaluation`,
      prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int as count FROM score.run`,
    ]);

    return [
      { label: 'Dominios', value: stats[0][0].count, badge: 'Corpus', icon: 'domain', color: '#3b82f6' },
      { label: 'Obligaciones', value: stats[1][0].count, badge: 'Corpus', icon: 'obligation', color: '#8b5cf6' },
      { label: 'Riesgos', value: stats[2][0].count, badge: 'Corpus', icon: 'risk', color: '#f59e0b' },
      { label: 'Controles', value: stats[3][0].count, badge: 'Corpus', icon: 'control', color: '#10b981' },
      { label: 'Map Riesgo↔Ctrl', value: stats[4][0].count, badge: 'Mapping', icon: 'map_rc', color: '#06b6d4' },
      { label: 'Map Oblig↔Riesgo', value: stats[5][0].count, badge: 'Mapping', icon: 'map_or', color: '#ec4899' },
      { label: 'Map Oblig↔Ctrl', value: stats[6][0].count, badge: 'Mapping', icon: 'map_oc', color: '#14b8a6' },
      { label: 'Auditorías', value: stats[7][0].count, badge: 'Audit', icon: 'audit', color: '#6366f1' },
      { label: 'Evaluaciones', value: stats[8][0].count, badge: 'Audit', icon: 'finding', color: '#ef4444' },
      { label: 'Corridas (Run)', value: stats[9][0].count, badge: 'Score', icon: 'run', color: '#22c55e' },
    ];
  }

  async deriveScope(domainIds: string[], obligationIds: string[]): Promise<AuditScopeSummary> {
    let resolvedObligationIds = obligationIds;

    if (resolvedObligationIds.length === 0 && domainIds.length > 0) {
      const obligations = await prisma.$queryRaw<{ id: string }[]>`
        SELECT de.id
        FROM graph.domain_elements de
        JOIN graph.map_domain_element mde ON mde.element_id = de.id
        WHERE de.element_type = 'OBLIGATION'
          AND mde.domain_id = ANY(${domainIds}::uuid[])
      `;
      resolvedObligationIds = (obligations || []).map((o) => o.id);
    }

    const obligationCount = resolvedObligationIds.length;
    let riskCount = 0;
    let controlCount = 0;

    if (resolvedObligationIds.length > 0) {
      const risks = await prisma.$queryRaw<{ risk_id: string }[]>`
        SELECT DISTINCT mrc.risk_id
        FROM core.map_elements_control moc
        JOIN graph.map_risk_control mrc ON mrc.control_id = moc.control_id
        WHERE moc.element_id = ANY(${resolvedObligationIds}::uuid[])
      `;
      riskCount = (risks || []).length;

      const controls = await prisma.$queryRaw<{ control_id: string }[]>`
        SELECT DISTINCT control_id
        FROM core.map_elements_control
        WHERE element_id = ANY(${resolvedObligationIds}::uuid[])
      `;
      controlCount = new Set((controls || []).map((c) => c.control_id)).size;
    }

    return {
      obligationCount,
      riskCount,
      controlCount,
      testCount: 0,
    };
  }

  async createDraft(auth: { tenantId: string; userId: string }): Promise<DraftRecord> {
    const draft = await prisma.corpus.assessment_draft.create({
      data: {
        tenant_id: auth.tenantId,
        created_by: auth.userId,
        status: 'draft',
        step: 1,
      },
    });
    return mapDraft(draft);
  }

  async getDraft(auth: { tenantId: string }, id: string): Promise<DraftRecord | null> {
    const draft = await prisma.corpus.assessment_draft.findFirst({
      where: { id, tenant_id: auth.tenantId },
    });
    return draft ? mapDraft(draft) : null;
  }

  async updateDraft(auth: { tenantId: string }, id: string, patch: Partial<DraftRecord>): Promise<DraftRecord | null> {
    const existing = await prisma.corpus.assessment_draft.findFirst({
      where: { id, tenant_id: auth.tenantId },
    });
    if (!existing) return null;

    const data: Record<string, any> = { updated_at: new Date() };

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

    const draft = await prisma.corpus.assessment_draft.update({ where: { id }, data });
    return mapDraft(draft);
  }
}

