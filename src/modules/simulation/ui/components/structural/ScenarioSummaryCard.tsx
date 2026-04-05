'use client';

import React from 'react';
import styles from './ScenarioSummaryCard.module.css';
import { Target, ShieldAlert } from 'lucide-react';

export default function ScenarioSummaryCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Target size={16} className={styles.icon} />
        <span className={styles.eyebrow}>Escenario Actual</span>
      </div>
      <h3 className={styles.title}>Falla Crítica AML-2026</h3>
      <div className={styles.badges}>
        <div className={styles.badge}>
          <ShieldAlert size={12} />
          <span>Falla Dirigida</span>
        </div>
        <div className={styles.badge}>
          <span>Alcance: AML/CFT</span>
        </div>
      </div>
    </div>
  );
}
