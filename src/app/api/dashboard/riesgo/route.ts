import prisma from '@/infrastructure/db/prisma/client';
import { nextHandler, withAccess } from '@/shared/http';

export const GET = nextHandler(
  withAccess({ module: 'risk', permission: 'structural-risk.read' }, async (_request, _context, access) => {
    const companyId = access.company.id;

    const [row] = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        (SELECT COUNT(*)::int FROM core.reino) AS reino_count,
        (SELECT COUNT(*)::int FROM core.domain) AS domain_count,
        (SELECT COUNT(*)::int FROM core.domain_elements) AS element_count,
        (SELECT COUNT(*)::int FROM core.risk) AS risk_count,
        (SELECT COUNT(*)::int FROM core.control) AS control_count,
        (SELECT COUNT(*)::int FROM core.map_reino_domain) AS reino_domain_map_count,
        (SELECT COUNT(*)::int FROM core.map_domain_element) AS domain_element_map_count,
        (SELECT COUNT(*)::int FROM core.obligation_graph) AS obligation_graph_count,
        (SELECT COUNT(*)::int FROM core.map_elements_risk) AS element_risk_map_count,
        (SELECT COUNT(*)::int FROM core.map_elements_control) AS element_control_map_count,
        (SELECT COUNT(*)::int FROM core.map_risk_control) AS risk_control_map_count,
        (SELECT COUNT(*)::int FROM linear_risk.significant_activity WHERE company_id = $1::uuid) AS significant_activity_count;
    `, companyId);

    return Response.json({
      key: 'dashboard-riesgo',
      label: 'Riesgo',
      generated_at: new Date().toISOString(),
      data: row ?? {},
    });
  })
);
