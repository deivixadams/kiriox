'use client';

import React, { useEffect } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import styles from './ObjectivesStep.module.css';

type ObjectivesStepProps = {
  windowStart: string;
  windowEnd: string;
  objectives: string;
  onChange: (next: { windowStart: string; windowEnd: string; objectives: string }) => void;
  onAI: () => void;
  aiLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function ObjectivesStep({ windowStart, windowEnd, objectives, onChange, onAI, aiLoading, onBack, onNext, onSave }: ObjectivesStepProps) {
  useEffect(() => {
    if (!windowStart) {
      const today = new Date().toISOString().slice(0, 10);
      onChange({ windowStart: today, windowEnd, objectives });
    }
  }, [windowStart, windowEnd, objectives, onChange]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ventana y objetivos</h2>
        <p className={styles.subtitle}>Define la ventana temporal y objetivos narrativos de la auditoria.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>
            <Calendar className={styles.labelIcon} /> Fecha inicio
          </label>
          <input
            type="date"
            value={windowStart}
            onChange={(e) => onChange({ windowStart: e.target.value, windowEnd, objectives })}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            <Calendar className={styles.labelIcon} /> Fecha fin
          </label>
          <input
            type="date"
            value={windowEnd}
            onChange={(e) => onChange({ windowStart, windowEnd: e.target.value, objectives })}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Objetivos narrativos</h3>
            <p className={styles.cardSubtitle}>La IA sugiere, el usuario decide.</p>
          </div>
          <button
            onClick={onAI}
            className={styles.aiButton}
          >
            {aiLoading ? (
              <div className={styles.spinner} />
            ) : (
              <Sparkles className={styles.aiIcon} />
            )}
            IA
          </button>
        </div>
        <textarea
          value={objectives}
          onChange={(e) => onChange({ windowStart, windowEnd, objectives: e.target.value })}
          className={styles.textarea}
          placeholder="Describe objetivos en lenguaje auditor..."
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
