'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useMonteCarloStore } from '@/store/montecarloStore';
import styles from './MonteCarloGraphView.module.css';

const NODE_COLORS: Record<string, string> = {
  ELEMENT: '#38bdf8', // Light Blue
  RISK: '#fb7185',    // Pinkish Red
  CONTROL: '#34d399',  // Green
};

export default function MonteCarloGraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const zoomTimerRef = useRef<NodeJS.Timeout | null>(null);
  const layerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { subgraph, summary, setSelectedNode, isRunning, iterations, progressIteration, progressTotal, activeControlIds } = useMonteCarloStore();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoom, setShowZoom] = useState(false);
  const [layerLabel, setLayerLabel] = useState<'ELEMENT' | 'RISK' | 'CONTROL'>('ELEMENT');

  const elements = useMemo(() => {
    if (!subgraph) return [];
    
    const nodes = subgraph.nodes.map(n => ({
      data: { 
        id: n.id, 
        label: n.code, 
        name: n.name,
        type: n.type,
        vizColor: NODE_COLORS[n.type] || '#94a3b8',
        vizSize: 30 + (n.failure_impact_score / 2),
        isHardGate: n.is_hard_gate
      }
    }));

    const edges = subgraph.edges.map(e => ({
      data: {
        id: e.id,
        source: e.src,
        target: e.dst,
        type: e.type,
        vizWidth: e.mitigation_strength ? (e.mitigation_strength * 5) : 2
      }
    }));

    return [...nodes, ...edges];
  }, [subgraph]);

  useEffect(() => {
    let mounted = true;

    async function initCy() {
      if (!containerRef.current || elements.length === 0) return;
      
      const cytoscape = (await import('cytoscape')).default;
      if (!mounted || !containerRef.current) return;

      if (cyRef.current) {
        cyRef.current.destroy();
      }

      const cy = (cytoscape as any)({
        container: containerRef.current,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(vizColor)',
              'label': 'data(label)',
              'color': '#fff',
              'font-size': '8px',
              'text-valign': 'bottom',
              'text-margin-y': '4px',
              'width': 'data(vizSize)',
              'height': 'data(vizSize)',
              'border-width': ((ele: any) => ele.data('isHardGate') ? 3 : 0) as any,
              'border-color': '#facc15',
              'transition-property': 'background-color, border-color, border-width, width, height, opacity',
              'transition-duration': '250ms'
            } as any
          },
          {
            selector: 'edge',
            style: {
              'width': 'data(vizWidth)',
              'line-color': 'rgba(255,255,255,0.15)',
              'target-arrow-color': 'rgba(255,255,255,0.15)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'opacity': 0.6,
              'transition-property': 'line-color, target-arrow-color, width, opacity',
              'transition-duration': '250ms'
            } as any
          },
          {
            selector: '.mc-pulse',
            style: {
              'border-width': 4,
              'border-color': '#38bdf8',
              'overlay-color': '#38bdf8',
              'overlay-opacity': 0.15
            } as any
          },
          {
            selector: '.mc-flow',
            style: {
              'line-color': 'rgba(56,189,248,0.65)',
              'target-arrow-color': 'rgba(56,189,248,0.65)',
              'width': 3,
              'opacity': 0.9
            } as any
          },
          {
            selector: '.mc-layer',
            style: {
              'overlay-color': '#22d3ee',
              'overlay-opacity': 0.18
            } as any
          },
          {
            selector: '.mc-active',
            style: {
              'overlay-color': '#f97316',
              'overlay-opacity': 0.35,
              'border-width': 4,
              'border-color': '#fb923c'
            } as any
          },
          {
            selector: '.mc-heat',
            style: {
              'overlay-color': '#fb923c',
              'overlay-opacity': 'mapData(heat, 0, 1, 0, 0.55)'
            } as any
          },
          {
            selector: '.mc-variance',
            style: {
              'border-width': 'mapData(variance, 0, 100, 0, 4)',
              'border-color': '#a855f7'
            } as any
          },
          {
            selector: ':selected',
            style: {
              'border-width': 2,
              'border-color': '#fff'
            } as any
          }
        ] as any,
        layout: {
          name: 'cose',
          padding: 50,
          randomize: true,
          animate: false
        }
      });

      cy.zoom(0.85);
      cy.center();
      setZoomLevel(0.85);

      cy.on('tap', 'node', (evt: any) => {
        const nodeData = evt.target.data();
        const fullNode = subgraph?.nodes.find(n => n.id === nodeData.id);
        if (fullNode) setSelectedNode(fullNode);
      });

      cy.on('zoom', () => {
        const z = cy.zoom();
        setZoomLevel(z);
        setShowZoom(true);

        if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
        zoomTimerRef.current = setTimeout(() => {
          setShowZoom(false);
        }, 900);
      });

      cyRef.current = cy;
    }

    initCy();
    return () => {
      mounted = false;
      if (zoomTimerRef.current) {
        clearTimeout(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
    };
  }, [elements, subgraph, setSelectedNode]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !summary) return;

    const exposureMap = new Map<string, number>();
    summary.top_exposed_elements.forEach((e) => exposureMap.set(e.node_id, e.exposure_frequency));

    const varianceMap = new Map<string, number>();
    summary.top_variance_controls.forEach((v) => varianceMap.set(v.node_id, v.variance_contribution));

    cy.nodes().forEach((node: any) => {
      const id = node.id();
      const heat = exposureMap.get(id) || 0;
      const variance = varianceMap.get(id) || 0;
      node.data('heat', heat);
      node.data('variance', variance);

      if (heat > 0) node.addClass('mc-heat'); else node.removeClass('mc-heat');
      if (variance > 0) node.addClass('mc-variance'); else node.removeClass('mc-variance');
    });
  }, [summary]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('mc-active');
    if (!isRunning || activeControlIds.length === 0) return;

    activeControlIds.forEach((id) => {
      const node = cy.getElementById(id);
      if (node && node.isNode()) {
        node.addClass('mc-active');
      }
    });
  }, [activeControlIds, isRunning]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!isRunning) {
      cy.nodes().removeClass('mc-pulse');
      cy.nodes().removeClass('mc-layer');
      if (layerTimerRef.current) clearInterval(layerTimerRef.current);
      return;
    }

    let alive = true;
    const nodes = cy.nodes();

    const intensity =
      iterations >= 30000 ? 0.22 :
      iterations >= 20000 ? 0.18 :
      iterations >= 10000 ? 0.14 :
      iterations >= 5000 ? 0.12 :
      0.08;

    const tick = () => {
      if (!alive) return;
      nodes.removeClass('mc-pulse');
      // keep edges static for clarity

      if (nodes.length > 0) {
        const count = Math.max(5, Math.floor(nodes.length * intensity));
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * nodes.length);
          nodes.eq(idx).addClass('mc-pulse');
        }
      }

    };

    tick();
    const intervalId = setInterval(tick, 320);

    const layerSequence: Array<'ELEMENT' | 'RISK' | 'CONTROL'> = ['ELEMENT', 'RISK', 'CONTROL'];
    let layerIndex = 0;
    if (layerTimerRef.current) clearInterval(layerTimerRef.current);
    layerTimerRef.current = setInterval(() => {
      const layer = layerSequence[layerIndex % layerSequence.length];
      layerIndex += 1;
      setLayerLabel(layer);

      cy.nodes().removeClass('mc-layer');
      const layerNodes = cy.nodes().filter((n: any) => n.data('type') === layer);
      layerNodes.addClass('mc-layer');
    }, 520);

    return () => {
      alive = false;
      clearInterval(intervalId);
      if (layerTimerRef.current) clearInterval(layerTimerRef.current);
      nodes.removeClass('mc-pulse');
      nodes.removeClass('mc-layer');
    };
  }, [isRunning, subgraph, iterations, summary]);

  return (
    <div className={`glass-card ${styles.graphContainer}`}>
      <div ref={containerRef} className={styles.graphCanvas} />
      {showZoom && (
        <div className={styles.zoomBadge}>
          Zoom: {(zoomLevel * 100).toFixed(0)}%
        </div>
      )}
      {isRunning && (
        <div className={styles.iterationOverlay}>
          <div className={styles.iterationBadge}>
            Iteraciones: {Math.min(progressIteration, progressTotal || iterations).toLocaleString('es-BO')} / {(progressTotal || iterations).toLocaleString('es-BO')}
          </div>
          <div className={styles.layerBadge}>
            Capa activa: {layerLabel}
          </div>
          <div className={styles.iterationBar}>
            <div className={styles.iterationFill} style={{ width: `${progressTotal ? Math.min(100, (progressIteration / progressTotal) * 100) : 0}%` }} />
          </div>
        </div>
      )}
      {isRunning && (
        <div className={styles.runningOverlay}>
          <div className={styles.runningBadge}>
            <span className={styles.runningDot} />
            Ejecutando Monte Carlo...
          </div>
          <div className={styles.runningBar} />
        </div>
      )}
      {!subgraph && (
        <div className={styles.emptyState}>
          Cargue un grafo para visualizar el subgrafo real
        </div>
      )}
    </div>
  );
}
