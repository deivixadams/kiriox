'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import styles from './ExtensionsStep.module.css';

type ExtensionItem = { title: string; notes: string };

type ExtensionsStepProps = {
  extensions: ExtensionItem[];
  onChange: (next: ExtensionItem[]) => void;
  onBack: () => void;
  onFinish: () => void;
  onSave: () => void;
};

export default function ExtensionsStep({ extensions, onChange, onBack, onFinish, onSave }: ExtensionsStepProps) {
  const addExtension = () => {
    onChange([...extensions, { title: '', notes: '' }]);
  };

  const updateExtension = (index: number, field: keyof ExtensionItem, value: string) => {
    const next = [...extensions];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const removeExtension = (index: number) => {
    onChange(extensions.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Extensiones manuales</h2>
        <p className={styles.subtitle}>Agrega aspectos manuales sin contaminar el corpus.</p>
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
          <button className={styles.primaryButton} onClick={onFinish}>Crear Auditoria</button>
        </div>
      </div>
    </div>
  );
}
