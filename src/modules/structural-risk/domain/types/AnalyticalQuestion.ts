export type ResultType = 'table' | 'cards' | 'metric' | 'ranking' | 'heatmap' | 'graph' | 'path';

export interface AnalyticalQuestion {
  question_no: number;
  code: string;
  question: string;
  description?: string;
  objective?: string;
  category: string;
  subcategory?: string;
  analytical_dimension?: string;
  source_of_truth: string;
  source_kind: string;
  graph_design?: Record<string, any> | null;
  result_type: ResultType;
  answer_renderer: string;
  interpretation_rule?: string;
  decision_use?: string;
  business_meaning?: string;
  requires_graph_analysis: boolean;
  requires_linear_analysis: boolean;
  requires_simulation: boolean;
  is_active: boolean;
}

export interface ExecutionContext {
  companyId: string;
  frameworkVersionId?: string | null;
  reinoId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  extraParams?: Record<string, any>;
}

export interface ExecutionResult {
  data: any[];
  graph_elements?: Array<{
    element_kind: 'node' | 'edge';
    element_data: Record<string, any>;
  }>;
  graph_design?: Record<string, any> | null;
  metadata: {
    executed_at: string;
    duration_ms: number;
    row_count: number;
    executed_sql?: string;
    result_type: ResultType;
    answer_renderer: string;
  };
}
