'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import styles from './StructuralGraphCanvas.module.css';
import GraphLegend from './GraphLegend';
import GraphNodeTooltip from './GraphNodeTooltip';
import { SimulationConfig, SimulationResults } from './StructuralSimulationPage';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface StructuralGraphCanvasProps {
  status: 'IDLE' | 'LOADING' | 'EXECUTED' | 'ERROR';
  results: SimulationResults | null;
  config: SimulationConfig;
}

export default function StructuralGraphCanvas({ status, results, config }: StructuralGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);

  const initCy = useCallback(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#cbd5e1',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#475569',
            'border-width': 2,
            'border-color': '#1e293b',
            'transition-property': 'background-color, border-color, width, height, opacity',
            'transition-duration': 300,
          }
        },
        {
          selector: 'node[type="ELEMENT"]',
          style: {
            'shape': 'round-rectangle',
            'width': 40,
            'height': 24,
            'background-color': '#334155',
            'border-color': '#475569',
          }
        },
        {
          selector: 'node[type="RISK"]',
          style: {
            'shape': 'diamond',
            'width': 32,
            'height': 32,
            'background-color': '#451a03',
            'border-color': '#92400e',
          }
        },
        {
          selector: 'node[type="CONTROL"]',
          style: {
            'shape': 'ellipse',
            'width': 28,
            'height': 28,
            'background-color': '#064e3b',
            'border-color': '#059669',
          }
        },
        {
          selector: 'node[state="FAILED"]',
          style: {
            'background-color': '#991b1b',
            'border-color': '#f87171',
            'width': 34,
            'height': 34,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(148, 163, 184, 0.2)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'rgba(148, 163, 184, 0.2)',
            'arrow-scale': 0.8,
          }
        },
        {
          selector: 'edge[state="PROPAGATED"]',
          style: {
            'line-color': '#f87171',
            'target-arrow-color': '#f87171',
            'width': 2.5,
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.25,
      }
    });

    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      setHoverNode({
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
        position: e.renderedPosition,
      });
    });

    cy.on('mouseout', 'node', () => {
      setHoverNode(null);
    });

    cyRef.current = cy;
  }, []);

  useEffect(() => {
    initCy();
    return () => cyRef.current?.destroy();
  }, [initCy]);

  // Handle data updates
  useEffect(() => {
    if (!cyRef.current) return;

    // Build model
    const elements = [
      { data: { id: 'O1', label: 'Art. 155 Prevención', type: 'ELEMENT' } },
      { data: { id: 'O2', label: 'Reportes GAO', type: 'ELEMENT' } },
      { data: { id: 'R1', label: 'Riesgo Lavado', type: 'RISK' } },
      { data: { id: 'C1', label: 'Monitor Transacciones', type: 'CONTROL' } },
      { data: { id: 'C2', label: 'Identificación KYC', type: 'CONTROL' } },
      { data: { source: 'C1', target: 'R1' } },
      { data: { source: 'C2', target: 'R1' } },
      { data: { source: 'R1', target: 'O1' } },
      { data: { source: 'R1', target: 'O2' } },
    ];

    cyRef.current.elements().remove();
    cyRef.current.add(elements);
    cyRef.current.layout({ name: 'breadthfirst', directed: true }).run();

    if (status === 'EXECUTED' && results) {
      // Simulate failure propagation visually
      cyRef.current.nodes('#C1').data('state', 'FAILED');
      cyRef.current.edges('[source="C1"]').data('state', 'PROPAGATED');
    }
  }, [status, results]);

  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.canvas} ref={containerRef} />
      
      {hoverNode && (
        <GraphNodeTooltip node={hoverNode} />
      )}

      <div className={styles.controls}>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}><ZoomIn size={16} /></button>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}><ZoomOut size={16} /></button>
        <button onClick={() => cyRef.current?.fit()}><Maximize2 size={16} /></button>
        <button onClick={() => cyRef.current?.layout({ name: 'breadthfirst', directed: true }).run()}><RefreshCw size={16} /></button>
      </div>

      <GraphLegend />
    </div>
  );
}
