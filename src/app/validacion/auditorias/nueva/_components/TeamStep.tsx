'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import styles from './TeamStep.module.css';

type TeamMember = { name: string; role: string; sourceId?: string; sourceType?: 'leader' | 'auditor' | 'manual' };

type TeamStepProps = {
  team: TeamMember[];
  onChange: (next: TeamMember[]) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function TeamStep({ team, onChange, onBack, onNext, onSave }: TeamStepProps) {
  const addMember = () => {
    onChange([...team, { name: '', role: '', sourceType: 'manual' }]);
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const next = [...team];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const removeMember = (index: number) => {
    const next = team.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Equipo</h2>
        <p className={styles.subtitle}>Define participantes y roles en la auditoria.</p>
      </div>

      <div className={styles.list}>
        {team.map((member, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre</label>
              <input
                value={member.name}
                onChange={(e) => updateMember(idx, 'name', e.target.value)}
                className={styles.input}
                placeholder="Nombre"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Rol</label>
              <input
                value={member.role}
                onChange={(e) => updateMember(idx, 'role', e.target.value)}
                className={styles.input}
                placeholder="Rol"
              />
            </div>
            <div className={styles.cardActions}>
              <button className={styles.removeButton} onClick={() => removeMember(idx)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <button className={styles.addButton} onClick={addMember}>
        <Plus className={styles.addIcon} /> Agregar participante
      </button>

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
