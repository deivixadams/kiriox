/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { 
  Table, 
  BarChart3, 
  LayoutGrid, 
  TrendingUp, 
  Flame, 
  Network, 
  ArrowRightLeft, 
  AlertCircle 
} from 'lucide-react';
import { ExecutionResult, ResultType } from '@/modules/structural-risk/domain/types/AnalyticalQuestion';
import styles from './QuestionResultRenderer.module.css';
import type { ElementDefinition } from 'cytoscape';

interface Props {
  result: ExecutionResult | null;
  loading: boolean;
  error: string | null;
  suppressGraph?: boolean;
}

export default function QuestionResultRenderer({ result, loading, error, suppressGraph = false }: Props) {
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Analizando datos estructurales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertCircle className={styles.errorIcon} />
        <p>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.emptyState}>
        <p>Selecciona una pregunta para ejecutar el análisis.</p>
      </div>
    );
  }

  const { data, metadata } = result;

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontraron hallazgos para los parámetros actuales.</p>
      </div>
    );
  }

  const resolvedRenderer = (metadata.answer_renderer || metadata.result_type) as ResultType;

  const renderContent = () => {
    switch (resolvedRenderer) {
      case 'metric':
        return renderMetric(data[0]);
      case 'ranking':
        return renderRanking(data);
      case 'table':
        return renderTable(data);
      case 'cards':
        return renderCards(data);
      case 'heatmap':
        return renderHeatmap(data);
      case 'graph':
        if (suppressGraph) {
          return (
            <div className={styles.emptyState}>
              Respuesta gráfica disponible en el canvas.
            </div>
          );
        }
        return <GraphQuestionRenderer data={data} />;
      case 'path':
        return renderPath(data);
      default:
        return renderTable(data);
    }
  };

  return (
    <div className={styles.container}>
      {renderContent()}

      {metadata.executed_sql && !suppressGraph && (
        <div className={styles.debugPanel}>
          <details>
            <summary>Depuración técnica (SQL)</summary>
            <pre><code>{metadata.executed_sql}</code></pre>
          </details>
        </div>
      )}
    </div>
  );
}

type GraphRow = {
  element_kind?: 'node' | 'edge';
  element_key?: string;
  element_data?: Record<string, any>;
};

export function GraphQuestionRenderer({ data, design }: { data: any[]; design?: Record<string, any> | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const GRAPH_MOTION_SPEED = 0.8;
  const BASE_ANIMATION_MS = 900;

  const elements = useMemo(() => {
    return extractGraphElements(data, design);
  }, [data, design]);

  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;
    let mounted = true;
    let cy: any = null;

    const renderGraph = async () => {
      const cytoscapeImport = (await import('cytoscape')) as any;
      const cytoscape = (cytoscapeImport.default ?? cytoscapeImport) as any;
      if (!mounted || !containerRef.current) return;

      cy = cytoscape({
        container: containerRef.current,
        elements,
        layout: {
          name: String(design?.layout || 'cose'),
          animate: true,
          animationDuration: Math.round(BASE_ANIMATION_MS / GRAPH_MOTION_SPEED),
          fit: true,
          padding: 40,
        } as any,
        minZoom: 0.2,
        maxZoom: 3,
        style: buildBasicStylesheet() as any,
      });

      // Force consistent label sizes regardless of element count
      cy.style()
        .selector('node')
        .style({ 'font-size': 7 })
        .selector('edge')
        .style({ 'font-size': 5 })
        .update();
    };

    renderGraph();
    return () => {
      mounted = false;
      if (cy) cy.destroy();
    };
  }, [elements]);

  if (!elements.length) {
    return (
      <div className={styles.emptyState}>
        No hay datos de grafo disponibles para esta pregunta.
      </div>
    );
  }

  return <div ref={containerRef} className={styles.graphCanvas} />;
}

function extractGraphElements(data: any[], design?: Record<string, any> | null): ElementDefinition[] {
  if (!Array.isArray(data)) return [];
  if (data.length === 0) return [];

  if ('elements' in (data[0] || {})) {
    const payload = data[0] as { elements?: GraphRow[] };
    return toCytoscapeElements(payload.elements || [], design);
  }

  if (data[0]?.element_kind) {
    return toCytoscapeElements(data as GraphRow[], design);
  }

  const nodes = data[0]?.nodes || [];
  const edges = data[0]?.edges || [];
  if (nodes.length || edges.length) {
    const normalized: GraphRow[] = [
      ...nodes.map((node: any) => ({ element_kind: 'node', element_data: node })),
      ...edges.map((edge: any) => ({ element_kind: 'edge', element_data: edge })),
    ];
    return toCytoscapeElements(normalized, design);
  }

  return [];
}

