import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AuditCatalogRepository } from '@/modules/audit/domain/contracts/AuditCatalogRepository';
import type { AuditFindingsRepository } from '@/modules/audit/domain/contracts/AuditFindingsRepository';
import type { CatalogDomainRow, CatalogMappingRow, CatalogObligationRow, CatalogRiskRow, ControlByRisk } from '@/modules/audit/domain/types/AuditCatalogTypes';
import type { CreateManualFindingInput, ListFindingsInput, UpdateFindingStatusInput } from '@/modules/audit/domain/types/AuditFindingsTypes';

export class PrismaAuditRepository implements AuditCatalogRepository, AuditFindingsRepository {
  async getDomains(): Promise<CatalogDomainRow[]> {
    try {
      return await prisma.$queryRaw<CatalogDomainRow[]>`
        SELECT DISTINCT r.id, r.name, r.code
        FROM graph._reino r
        JOIN graph.map_reino_domain mrd ON mrd.reino_id = r.id
        ORDER BY r.name ASC
      `;
    } catch (error: any) {
      if (error?.code !== 'P2010' && error?.meta?.code !== '42P01') throw error;
      return prisma.$queryRaw<CatalogDomainRow[]>`
        SELECT DISTINCT r.id, r.name, r.code
        FROM graph.reino r
        JOIN graph.map_reino_domain mrd ON mrd.reino_id = r.id
        ORDER BY r.name ASC
      `;
    }
  }

