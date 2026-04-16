'use client';

import React from 'react';
import { Network, ShieldAlert, TrendingUp, Activity, X } from 'lucide-react';
import type { OverviewNode } from '@/modules/structural-risk/domain/types/Dashboard2Types';
import styles from './Dashboard2NodePanel.module.css';

type Props = {
  node: OverviewNode | null;
  onClose: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  DOMAIN:     'Dominio',
  OBLIGATION: 'Obligación',
  RISK:       'Riesgo',
  CONTROL:    'Control',
  TEST:       'Prueba',
  EVIDENCE:   'Evidencia',
  PROCESS:    'Proceso',
  FUNCTION:   'Función',
  TRIGGER:    'Gatillo',
  FINDING:    'Hallazgo',
  INDICATOR:  'Indicador',
};

const TYPE_COLORS: Record<string, string> = {
  DOMAIN:     '#38bdf8',
  OBLIGATION: '#f59e0b',
  RISK:       '#fb7185',
  CONTROL:    '#34d399',
  TEST:       '#a78bfa',
  EVIDENCE:   '#fbbf24',
  TRIGGER:    '#ff6b35',
};

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={styles.scoreBarTrack}>
      <div className={styles.scoreBarFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Dashboard2NodePanel({ node, onClose }: Props) {
  if (!node) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <Network size={28} className={styles.emptyIcon} />
          <p>Selecciona un nodo en el grafo para ver su análisis estructural.</p>
        </div>
      </div>
    );
  }

  const typeName  = TYPE_LABELS[node.node_type] || node.node_type;
  const typeColor = TYPE_COLORS[node.node_type]  || '#94a3b8';

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.typeBadge} style={{ background: `${typeColor}22`, color: typeColor }}>
            {typeName}
          </span>
          <div className={styles.nodeName}>{node.node_name || node.node_code || node.node_id}</div>
          {node.node_code && node.node_name && (
            <div className={styles.nodeCode}>{node.node_code}</div>
          )}
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {(node.is_hard_gate || node.is_dependency_root) && (
        <div className={styles.flagsRow}>
          {node.is_hard_gate && (
            <span className={styles.flagHardGate}>
              <ShieldAlert size={12} /> Hard Gate
            </span>
          )}
          {node.is_dependency_root && (
            <span className={styles.flagDepRoot}>
              <Network size={12} /> Dependency Root
            </span>
          )}
        </div>
      )}

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <TrendingUp size={12} /> Impacto de falla
          </div>
          <div className={styles.metricValue}>{node.failure_impact_score.toFixed(1)}</div>
          <ScoreBar value={node.failure_impact_score} max={100} color="#fb7185" />
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <Activity size={12} /> Grado total
          </div>
          <div className={styles.metricValue}>{node.total_degree.toFixed(1)}</div>
          <ScoreBar value={node.total_degree} max={50} color="#38bdf8" />
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <ShieldAlert size={12} /> Peso estructural
          </div>
          <div className={styles.metricValue}>{node.structural_weight.toFixed(1)}</div>
          <ScoreBar value={node.structural_weight} max={100} color="#34d399" />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Atributos</div>
        <div className={styles.attrRow}>
          <span>Tipo</span><strong>{node.node_type}</strong>
        </div>
        <div className={styles.attrRow}>
          <span>ID</span>
          <strong className={styles.idValue}>{node.node_id}</strong>
        </div>
      </div>
    </div>
  );
}
