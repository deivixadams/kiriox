'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from './QuestionnaireStep.module.css';

type QuestionnaireItem = { area: string; entrevistar: string[] };

type QuestionnaireStepProps = {
  questionnaire: QuestionnaireItem[];
  domains: { id: string; name: string }[];
  onChange: (next: QuestionnaireItem[]) => void;
  onGenerate: () => void;
  generating: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function QuestionnaireStep({ questionnaire, onChange, onGenerate, generating, onBack, onNext, onSave }: QuestionnaireStepProps) {
  const updateArea = (index: number, value: string) => {
    const next = [...questionnaire];
    next[index] = { ...next[index], area: value };
    onChange(next);
  };

  const updateInterview = (index: number, value: string) => {
    const next = [...questionnaire];
    next[index] = { ...next[index], entrevistar: value.split(',').map((s) => s.trim()).filter(Boolean) };
    onChange(next);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cuestionarios</h2>
        <p className={styles.subtitle}>Genera cuestionarios por area basados en el contexto.</p>
      </div>

      <button
        onClick={onGenerate}
        className={styles.generateButton}
      >
        {generating ? (
          <div className={styles.spinner} />
        ) : (
          <Sparkles className={styles.generateIcon} />
        )}
        Generar con IA
      </button>

      {questionnaire.length === 0 && (
        <div className={styles.empty}>Aun no se han generado cuestionarios.</div>
      )}

      <div className={styles.list}>
        {questionnaire.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <label className={styles.label}>Area</label>
            <input
              value={item.area}
              onChange={(e) => updateArea(idx, e.target.value)}
              className={styles.input}
            />
            <label className={styles.label}>Entrevistar (separado por coma)</label>
            <input
              value={item.entrevistar.join(', ')}
              onChange={(e) => updateInterview(idx, e.target.value)}
              className={styles.input}
            />
          </div>
        ))}
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