  async getReinoDomains(reinoId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ domain_id: string }[]>`
      SELECT DISTINCT mrd.domain_id
      FROM graph.map_reino_domain mrd
      WHERE mrd.reino_id = ${reinoId}::uuid
      ORDER BY mrd.domain_id
    `;
    return (rows || []).map((r) => r.domain_id);
  }

  async getObligations(domainIds: string[]): Promise<CatalogObligationRow[]> {
    const rows = domainIds.length > 0
      ? await prisma.$queryRaw<{ id: string; title: string; code: string | null; domain_id: string }[]>`
          SELECT de.id, COALESCE(de.title, de.name, de.code) AS title, de.code, mde.domain_id
          FROM graph.domain_elements de
          JOIN graph.map_domain_element mde ON mde.element_id = de.id
          WHERE de.element_type = 'OBLIGATION'
            AND mde.domain_id = ANY(${domainIds}::uuid[])
          ORDER BY title ASC
        `
      : await prisma.$queryRaw<{ id: string; title: string; code: string | null; domain_id: string }[]>`
          SELECT de.id, COALESCE(de.title, de.name, de.code) AS title, de.code, mde.domain_id
          FROM graph.domain_elements de
          JOIN graph.map_domain_element mde ON mde.element_id = de.id
          WHERE de.element_type = 'OBLIGATION'
          ORDER BY title ASC
        `;

    return (rows || []).map((o) => ({
      id: o.id,
      title: o.title,
      code: o.code,
      domainId: o.domain_id,
    }));
  }

  async getMappings(): Promise<CatalogMappingRow[]> {
    return prisma.$queryRaw<CatalogMappingRow[]>`
      SELECT element_id, risk_id
      FROM core.map_elements_risk
      ORDER BY element_id, risk_id
    `;
  }

  async getRisks(domainIds: string[], obligationIds: string[], riskIds: string[]): Promise<CatalogRiskRow[]> {
    const filters: Prisma.Sql[] = [];

    if (riskIds.length > 0) {
      filters.push(Prisma.sql`r.id = ANY(${riskIds}::uuid[])`);
    } else if (obligationIds.length > 0) {
      filters.push(Prisma.sql`moc.element_id = ANY(${obligationIds}::uuid[])`);
    } else if (domainIds.length > 0) {
      filters.push(Prisma.sql`mde.domain_id = ANY(${domainIds}::uuid[])`);
    }

    const whereSql = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        r.id,
        r.code,
        r.name,
        r.description,
        r.status,
        r.risk_type,
        rt.name AS risk_type_name,
        rl.name AS risk_layer_name,
        COALESCE(
          array_agg(DISTINCT mde.domain_id) FILTER (WHERE mde.domain_id IS NOT NULL),
          ARRAY[]::uuid[]
        ) AS domain_ids
      FROM graph.risk r
      LEFT JOIN catalogos.corpus_catalog_risk_type rt ON rt.id = r.risk_type_id
      LEFT JOIN catalogos.corpus_catalog_risk_layer rl ON rl.id = r.risk_layer_id
      LEFT JOIN graph.map_risk_control mrc ON mrc.risk_id = r.id
      LEFT JOIN core.map_elements_control moc ON moc.control_id = mrc.control_id
      LEFT JOIN graph.map_domain_element mde ON mde.element_id = moc.element_id
      ${whereSql}
      GROUP BY r.id, r.code, r.name, r.description, r.status, r.risk_type, rt.name, rl.name
      ORDER BY r.name ASC
    `);

    return (rows || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      status: row.status,
      riskTypeName: row.risk_type_name ?? row.risk_type ?? null,
      riskLayerName: row.risk_layer_name ?? null,
      domainIds: row.domain_ids ?? [],
    }));
  }

  async getControlsByRisk(riskIds: string[]): Promise<Record<string, ControlByRisk[]>> {
    if (riskIds.length === 0) {
      return {};
    }

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        mrc.risk_id,
        c.id AS control_id,
        c.name,
        c.description,
        c.control_objective,
        c.rationale,
        mrc.coverage_notes
      FROM graph.map_risk_control mrc
      JOIN graph.control c ON c.id = mrc.control_id
      WHERE mrc.risk_id = ANY(${riskIds}::uuid[])
      ORDER BY mrc.risk_id, c.name ASC
    `);

    const byRisk: Record<string, ControlByRisk[]> = {};

    (rows || []).forEach((row: any) => {
      if (!byRisk[row.risk_id]) {
        byRisk[row.risk_id] = [];
      }

      let failureMode: string | null = null;
      let designIntent: string | null = null;
      const rat = row.rationale;

      if (rat && typeof rat === 'object') {
        failureMode = rat.failure_mode ?? null;
        designIntent = rat.design_intent ?? null;
      } else if (typeof rat === 'string') {
        try {
          const parsed = JSON.parse(rat);
          failureMode = parsed.failure_mode ?? null;
          designIntent = parsed.design_intent ?? null;
        } catch {
          failureMode = rat;
        }
      }

      byRisk[row.risk_id].push({
        id: row.control_id,
        name: row.name,
        description: row.description,
        controlObjective: row.control_objective,
        failureMode,
        designIntent,
        coverageNotes: row.coverage_notes,
      });
    });

    return byRisk;
  }

  async getFindingTypes(): Promise<unknown[]> {
    return prisma.corpusCatalogAuditFindingType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async seedFindingTypes(): Promise<void> {
    const defaultTypes = [
      { id: 1, code: 'CTRL_CRITICAL_FAIL', name: 'Falla Crítica de Control', defaultSeverity: 5, defaultExposureFloor: 0.7, defaultReadinessPenalty: 30, defaultDueDays: 15 },
      { id: 2, code: 'CTRL_SIG_FAIL', name: 'Falla Significativa de Control', defaultSeverity: 4, defaultExposureFloor: 0.4, defaultReadinessPenalty: 15, defaultDueDays: 30 },
      { id: 3, code: 'PEP_NO_EDD', name: 'Clientes PEP sin EDD', defaultSeverity: 5, defaultExposureFloor: 0.8, defaultReadinessPenalty: 50, defaultDueDays: 7 },
      { id: 4, code: 'ROS_LATE', name: 'Reporte ROS Extemporáneo', defaultSeverity: 4, defaultExposureFloor: 0.5, defaultReadinessPenalty: 25, defaultDueDays: 10 },
      { id: 5, code: 'UBO_MISSING', name: 'Falta de Identificación de Beneficiario Final', defaultSeverity: 5, defaultExposureFloor: 0.6, defaultReadinessPenalty: 40, defaultDueDays: 20 },
    ];

    for (const type of defaultTypes) {
      await prisma.corpusCatalogAuditFindingType.upsert({
        where: { id: type.id },
        update: type,
        create: type,
      });
    }
  }

  async listFindings(input: ListFindingsInput): Promise<unknown[]> {
    return prisma.corpusAuditFinding.findMany({
      where: { evaluationId: input.evaluationId },
      include: { eventType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createManualFinding(input: CreateManualFindingInput): Promise<unknown> {
    const allowedRoles = ['AUDITOR', 'AUDIT_MANAGER'];
    if (!allowedRoles.includes(input.userRole)) {
      throw Object.assign(new Error('Forbidden: Insufficient permissions'), { status: 403 });
    }

    const findingType = await prisma.corpusCatalogAuditFindingType.findUnique({
      where: { id: input.eventTypeId },
    });

    if (!findingType) {
      throw Object.assign(new Error('Finding type not found'), { status: 404 });
    }

    const isManager = input.userRole === 'AUDIT_MANAGER';
    const finalExposureFloor = isManager ? (input.exposureFloor ?? findingType.defaultExposureFloor) : findingType.defaultExposureFloor;
    const finalReadinessPenalty = isManager ? (input.readinessPenalty ?? findingType.defaultReadinessPenalty) : findingType.defaultReadinessPenalty;

    const finding = await prisma.corpusAuditFinding.create({
      data: {
        tenantId: input.tenantId,
        evaluationId: input.evaluationId,
        eventTypeId: input.eventTypeId,
        code: `AUDIT-MAN-${Date.now()}`,
        title: input.title || `${findingType.name} (Manual)`,
        description: input.description || 'Hallazgo creado manualmente por el equipo de cumplimiento.',
        severity: input.severity ?? findingType.defaultSeverity,
        status: 'open',
        exposureFloor: finalExposureFloor,
        readinessPenalty: finalReadinessPenalty,
        ownerRole: input.ownerRole ?? findingType.defaultOwnerRole,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        createdBy: input.userId,
        evidenceLinks: [],
        severityId: input.severity ?? findingType.defaultSeverity,
        statusId: 1,
      },
    });

    await prisma.corpusAuditLog.create({
      data: {
        tenantId: input.tenantId,
        entityName: 'corpus.audit_finding',
        entityId: (finding as any).id,
        action: 'MANUAL_CREATE',
        newData: finding as any,
        changedBy: input.userId,
        ipAddress: '127.0.0.1',
      },
    });

    return finding;
  }

  async updateFindingStatus(input: UpdateFindingStatusInput): Promise<unknown> {
    const allowedRoles = ['AUDITOR', 'AUDIT_MANAGER'];
    if (!allowedRoles.includes(input.userRole)) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    if (!['open', 'closed', 'suppressed'].includes(input.status)) {
      throw Object.assign(new Error('Invalid status'), { status: 400 });
    }

    const updateData: any = { status: input.status, updatedBy: input.userId };
    if (input.status === 'closed') {
      updateData.closedAt = new Date();
      updateData.closedBy = input.userId;
      updateData.metadata = { resolution: input.resolution ?? null };
    }

    const finding = await (prisma as any).corpusAuditFinding.update({
      where: { id: input.id },
      data: updateData,
    });

    await (prisma as any).corpusAuditLog.create({
      data: {
        tenantId: finding.tenantId,
        entityName: 'corpus.audit_finding',
        entityId: finding.id,
        action: `SET_STATUS_${input.status.toUpperCase()}`,
        newData: finding as any,
        changedBy: input.userId,
        ipAddress: '127.0.0.1',
      },
    });

    return finding;
  }
}

