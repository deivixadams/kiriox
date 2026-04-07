'use client';

import React from 'react';
import { useMonteCarloStore } from '@/store/montecarloStore';
import styles from './MonteCarloNodeInspector.module.css';
import { ShieldAlert, Activity } from 'lucide-react';

export default function MonteCarloNodeInspector() {
  const { selectedNode, summary } = useMonteCarloStore();

  if (!selectedNode) {
    return (
      <div className={`glass-card ${styles.emptyState}`}>
        <Activity className="mx-auto mb-2 opacity-20" size={32} />
        Seleccione un nodo en el visor de grafo para inspeccionar su comportamiento probabilístico.
      </div>
    );
  }

  // Find if there's any sensitivity info for this node in the summary
  const exposureInfo = summary?.top_exposed_elements.find(e => e.node_id === selectedNode.id);
  const varianceInfo = summary?.top_variance_controls.find(v => v.node_id === selectedNode.id);

  return (
    <div className={`glass-card ${styles.panel}`}>
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${styles.badgeGreen}`}>
            {selectedNode.type}
          </span>
          {selectedNode.is_hard_gate && (
            <span className={`${styles.badge} ${styles.badgeYellow}`}>
              <ShieldAlert size={10} /> HARD GATE
            </span>
          )}
        </div>
        <h2 className={styles.nodeTitle}>{selectedNode.name}</h2>
        <span className={styles.nodeCode}>{selectedNode.code}</span>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Atributos estaticos</span>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Impacto falla</span>
            <span className={styles.statValue}>{(selectedNode.failure_impact_score || 0).toFixed(2)}</span>
          </div>
          {selectedNode.type === 'CONTROL' && (
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Operacion (moda)</span>
              <span className={styles.statValue}>{(selectedNode.operating_score || 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {summary && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Analisis probabilistico</span>
          {exposureInfo && (
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Frecuencia exposicion high</span>
              <span className={styles.metricValue}>{(exposureInfo.exposure_frequency * 100).toFixed(2)}%</span>
            </div>
          )}
          {varianceInfo && (
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Contribucion variabilidad</span>
              <span className={styles.metricValue}>{(varianceInfo.variance_contribution).toFixed(2)}%</span>
            </div>
          )}
          {selectedNode.type === 'CONTROL' && (
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Estabilidad operativa</span>
              <span className={styles.metricValue}>92.4%</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.actionRow}>
        <button className={styles.actionButton}>
          Ver detalles historicos
        </button>
      </div>
    </div>
  );
}
