'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from './GuideStep.module.css';

type GuideItem = {
  title: string;
  code?: string;
  riesgos: string[];
  controles: string[];
  pruebas: string[];
  prioridad?: string;
  notas?: string;
};

type GuideStepProps = {
  guide: GuideItem[];
  onChange: (next: GuideItem[]) => void;
  onGenerate: () => void;
  generating: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function GuideStep({ guide, onChange, onGenerate, generating, onBack, onNext, onSave }: GuideStepProps) {
  const updateItem = (index: number, field: keyof GuideItem, value: string) => {
    const next = [...guide];
    next[index] = { ...next[index], [field]: value } as GuideItem;
    onChange(next);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Guia automatica de evaluacion</h2>
        <p className={styles.subtitle}>Reordena y prioriza la guia generada.</p>
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
        Generar guia
      </button>

      {guide.length === 0 && (
        <div className={styles.empty}>Aun no hay guia generada.</div>
      )}

      <div className={styles.list}>
        {guide.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>{item.title}</div>
              <select
                value={item.prioridad || 'media'}
                onChange={(e) => updateItem(idx, 'prioridad', e.target.value)}
                className={styles.select}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className={styles.meta}>Riesgos: {item.riesgos.join(', ')}</div>
            <div className={styles.meta}>Controles: {item.controles.join(', ')}</div>
            <div className={styles.meta}>Pruebas: {item.pruebas.join(', ')}</div>
            <textarea
              value={item.notas || ''}
              onChange={(e) => updateItem(idx, 'notas', e.target.value)}
              className={styles.textarea}
              placeholder="Notas"
            />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button className={styles.backButton} onClick={onBack}>Volver</button>
        <div className={styles.footerActions}>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
