'use client';

import React from 'react';
import styles from './GraphLegend.module.css';

export default function GraphLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.group}>
        <span className={styles.groupTitle}>Nodos</span>
        <div className={styles.item}>
          <div className={`${styles.box} ${styles.element}`} />
          <span>Elemento (Articulador)</span>
        </div>
        <div className={styles.item}>
          <div className={`${styles.box} ${styles.risk}`} />
          <span>Riesgo (Impacto)</span>
        </div>
        <div className={styles.item}>
          <div className={`${styles.box} ${styles.control}`} />
          <span>Control (Mitigador)</span>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupTitle}>Estados</span>
        <div className={styles.item}>
          <div className={`${styles.box} ${styles.failed}`} />
          <span>Falla Crítica</span>
        </div>
        <div className={styles.item}>
          <div className={`${styles.line} ${styles.propagated}`} />
          <span>Propagación Causal</span>
        </div>
      </div>
    </div>
  );
}
