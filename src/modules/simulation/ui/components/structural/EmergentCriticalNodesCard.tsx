'use client';

import React from 'react';
import styles from './EmergentCriticalNodesCard.module.css';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface EmergentCriticalNodesCardProps {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    impactScore: number;
  }>;
}

export default function EmergentCriticalNodesCard({ nodes }: EmergentCriticalNodesCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <AlertTriangle size={16} className={styles.icon} />
        <span className={styles.eyebrow}>Nodos con Mayor Impacto</span>
      </div>

      <div className={styles.list}>
        {nodes.map((node, idx) => (
          <div key={idx} className={styles.item}>
            <div className={styles.info}>
              <div className={styles.upper}>
                <span className={styles.type}>{node.type}</span>
                <span className={styles.id}>{node.id}</span>
              </div>
              <span className={styles.label}>{node.label}</span>
            </div>
            <div className={styles.scoreArea}>
              <TrendingUp size={12} className={styles.trendIcon} />
              <strong className={styles.score}>{(node.impactScore * 100).toFixed(0)}%</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
