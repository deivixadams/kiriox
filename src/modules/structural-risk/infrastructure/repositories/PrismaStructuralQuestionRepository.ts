import { Prisma } from '@prisma/client';
import { prisma } from '../../../../infrastructure/db/prisma/client';
import { AnalyticalQuestion, ExecutionContext, ExecutionResult, ResultType } from '../../domain/types/AnalyticalQuestion';
import { StructuralQuestionRepository } from '../../domain/contracts/StructuralQuestionRepository';

export class PrismaStructuralQuestionRepository implements StructuralQuestionRepository {
  async getMainQuestions(): Promise<AnalyticalQuestion[]> {
    try {
      const rows = await prisma.$queryRaw<
        Array<{
          question_no: number | null;
          code: string;
          question: string;
          description: string | null;
          objective: string | null;
          category: string | null;
          analytical_dimension: string | null;
          source_of_truth: string | null;
          source_kind: string | null;
          interpretation_rule: string | null;
          decision_use: string | null;
          business_meaning: string | null;
          graph_design: any | null;
        }>
      >`
        SELECT 
          question_no,
          code,
          question,
          description,
          objective,
          category,
          analytical_dimension,
          source_of_truth,
          source_kind,
          interpretation_rule,
          decision_use,
          business_meaning,
          graph_design
        FROM core.main_question
        ORDER BY question_no ASC, code ASC
      `;

      return rows.map((row, idx) => ({
        question_no: row.question_no ?? idx + 1,
        code: row.code,
        question: row.question,
        description: row.description ?? undefined,
        objective: row.objective ?? undefined,
        category: row.category ?? 'General',
        subcategory: undefined,
        analytical_dimension: row.analytical_dimension ?? undefined,
        source_of_truth: row.source_of_truth ?? '',
        source_kind: row.source_kind ?? 'query',
        graph_design: row.graph_design ?? null,
        result_type: 'table',
        answer_renderer: 'table',
        interpretation_rule: row.interpretation_rule ?? undefined,
        decision_use: row.decision_use ?? undefined,
        business_meaning: row.business_meaning ?? undefined,
        requires_graph_analysis: false,
        requires_linear_analysis: false,
        requires_simulation: false,
        is_active: true,
      }));
    } catch (error) {
      console.warn('Failed to fetch analytical questions from DB, using fallback:', error);
      // Fallback questions to prevent 500 errors in Step 2
      return [
        {
          question_no: 1,
          code: 'Q01',
          question: '¿Qué nodos tienen el mayor impacto estructural (propagation_impact_score) en el sistema?',
          description: 'Ranking estructural por impacto sistémico.',
          objective: 'Identificar los nodos con mayor impacto estructural.',
          category: 'Criticidad Estructural',
          subcategory: 'Impacto',
          analytical_dimension: 'Impacto Sistémico',
          source_of_truth: 'views.v_ultra_critical_controls',
          source_kind: 'view',
          result_type: 'ranking',
          answer_renderer: 'ranking',
          interpretation_rule: 'Mayor valor implica mayor impacto sistémico.',
          decision_use: 'Priorización de controles críticos.',
          business_meaning: 'Indica qué controles concentran mayor propagación de riesgo.',
          requires_graph_analysis: true,
          requires_linear_analysis: false,
          requires_simulation: false,
          is_active: true,
        },
        {
          question_no: 2,
          code: 'Q02',
          question: '¿Qué nodos actúan como puntos de ruptura catastrófica (collapse_triggers)?',
          description: 'Detección de disparadores de colapso.',
          objective: 'Detectar nodos con potencial de ruptura sistémica.',
          category: 'Criticidad Estructural',
          subcategory: 'Resiliencia',
          analytical_dimension: 'Resiliencia',
          source_of_truth: 'core.obligation_graph',
          source_kind: 'table',
          result_type: 'table',
          answer_renderer: 'table',
          interpretation_rule: 'Nodos con alta criticidad en cascada.',
          decision_use: 'Mitigación de puntos de ruptura.',
          business_meaning: 'Señala puntos donde el sistema puede colapsar.',
          requires_graph_analysis: true,
          requires_linear_analysis: false,
          requires_simulation: true,
          is_active: true,
        },
        {
          question_no: 3,
          code: 'Q03',
          question: '¿Qué nodos concentran mayor alcance estructural (risk_span)?',
          description: 'Alcance estructural por nodo.',
          objective: 'Medir concentración de exposición.',
          category: 'Criticidad Estructural',
          subcategory: 'Concentración',
          analytical_dimension: 'Concentración',
          source_of_truth: 'views._score_v_cre_structural_controls_with_graph_metrics_v1',
          source_kind: 'view',
          result_type: 'cards',
          answer_renderer: 'cards',
          interpretation_rule: 'Mayor alcance implica mayor concentración de riesgo.',
          decision_use: 'Equilibrar concentración de controles.',
          business_meaning: 'Mide alcance estructural del riesgo.',
          requires_graph_analysis: true,
          requires_linear_analysis: false,
          requires_simulation: false,
          is_active: true,
        }
      ] as AnalyticalQuestion[];
    }
  }