function toCytoscapeElements(rows: GraphRow[], design?: Record<string, any> | null): ElementDefinition[] {
  const labelField = String(design?.label_field || '').trim();
  const nodeColorBy = String(design?.node_color_by || '').toLowerCase();
  const edgeColorBy = String(design?.edge_color_by || '').toLowerCase();
  const maxNodes = typeof design?.max_nodes === 'number' ? design.max_nodes : null;
  const hideNodeTypes = Array.isArray(design?.hide_node_types)
    ? new Set(design?.hide_node_types.map((t: string) => String(t).toUpperCase()))
    : null;
  const hideEdgeTypes = Array.isArray(design?.hide_edge_types)
    ? new Set(design?.hide_edge_types.map((t: string) => String(t).toUpperCase()))
    : null;

  let nodesCount = 0;
  return rows
    .filter((row) => row?.element_data)
    .map((row) => {
      const data = row.element_data || {};
      const id = String(data.id || data.code || data.key || row.element_key || Math.random());
      const type = String(data.type || data.node_type || data.kind || 'NODE').toUpperCase();
      if (row.element_kind === 'node') {
        if (hideNodeTypes?.has(type)) return null as any;
        nodesCount += 1;
        if (maxNodes && nodesCount > maxNodes) return null as any;
      }
      if (row.element_kind === 'edge' && hideEdgeTypes?.has(String(data.edge_type || data.type || '').toUpperCase())) {
        return null as any;
      }
      const colorMap: Record<string, string> = {
        RISK: '#ef4444',
        CONTROL: '#22c55e',
        ELEMENT: '#facc15',
        OBLIGATION: '#facc15',
      };
      const shapeMap: Record<string, string> = {
        ELEMENT: 'triangle',
        OBLIGATION: 'triangle',
        CONTROL: 'ellipse',
        RISK: 'star',
      };
      const sizeMap: Record<string, number> = {
        ELEMENT: 60,
        OBLIGATION: 60,
        CONTROL: 52,
        RISK: 48,
      };
      const vizColor =
        nodeColorBy === 'custom' && data.color ? String(data.color) : colorMap[type] || '#38bdf8';
      const vizShape = shapeMap[type] || 'ellipse';
      const vizSize = Number(data.size) || sizeMap[type] || 46;
      if (row.element_kind === 'edge') {
        return {
          data: {
            id,
            source: String(data.source || data.from || data.source_id || ''),
            target: String(data.target || data.to || data.target_id || ''),
            label: data.label || data.edge_type || data.code || 'edge',
            vizColor:
              edgeColorBy === 'custom' && data.color
                ? String(data.color)
                : '#ffffff',
          },
        };
      }
      const label =
        (labelField && data[labelField]) ||
        data.label ||
        data.name ||
        data.title ||
        data.node_name ||
        data.code ||
        id;
      return {
        data: {
          id,
          label,
          type,
          vizColor,
          vizShape,
          vizSize,
        },
      };
    })
    .filter(Boolean);
}

function buildBasicStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(vizColor)',
        label: 'data(label)',
        color: '#e5eefc',
        'font-size': 7,
        'font-weight': 700,
        'text-outline-width': 2,
        'text-outline-color': '#000000',
        'text-wrap': 'wrap',
        'text-max-width': 120,
        'text-valign': 'center',
        'text-halign': 'center',
        width: 'data(vizSize)',
        height: 'data(vizSize)',
        'border-width': 2,
        'border-color': '#ffffff',
        shape: 'data(vizShape)',
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'curve-style': 'bezier',
        'line-color': 'data(vizColor)',
        'target-arrow-color': 'data(vizColor)',
        'target-arrow-shape': 'triangle',
        label: 'data(label)',
        color: '#bfdbfe',
        'font-size': 5,
        'text-background-opacity': 1,
        'text-background-color': 'rgba(7, 13, 30, 0.88)',
        'text-background-padding': 3,
        'text-outline-width': 2,
        'text-outline-color': '#000000',
        'text-rotation': 'autorotate',
        'overlay-opacity': 0,
        opacity: 0.9,
      },
    },
  ];
}

function getResultIcon(type: ResultType) {
  switch (type) {
    case 'table': return <Table size={14} />;
    case 'cards': return <LayoutGrid size={14} />;
    case 'metric': return <TrendingUp size={14} />;
    case 'ranking': return <BarChart3 size={14} />;
    case 'heatmap': return <Flame size={14} />;
    case 'graph': return <Network size={14} />;
    case 'path': return <ArrowRightLeft size={14} />;
  }
}

function renderMetric(item: any) {
  const value = item.value || item.count || 0;
  const label = item.label || item.name || 'Total';
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
    </div>
  );
}

function renderRanking(data: any[]) {
  return (
    <div className={styles.rankingList}>
      {data.map((item, idx) => (
        <div key={idx} className={styles.rankingItem}>
          <div className={styles.rankingRank}>{idx + 1}</div>
          <div className={styles.rankingInfo}>
            <div className={styles.rankingLabel}>{item.label || item.name || item.code}</div>
            <div className={styles.rankingValue}>{item.value || item.count}</div>
          </div>
          <div className={styles.rankingBarContainer}>
            <div 
              className={styles.rankingBar} 
              style={{ width: `${Math.min(100, (item.value / data[0].value) * 100)}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTable(data: any[]) {
  const columns = Object.keys(data[0]);
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{col.replaceAll('_', ' ').toUpperCase()}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => <td key={col}>{String(row[col])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCards(data: any[]) {
  return (
    <div className={styles.cardGrid}>
      {data.map((item, i) => (
        <div key={i} className={styles.dataCard}>
          <h3>{item.title || item.name || item.code}</h3>
          <p>{item.description || item.reason}</p>
          {item.value && <div className={styles.cardBadge}>{item.value}</div>}
        </div>
      ))}
    </div>
  );
}

function renderHeatmap(data: any[]) {
  return (
    <div className={styles.heatmap}>
      {data.map((item, i) => (
        <div 
          key={i} 
          className={styles.heatmapCell}
          style={{ opacity: 0.1 + (item.value / 10) }}
          title={`${item.label}: ${item.value}`}
        >
          {item.value}
        </div>
      ))}
    </div>
  );
}

function renderPath(data: any[]) {
  return (
    <div className={styles.pathList}>
      {data.map((step, i) => (
        <div key={i} className={styles.pathStep}>
          <div className={styles.pathNode}>{step.label}</div>
          {i < data.length - 1 && <div className={styles.pathArrow}><ArrowRightLeft size={16} /></div>}
        </div>
      ))}
    </div>
  );
}
