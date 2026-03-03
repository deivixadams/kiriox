'use client';

import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import styles from './ExtensionsStep.module.css';

type ExtensionItem = { title: string; notes: string; evidence?: string[] };

type ExtensionsStepProps = {
  extensions: ExtensionItem[];
  onChange: (next: ExtensionItem[]) => void;
  onBack: () => void;
  onFinish: () => void;
  onSave: () => void;
};

export default function ExtensionsStep({ extensions, onChange, onBack, onFinish, onSave }: ExtensionsStepProps) {
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});

  const addExtension = () => {
    onChange([...extensions, { title: '', notes: '', evidence: [] }]);
  };

  const updateExtension = (index: number, field: keyof ExtensionItem, value: string) => {
    const next = [...extensions];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const removeExtension = (index: number) => {
    onChange(extensions.filter((_, i) => i !== index));
  };

  const handleUploadEvidence = (index: number, file: File) => {
    const next = [...extensions];
    const current = next[index];
    const evidence = current.evidence ? [...current.evidence, file.name] : [file.name];
    next[index] = { ...current, evidence };
    onChange(next);
  };

  const handleAI = async (index: number) => {
    const item = extensions[index];
    if (!item) return;
    if (!item.notes.trim() && !item.title.trim()) {
      alert('Completa al menos el campo de aspecto manual antes de usar IA.');
      return;
    }
    setAiLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/ai/extension-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          text: item.notes
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.text) {
        updateExtension(index, 'notes', data.text);
      }
    } finally {
      setAiLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
      </div>

      <div className={styles.list}>
        {extensions.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <input
              value={item.title}
              onChange={(e) => updateExtension(idx, 'title', e.target.value)}
              className={styles.input}
              placeholder="Aspecto manual"
            />
            <textarea
              value={item.notes}
              onChange={(e) => updateExtension(idx, 'notes', e.target.value)}
              className={styles.textarea}
              placeholder="Notas"
            />
            <div className={styles.notesFooter}>
              <button
                type="button"
                className={styles.aiButton}
                onClick={() => handleAI(idx)}
                disabled={!!aiLoading[idx]}
              >
                {aiLoading[idx] ? (
                  '...'
                ) : (
                  <>
                    <Sparkles className={styles.aiIcon} /> IA
                  </>
                )}
              </button>
            </div>
            <div className={styles.uploadRow}>
              {[0, 1, 2].map((slot) => (
                <label key={slot} className={styles.uploadButton}>
                  <input
                    type="file"
                    className={styles.uploadInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      e.currentTarget.value = '';
                      handleUploadEvidence(idx, file);
                    }}
                  />
                  Subir evidencia {slot + 1}
                </label>
              ))}
            </div>
            <button className={styles.removeButton} onClick={() => removeExtension(idx)}>Eliminar</button>
          </div>
        ))}
      </div>

      <button className={styles.addButton} onClick={addExtension}>
        <Plus className={styles.addIcon} /> Agregar aspecto
      </button>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={onFinish}>Generar Informe</button>
        </div>
      </div>
    </div>
  );
}