  async executeMainQuestion(code: string, context: ExecutionContext, debug: boolean): Promise<ExecutionResult> {
    const start = Date.now();
    const questionRows = await prisma.$queryRaw<
      Array<{
        code: string;
        question: string;
        source_of_truth: string | null;
        graph_design: any | null;
      }>
    >`
      SELECT code, question, source_of_truth, graph_design
      FROM core.main_question
      WHERE code = ${code}
      LIMIT 1
    `;

    const question = questionRows[0];
    if (!question) {
      throw new Error(`Question ${code} not found or inactive.`);
    }
    if (!question.source_of_truth) {
      throw new Error(`Question ${code} has no source_of_truth defined.`);
    }
    const rawQuery = String(question.source_of_truth).trim();
    if (!/^(with|select)\s/i.test(rawQuery)) {
      throw new Error(`source_of_truth for ${code} must be a SELECT query.`);
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(rawQuery);

    const duration = Date.now() - start;
    const normalizedData = Array.isArray(rows) ? rows : [];
    const safeData = JSON.parse(
      JSON.stringify(normalizedData, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    const safeGraphElements = JSON.parse(
      JSON.stringify(await buildRuleBasedGraph(question, context), (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    const resultType = 'table' as ResultType;
    const answerRenderer = 'table';

    return {
      data: safeData,
      graph_elements: safeGraphElements,
      graph_design: question.graph_design ?? null,
      metadata: {
        executed_at: new Date().toISOString(),
        duration_ms: duration,
        row_count: safeData.length || 0,
        executed_sql: debug ? rawQuery : undefined,
        result_type: resultType,
        answer_renderer: answerRenderer
      }
    };
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function buildRuleBasedGraph(
  question: { code: string; question: string; graph_design?: Record<string, any> | null },
  context: ExecutionContext
) {
  const text = `${question.code} ${question.question}`.toLowerCase();
  const focus = String(question.graph_design?.focus || question.graph_design?.focus_type || '').toLowerCase();
  const isControlFocus = focus === 'control' || text.includes('control');
  const isElementFocus =
    focus === 'element' ||
    focus === 'elemento' ||
    text.includes('elemento') ||
    text.includes('obligaci');

  if (isControlFocus) return buildControlFocusedGraph(context);
  if (isElementFocus) return buildElementFocusedGraph(context);

  const focusKey = focus || resolveFocusFromText(text);
  switch (focusKey) {
    case 'domain':
      return buildDomainImpactGraph(context);
    case 'dependency_root':
      return buildDependencyRootGraph(context);
    case 'hard_gate':
      return buildHardGateGraph(context);
    case 'hard_gate_dependencies':
      return buildHardGateDependenciesGraph(context);
    case 'hard_gate_failure_impact':
      return buildHardGateFailureImpactGraph(context);
    case 'collapse_trigger':
      return buildCollapseTriggerGraph(context);
    case 'bridge':
      return buildBridgeGraph(context);
    case 'propagation_paths':
      return buildPropagationPathsGraph(context);
    case 'excessive_dependency':
      return buildExcessiveDependencyGraph(context);
    case 'resilience':
      return buildResilienceGraph(context);
    case 'fragility':
      return buildFragilityPriorityGraph(context);
    case 'interventions':
      return buildInterventionsGraph(context);
    case 'high_impact_low_redundancy':
      return buildHighImpactLowRedundancyGraph(context);
    default:
      return [];
  }
}

function resolveFocusFromText(text: string) {
  if (text.includes('dominio')) return 'domain';
  if (text.includes('hard gate')) return 'hard_gate';
  if (text.includes('dependency root')) return 'dependency_root';
  if (text.includes('puentes') || text.includes('bridge')) return 'bridge';
  if (text.includes('collapse_trigger') || text.includes('ruptura catastrófica')) return 'collapse_trigger';
  if (text.includes('propaga') || text.includes('paths') || text.includes('propagation')) return 'propagation_paths';
  if (text.includes('fragilidad')) return 'fragility';
  if (text.includes('intervenciones')) return 'interventions';
  if (text.includes('baja redundancia')) return 'high_impact_low_redundancy';
  if (text.includes('dependencia estructural')) return 'excessive_dependency';
  if (text.includes('resiliencia')) return 'resilience';
  if (text.includes('impacto sistémico de la falla de un hard gate')) return 'hard_gate_failure_impact';
  if (text.includes('dependencias estructurales') && text.includes('hard gate')) return 'hard_gate_dependencies';
  return '';
}

function buildNodes(
  rows: Array<{ node_id: string; node_code?: string | null; node_name?: string | null; node_type?: string | null }>
) {
  return rows.map((row) => ({
    id: row.node_id,
    label: row.node_name || row.node_code || row.node_id,
    type: (row.node_type || 'NODE').toUpperCase(),
  }));
}

async function buildEdgesAmong(nodeIds: string[]) {
  if (!nodeIds.length) return [];
  const edges = await prisma.$queryRawUnsafe<Array<{
    edge_id: string;
    src_node_id: string;
    dst_node_id: string;
    edge_type: string | null;
  }>>(
    `SELECT edge_id, src_node_id, dst_node_id, edge_type
     FROM views._v_graph_edges_master
     WHERE src_node_id = ANY($1::uuid[])
       AND dst_node_id = ANY($1::uuid[])`,
    nodeIds
  );

  return edges.map((edge) => ({
    id: edge.edge_id,
    source: edge.src_node_id,
    target: edge.dst_node_id,
    label: edge.edge_type || 'EDGE',
  }));
}

async function buildDomainImpactGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `failed_node_type = 'DOMAIN'`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `SELECT failed_node_id as node_id, failed_node_code as node_code, failed_node_name as node_name, failed_node_type as node_type
     FROM views._v_graph_failure_impact
     WHERE ${where}
     ORDER BY failure_impact_score DESC
     LIMIT 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildDependencyRootGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `is_dependency_root = true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `SELECT node_id, node_code, node_name, node_type
     FROM views._v_graph_nodes_master
     WHERE ${where}
     ORDER BY structural_weight DESC NULLS LAST
     LIMIT 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildHardGateGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `is_hard_gate = true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `SELECT node_id, node_code, node_name, node_type
     FROM views._v_graph_nodes_master
     WHERE ${where}
     ORDER BY structural_weight DESC NULLS LAST
     LIMIT 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildHardGateDependenciesGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where = `reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `SELECT hard_gate_node_id as node_id, hard_gate_code as node_code, hard_gate_name as node_name, hard_gate_type as node_type
     FROM views._v_graph_hard_gate_coverage
     WHERE ${where}
     GROUP BY hard_gate_node_id, hard_gate_code, hard_gate_name, hard_gate_type
     ORDER BY count(distinct covered_node_id) DESC
     LIMIT 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildHardGateFailureImpactGraph(context: ExecutionContext) {
  return buildHardGateDependenciesGraph(context);
}

async function buildCollapseTriggerGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `collapse_trigger = true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND e.reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `SELECT n.node_id, n.node_code, n.node_name, n.node_type
     FROM views._v_graph_edges_master e
     JOIN views._v_graph_nodes_master n on n.node_id = e.src_node_id
     WHERE ${where}
     UNION
     SELECT n.node_id, n.node_code, n.node_name, n.node_type
     FROM views._v_graph_edges_master e
     JOIN views._v_graph_nodes_master n on n.node_id = e.dst_node_id
     WHERE ${where}
     LIMIT 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildBridgeGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `cardinality(path_node_ids) > 2`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `with exploded as (
        select unnest(path_node_ids[2:cardinality(path_node_ids)-1]) as bridge_node_id
        from views._v_graph_paths
        where ${where}
     ), ranked as (
        select bridge_node_id, count(*) as hits
        from exploded
        group by bridge_node_id
        order by hits desc
        limit 3
     )
     select n.node_id, n.node_code, n.node_name, n.node_type
     from ranked r
     join views._v_graph_nodes_master n on n.node_id = r.bridge_node_id`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildPropagationPathsGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where = `reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `select start_node_id as node_id, start_node_code as node_code, start_node_name as node_name, start_node_type as node_type
     from views._v_graph_paths
     where ${where}
     order by cumulative_propagation_multiplier desc
     limit 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildExcessiveDependencyGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where = `reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `select node_id, node_code, node_name, node_type
     from views._v_graph_node_degree
     where ${where}
     order by weighted_total_degree desc
     limit 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildResilienceGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where = `reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `select node_id, node_code, node_name, node_type
     from views._v_graph_node_redundancy
     where ${where}
     order by weighted_total_degree desc
     limit 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildFragilityPriorityGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where = `reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `select failed_node_id as node_id, failed_node_code as node_code, failed_node_name as node_name, failed_node_type as node_type
     from views._v_graph_failure_impact
     where ${where}
     order by failure_impact_score desc
     limit 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildInterventionsGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `failed_node_type = 'CONTROL'`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `select failed_node_id as node_id, failed_node_code as node_code, failed_node_name as node_name, failed_node_type as node_type
     from views._v_graph_failure_impact
     where ${where}
     order by failure_impact_score desc
     limit 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}

async function buildHighImpactLowRedundancyGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `r.low_redundancy_flag = true`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND r.reino_id = $${params.length}::uuid`;
  }
  const rows = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
    node_type: string | null;
  }>>(
    `select f.failed_node_id as node_id, f.failed_node_code as node_code, f.failed_node_name as node_name, f.failed_node_type as node_type
     from views._v_graph_failure_impact f
     join views._v_graph_node_redundancy r on r.node_id = f.failed_node_id
     where ${where}
     order by f.failure_impact_score desc
     limit 3`,
    ...params
  );
  const nodes = buildNodes(rows);
  const edges = await buildEdgesAmong(nodes.map((n) => n.id));
  return toElements(nodes, edges);
}
async function buildControlFocusedGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `failed_node_type = 'CONTROL'`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }

  const controls = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
  }>>(
    `SELECT failed_node_id as node_id, failed_node_code as node_code, failed_node_name as node_name
     FROM views._v_graph_failure_impact
     WHERE ${where}
     ORDER BY failure_impact_score DESC
     LIMIT 3`,
    ...params
  );

  if (!controls.length) return [];

  const controlIds = controls.map((c) => c.node_id);
  const risks = await prisma.$queryRawUnsafe<Array<{
    control_id: string;
    risk_id: string;
    risk_code: string | null;
    risk_name: string | null;
    mitigation_strength: number | null;
  }>>(
    `SELECT
        m.control_id,
        m.risk_id,
        r.code as risk_code,
        r.name as risk_name,
        m.mitigation_strength
     FROM core.map_risk_control m
     JOIN core.risk r
       ON r.id = m.risk_id
     WHERE m.control_id = ANY($1::uuid[])
     ORDER BY m.mitigation_strength DESC NULLS LAST`,
    controlIds
  );

  const riskMap = new Map<string, { risk_id: string; risk_code: string | null; risk_name: string | null }[]>();
  risks.forEach((row) => {
    const list = riskMap.get(row.control_id) || [];
    if (list.length < 3) {
      list.push({ risk_id: row.risk_id, risk_code: row.risk_code, risk_name: row.risk_name });
      riskMap.set(row.control_id, list);
    }
  });

  const nodes: Array<{ id: string; label: string; type: string }> = [];
  const edges: Array<{ id: string; source: string; target: string; label: string }> = [];

  controls.forEach((control) => {
    nodes.push({
      id: control.node_id,
      label: control.node_name || control.node_code || control.node_id,
      type: 'CONTROL',
    });
    const list = riskMap.get(control.node_id) || [];
    list.forEach((risk) => {
      if (!nodes.find((n) => n.id === risk.risk_id)) {
        nodes.push({
          id: risk.risk_id,
          label: risk.risk_name || risk.risk_code || risk.risk_id,
          type: 'RISK',
        });
      }
      edges.push({
        id: `${risk.risk_id}-${control.node_id}`,
        source: risk.risk_id,
        target: control.node_id,
        label: 'MITIGA',
      });
    });
  });

  return toElements(nodes, edges);
}

async function buildElementFocusedGraph(context: ExecutionContext) {
  const params: any[] = [];
  let where = `failed_node_type in ('ELEMENT','OBLIGATION')`;
  if (context.reinoId) {
    params.push(context.reinoId);
    where += ` AND reino_id = $${params.length}::uuid`;
  }

  const elements = await prisma.$queryRawUnsafe<Array<{
    node_id: string;
    node_code: string | null;
    node_name: string | null;
  }>>(
    `SELECT failed_node_id as node_id, failed_node_code as node_code, failed_node_name as node_name
     FROM views._v_graph_failure_impact
     WHERE ${where}
     ORDER BY failure_impact_score DESC
     LIMIT 3`,
    ...params
  );

  if (!elements.length) return [];

  const elementIds = elements.map((e) => e.node_id);
  const risks = await prisma.$queryRawUnsafe<Array<{
    element_id: string;
    risk_id: string;
    risk_code: string | null;
    risk_name: string | null;
    link_strength: number | null;
  }>>(
    `SELECT
        m.element_id,
        m.risk_id,
        r.code as risk_code,
        r.name as risk_name,
        m.link_strength
     FROM core.map_elements_risk m
     JOIN core.risk r
       ON r.id = m.risk_id
     WHERE m.element_id = ANY($1::uuid[])
     ORDER BY m.link_strength DESC NULLS LAST`,
    elementIds
  );

  const riskMap = new Map<string, { risk_id: string; risk_code: string | null; risk_name: string | null }[]>();
  risks.forEach((row) => {
    const list = riskMap.get(row.element_id) || [];
    if (list.length < 3) {
      list.push({ risk_id: row.risk_id, risk_code: row.risk_code, risk_name: row.risk_name });
      riskMap.set(row.element_id, list);
    }
  });

  const riskIds = Array.from(new Set(risks.map((r) => r.risk_id)));
  const controls = await prisma.$queryRawUnsafe<Array<{
    risk_id: string;
    control_id: string;
    control_code: string | null;
    control_name: string | null;
    mitigation_strength: number | null;
  }>>(
    `SELECT
        m.risk_id,
        m.control_id,
        c.code as control_code,
        c.name as control_name,
        m.mitigation_strength
     FROM core.map_risk_control m
     JOIN core.control c
       ON c.id = m.control_id
     WHERE m.risk_id = ANY($1::uuid[])
     ORDER BY m.mitigation_strength DESC NULLS LAST`,
    riskIds
  );

  const controlMap = new Map<string, { control_id: string; control_code: string | null; control_name: string | null }[]>();
  controls.forEach((row) => {
    const list = controlMap.get(row.risk_id) || [];
    if (list.length < 2) {
      list.push({ control_id: row.control_id, control_code: row.control_code, control_name: row.control_name });
      controlMap.set(row.risk_id, list);
    }
  });

  const nodes: Array<{ id: string; label: string; type: string }> = [];
  const edges: Array<{ id: string; source: string; target: string; label: string }> = [];

  elements.forEach((element) => {
    nodes.push({
      id: element.node_id,
      label: element.node_name || element.node_code || element.node_id,
      type: 'ELEMENT',
    });
    const list = riskMap.get(element.node_id) || [];
    list.forEach((risk) => {
      if (!nodes.find((n) => n.id === risk.risk_id)) {
        nodes.push({
          id: risk.risk_id,
          label: risk.risk_name || risk.risk_code || risk.risk_id,
          type: 'RISK',
        });
      }
      edges.push({
        id: `${element.node_id}-${risk.risk_id}`,
        source: element.node_id,
        target: risk.risk_id,
        label: 'RIESGO',
      });
      const controlsForRisk = controlMap.get(risk.risk_id) || [];
      controlsForRisk.forEach((control) => {
        if (nodes.length >= 18) return;
        if (!nodes.find((n) => n.id === control.control_id)) {
          nodes.push({
            id: control.control_id,
            label: control.control_name || control.control_code || control.control_id,
            type: 'CONTROL',
          });
        }
        edges.push({
          id: `${risk.risk_id}-${control.control_id}`,
          source: risk.risk_id,
          target: control.control_id,
          label: 'MITIGA',
        });
      });
    });
  });

  return toElements(nodes, edges);
}

function toElements(
  nodes: Array<{ id: string; label: string; type: string }>,
  edges: Array<{ id: string; source: string; target: string; label: string }>
) {
  const nodeElements = nodes.map((node) => ({
    element_kind: 'node' as const,
    element_data: {
      id: node.id,
      label: node.label,
      type: node.type,
    },
  }));
  const edgeElements = edges.map((edge) => ({
    element_kind: 'edge' as const,
    element_data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
    },
  }));
  return [...nodeElements, ...edgeElements];
}


