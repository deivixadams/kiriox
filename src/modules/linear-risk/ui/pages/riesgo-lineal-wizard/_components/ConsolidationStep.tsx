'use client';

import React from 'react';
import styles from './ConsolidationStep.module.css';

type Props = {
  summary: {
    activities: number;
    evaluatedRisks: number;
    controls: number;
    findings: number;
    actions: number;
  };
  onBack: () => void;
  onSave: () => void;
  onFinalize: () => void;
  finalizing: boolean;
};

export default function ConsolidationStep({ summary, onBack, onSave, onFinalize, finalizing }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Consolidación y cierre</h2>
        <p className={styles.subtitle}>Revisa el resumen final y genera el cierre formal de la evaluación lineal.</p>
      </div>

      <div className={styles.grid}>
        <SummaryCard label="Actividades" value={summary.activities} />
        <SummaryCard label="Riesgos evaluados" value={summary.evaluatedRisks} />
        <SummaryCard label="Controles" value={summary.controls} />
        <SummaryCard label="Hallazgos" value={summary.findings} />
        <SummaryCard label="Acciones" value={summary.actions} />
      </div>

      <div className={styles.note}>
        Al finalizar, el draft será materializado en tablas <code>risk_assessment_final*</code> y se registrará <code>risk_assessment_report</code>.
      </div>

      <div className={styles.footer}>
        <button className={styles.backButton} onClick={onBack}>Volver</button>
        <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
        <button className={styles.primaryButton} onClick={onFinalize} disabled={finalizing}>
          {finalizing ? 'Finalizando...' : 'Finalizar evaluación'}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  );
}
