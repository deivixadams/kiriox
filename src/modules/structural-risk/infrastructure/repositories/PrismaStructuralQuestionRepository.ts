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
          business_meaning
        FROM structural_risk.main_question
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
      }>
    >`
      SELECT code, question, source_of_truth
      FROM structural_risk.main_question
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
    if (!rawQuery.toLowerCase().startsWith('select')) {
      throw new Error(`source_of_truth for ${code} must be a SELECT query.`);
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(rawQuery);

    const duration = Date.now() - start;
    const normalizedData = Array.isArray(rows) ? rows : [];
    const resultType = 'table' as ResultType;
    const answerRenderer = 'table';

    return {
      data: normalizedData,
      metadata: {
        executed_at: new Date().toISOString(),
        duration_ms: duration,
        row_count: normalizedData.length || 0,
        executed_sql: debug ? rawQuery : undefined,
        result_type: resultType,
        answer_renderer: answerRenderer
      }
    };
  }
}
