'use client';

import React from 'react';
import styles from './GraphNodeTooltip.module.css';

interface GraphNodeTooltipProps {
  node: {
    id: string;
    label: string;
    type: string;
    position: { x: number; y: number };
  };
}

export default function GraphNodeTooltip({ node }: GraphNodeTooltipProps) {
  if (!node) return null;

  return (
    <div 
      className={styles.tooltip}
      style={{ 
        left: node.position.x + 10, 
        top: node.position.y + 10 
      }}
    >
      <div className={styles.header}>
        <span className={styles.type}>{node.type}</span>
        <span className={styles.id}>{node.id}</span>
      </div>
      <h4 className={styles.label}>{node.label}</h4>
      
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Centralidad</span>
          <strong>0.84</strong>
        </div>
        <div className={styles.stat}>
          <span>Conexiones</span>
          <strong>12</strong>
        </div>
      </div>

      <div className={styles.footer}>
        Presione para ver trazabilidad completa
      </div>
    </div>
  );
}
