"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PortfolioGraphCanvas.module.css';

const FRAMEWORKS = ['AML', 'CYB'] as const;

type FrameworkCode = (typeof FRAMEWORKS)[number];

type SimulationGraphNode = {
  node_id: string;
  node_type: 'ELEMENT' | 'RISK' | 'CONTROL' | 'OBLIGATION';
  node_code?: string | null;
  node_name?: string | null;
  failure_impact_score?: number | null;
};

type SimulationGraphEdge = {
  edge_id?: string;
  edge_type?: string | null;
  src_node_id: string;
  dst_node_id: string;
};

type SimulationTopology = {
  nodes: SimulationGraphNode[];
  edges: SimulationGraphEdge[];
};

type CytoscapeModule = typeof import('cytoscape');

type CytoscapeCore = import('cytoscape').Core;

type CytoscapeElementDefinition = import('cytoscape').ElementDefinition;

const NODE_COLORS: Record<string, string> = {
  ELEMENT: '#38BDF8',
  OBLIGATION: '#38BDF8',
  RISK: '#F97316',
  CONTROL: '#22C55E',
};

function buildStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        color: '#F8FAFC',
        'font-size': 10,
        'text-wrap': 'wrap',
        'text-max-width': 90,
        'background-color': '#38BDF8',
        width: 32,
        height: 32,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.2,
        'curve-style': 'bezier',
        'line-color': 'rgba(148, 163, 184, 0.6)',
        'target-arrow-color': 'rgba(148, 163, 184, 0.6)',
        'target-arrow-shape': 'triangle',
      },
    },
    {
      selector: '.node-element',
      style: { 'background-color': NODE_COLORS.ELEMENT },
    },
    {
      selector: '.node-risk',
      style: { 'background-color': NODE_COLORS.RISK },
    },
    {
      selector: '.node-control',
      style: { 'background-color': NODE_COLORS.CONTROL },
    },
  ];
}

function toElementDefinitions(nodes: SimulationGraphNode[], edges: SimulationGraphEdge[]): CytoscapeElementDefinition[] {
  const nodeDefs: CytoscapeElementDefinition[] = nodes.map((node) => {
    const label = `${node.node_code ? `${node.node_code} - ` : ''}${node.node_name ?? node.node_id}`;
    const nodeClass = node.node_type === 'RISK'
      ? 'node-risk'
      : node.node_type === 'CONTROL'
      ? 'node-control'
      : 'node-element';

    return {
      data: {
        id: node.node_id,
        label,
      },
      classes: nodeClass,
    };
  });

  const edgeDefs: CytoscapeElementDefinition[] = edges.map((edge) => ({
    data: {
      id: edge.edge_id ?? `${edge.src_node_id}_${edge.dst_node_id}_${edge.edge_type ?? 'EDGE'}`,
      source: edge.src_node_id,
      target: edge.dst_node_id,
    },
  }));

  return [...nodeDefs, ...edgeDefs];
}

function filterTop5Subgraph(topology: SimulationTopology): SimulationTopology {
  const elements = topology.nodes.filter((node) => node.node_type === 'ELEMENT' || node.node_type === 'OBLIGATION');
  const topElements = [...elements]
    .sort((a, b) => (b.failure_impact_score ?? 0) - (a.failure_impact_score ?? 0))
    .slice(0, 5);

  const topElementIds = new Set(topElements.map((node) => node.node_id));
  const directEdges = topology.edges.filter(
    (edge) => topElementIds.has(edge.src_node_id) || topElementIds.has(edge.dst_node_id)
  );

  const nodeIds = new Set(topElementIds);
  directEdges.forEach((edge) => {
    nodeIds.add(edge.src_node_id);
    nodeIds.add(edge.dst_node_id);
  });

  const filteredNodes = topology.nodes.filter((node) => nodeIds.has(node.node_id));
  const filteredEdges = directEdges.filter(
    (edge) => nodeIds.has(edge.src_node_id) && nodeIds.has(edge.dst_node_id)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export default function PortfolioGraphCanvas() {
  const [framework, setFramework] = useState<FrameworkCode>('AML');
  const [graph, setGraph] = useState<SimulationTopology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<CytoscapeCore | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/simulation/topology?framework=${framework}`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('No se pudo cargar el grafo');
        const payload = (await response.json()) as SimulationTopology;
        if (!alive) return;
        setGraph(payload);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Error cargando el grafo');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [framework]);

  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    return filterTop5Subgraph(graph);
  }, [graph]);

  useEffect(() => {
    if (!containerRef.current || !filteredGraph) return;

    let destroyed = false;

    const render = async () => {
      const cytoscapeImport = (await import('cytoscape')) as CytoscapeModule;
      const cytoscape = (cytoscapeImport.default ?? cytoscapeImport) as typeof import('cytoscape');

      if (!containerRef.current || destroyed) return;

      cyRef.current?.destroy();

      const elements = toElementDefinitions(filteredGraph.nodes, filteredGraph.edges);
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: buildStylesheet() as any,
        layout: {
          name: 'cose',
          fit: true,
          padding: 40,
          animate: false,
        },
        wheelSensitivity: 0.2,
      });

      cy.zoom(0.85);
      cyRef.current = cy;
    };

    render();

    return () => {
      destroyed = true;
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [filteredGraph]);

  return (
    <div className={`glass-card ${styles.graphCard}`}>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>Grafo Top 5 Elementos</h3>
          <span className={styles.subtitle}>Elementos críticos, riesgos y controles asociados</span>
        </div>
        <div className={styles.toggleGroup}>
          {FRAMEWORKS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.toggleButton} ${framework === item ? styles.toggleButtonActive : ''}`}
              onClick={() => setFramework(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <div className={styles.canvas} ref={containerRef} />
        {loading && <div className={styles.overlay}>Cargando grafo...</div>}
        {!loading && error && <div className={styles.overlay}>{error}</div>}
        {!loading && !error && filteredGraph && filteredGraph.nodes.length === 0 && (
          <div className={styles.overlay}>Sin datos para este framework.</div>
        )}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: NODE_COLORS.ELEMENT }} />
          Elemento
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: NODE_COLORS.RISK }} />
          Riesgo
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: NODE_COLORS.CONTROL }} />
          Control
        </span>
      </div>
    </div>
  );
}
