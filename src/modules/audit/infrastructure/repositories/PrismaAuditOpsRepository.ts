import prisma from '@/infrastructure/db/prisma/client';
import type { AuditOpsRepository } from '@/modules/audit/domain/contracts/AuditOpsRepository';
import type { AuditAssessmentListItem, AuditScopeSummary, AuditStatItem, DraftRecord } from '@/modules/audit/domain/types/AuditOpsTypes';
import { getCanonicalAuditDraftById, upsertCanonicalAuditDraft } from './linearRiskDraftStore';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

function buildDefaultDraftRecord(id: string): DraftRecord {
  const nowIso = new Date().toISOString();
  return {
    id,
    step: 1,
    jurisdictionId: null,
    frameworkId: null,
    frameworkVersionId: null,
    companyId: null,
    acta: null,
    scopeConfig: null,
    objectives: null,
    team: null,
    questionnaire: null,
    guide: null,
    manualExtensions: null,
    windowStart: null,
    windowEnd: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function mergeDraft(current: DraftRecord, patch: Partial<DraftRecord>): DraftRecord {
  return {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

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
    const bridge = await prisma.corpus.assessment_draft.create({
      data: {
        tenant_id: auth.tenantId,
        created_by: auth.userId,
        status: 'draft',
        step: 1,
      },
    });
    const canonicalDraft = buildDefaultDraftRecord(bridge.id);
    await upsertCanonicalAuditDraft({
      auditDraftId: bridge.id,
      tenantId: auth.tenantId,
      draft: canonicalDraft,
    });
    return canonicalDraft;
  }

  async getDraft(auth: { tenantId: string }, id: string): Promise<DraftRecord | null> {
    const bridge = await prisma.corpus.assessment_draft.findFirst({
      where: { id, tenant_id: auth.tenantId },
      select: { id: true },
    });
    if (!bridge) return null;

    const canonical = await getCanonicalAuditDraftById(id, auth.tenantId);
    if (canonical) return canonical;

    const fallback = buildDefaultDraftRecord(id);
    await upsertCanonicalAuditDraft({
      auditDraftId: id,
      tenantId: auth.tenantId,
      draft: fallback,
    });
    return fallback;
  }

  async updateDraft(auth: { tenantId: string }, id: string, patch: Partial<DraftRecord>): Promise<DraftRecord | null> {
    const bridge = await prisma.corpus.assessment_draft.findFirst({
      where: { id, tenant_id: auth.tenantId },
      select: { id: true },
    });
    if (!bridge) return null;

    const current = (await getCanonicalAuditDraftById(id, auth.tenantId)) ?? buildDefaultDraftRecord(id);
    const next = mergeDraft(current, patch);

    await upsertCanonicalAuditDraft({
      auditDraftId: id,
      tenantId: auth.tenantId,
      draft: next,
    });

    await prisma.corpus.assessment_draft.update({
      where: { id },
      data: {
        step: Number.isFinite(Number(next.step)) ? Number(next.step) : 1,
        updated_at: new Date(),
      },
    });

    return next;
  }
}

