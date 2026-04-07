'use client';

import React from 'react';
import { useMonteCarloStore } from '@/store/montecarloStore';
import styles from './MonteCarloProfilePanel.module.css';

function formatNumber(value: number, digits: number = 4) {
  if (Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

export default function MonteCarloProfilePanel() {
  const { summary, runMetadata, isRunning } = useMonteCarloStore();

  const scaleMax = summary ? Math.max(1, summary.p99_fragility * 1.05, summary.p95_fragility * 1.15) : 1;
  const normalizedP95 = summary ? summary.p95_fragility / scaleMax : 0;
  const triggerPct = summary ? summary.trigger_probability * 100 : 0;
  const tailIndex = summary ? summary.p99_fragility - summary.mean_fragility : 0;
  const hardGateRate = summary ? summary.hard_gate_activation_freq * 100 : 0;

  let regime = 'SIN EJECUCION';
  let regimeClass = styles.regimeIdle;

  if (summary) {
    regime = 'ESTABLE';
    regimeClass = styles.regimeStable;

    if (normalizedP95 >= 0.75 || triggerPct >= 25) {
      regime = 'CRITICO';
      regimeClass = styles.regimeCritical;
    } else if (normalizedP95 >= 0.5 || triggerPct >= 10) {
      regime = 'FRAGIL';
      regimeClass = styles.regimeFragile;
    }
  }

  const markers = summary ? [
    { label: 'MEDIA', value: summary.mean_fragility },
    { label: 'P50', value: summary.p50_fragility },
    { label: 'P90', value: summary.p90_fragility },
    { label: 'P95', value: summary.p95_fragility },
    { label: 'P99', value: summary.p99_fragility }
  ] : [];

  const toPosition = (value: number) => {
    const pct = Math.min(100, Math.max(0, (value / scaleMax) * 100));
    return `${pct}%`;
  };

  const topVariance = summary?.top_variance_controls.slice(0, 3) ?? [];

  return (
    <section className={`glass-card ${styles.panel}`}>
      <div className={styles.header}>
        <div>
          <span className={styles.kicker}>Perfil de fragilidad</span>
          <h3 className={styles.title}>Envelope de stress estructural</h3>
        </div>
        <span className={`${styles.regime} ${regimeClass}`}>
          {isRunning ? 'ACTUALIZANDO' : regime}
        </span>
      </div>

      <div className={styles.scaleWrapper}>
        <div className={styles.scaleTrack}>
          {summary ? (
            <>
              {markers.map((marker) => (
                <div key={marker.label} className={styles.marker} style={{ left: toPosition(marker.value) }}>
                  <span>{marker.label}</span>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.scaleGhost} />
          )}
        </div>
        <div className={styles.scaleLabels}>
          <span>0</span>
          <span>{formatNumber(scaleMax, 2)}</span>
        </div>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Media</span>
          <span className={styles.statValue}>{summary ? formatNumber(summary.mean_fragility) : '--'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>P95</span>
          <span className={styles.statValue}>{summary ? formatNumber(summary.p95_fragility) : '--'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Cola (P99 - Media)</span>
          <span className={styles.statValue}>{summary ? formatNumber(tailIndex) : '--'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Prob. trigger</span>
          <span className={styles.statValue}>{summary ? `${triggerPct.toFixed(1)}%` : '--'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Hard gate freq.</span>
          <span className={styles.statValue}>{summary ? `${hardGateRate.toFixed(1)}%` : '--'}</span>
        </div>
      </div>

      <div className={styles.driverGrid}>
        <div className={styles.driverBlock}>
          <span className={styles.driverLabel}>Datos de ejecucion</span>
          {runMetadata ? (
            <div className={styles.metaGrid}>
              <span className={styles.metaBadge}>Iteraciones: {runMetadata.iterations}</span>
              <span className={styles.metaBadge}>Top: {runMetadata.seed_limit}</span>
              <span className={styles.metaBadge}>Nodos: {runMetadata.node_count}</span>
              <span className={styles.metaBadge}>Aristas: {runMetadata.edge_count}</span>
            </div>
          ) : (
            <div className={styles.driverEmpty}>Ejecuta la simulacion para generar el perfil probabilistico.</div>
          )}
        </div>

        <div className={styles.driverBlock}>
          <span className={styles.driverLabel}>Controles con mas varianza</span>
          {topVariance.length === 0 ? (
            <div className={styles.driverEmpty}>Sin datos aun</div>
          ) : (
            topVariance.map((item) => (
              <div key={item.node_id} className={styles.driverItem}>
                <span className={styles.driverName}>{item.node_name}</span>
                <span className={styles.driverValue}>{item.variance_contribution.toFixed(1)}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
