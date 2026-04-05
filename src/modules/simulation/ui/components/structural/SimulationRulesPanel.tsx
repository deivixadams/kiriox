'use client';

import React from 'react';
import styles from './SimulationRulesPanel.module.css';

interface SimulationRulesPanelProps {
  value: {
    includeCascade: boolean;
    includeConcentration: boolean;
    includeTriggers: boolean;
    recalculateCentrality: boolean;
    stopThreshold: boolean;
  };
  onChange: (value: {
    includeCascade: boolean;
    includeConcentration: boolean;
    includeTriggers: boolean;
    recalculateCentrality: boolean;
    stopThreshold: boolean;
  }) => void;
}

export default function SimulationRulesPanel({ value, onChange }: SimulationRulesPanelProps) {
  const toggle = (key: keyof typeof value) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className={styles.container}>
      <div className={styles.rule} onClick={() => toggle('includeCascade')}>
        <div className={styles.info}>
          <span className={styles.label}>Propagación en Cascada</span>
          <span className={styles.desc}>Fallas de controles afectan riesgos conectados.</span>
        </div>
        <div className={`${styles.toggle} ${value.includeCascade ? styles.toggleOn : ''}`}>
          <div className={styles.handle} />
        </div>
      </div>

      <div className={styles.rule} onClick={() => toggle('includeConcentration')}>
        <div className={styles.info}>
          <span className={styles.label}>Penalizar Concentración</span>
          <span className={styles.desc}>Mayor impacto si fallan varios en un mismo nodo.</span>
        </div>
        <div className={`${styles.toggle} ${value.includeConcentration ? styles.toggleOn : ''}`}>
          <div className={styles.handle} />
        </div>
      </div>

      <div className={styles.rule} onClick={() => toggle('includeTriggers')}>
        <div className={styles.info}>
          <span className={styles.label}>Gatillos Estructurales</span>
          <span className={styles.desc}>Activar fallas automáticas por umbral.</span>
        </div>
        <div className={`${styles.toggle} ${value.includeTriggers ? styles.toggleOn : ''}`}>
          <div className={styles.handle} />
        </div>
      </div>
    </div>
  );
}
