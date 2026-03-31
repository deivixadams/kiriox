'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import styles from './TeamStep.module.css';

type TeamMember = { name: string; role: string; userId?: string; sourceType?: 'leader' | 'auditor' | 'manual' };
type UserOption = { id: string; label: string; email?: string };

type TeamStepProps = {
  team: TeamMember[];
  teamUsers: UserOption[];
  onChange: (next: TeamMember[]) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const ROLE_OPTIONS = [
  'Lider de Proyecto',
  'Auditor',
  'Supervisor',
  'AML Senior',
  'AML Junior',
  'Otro'
];

export default function TeamStep({ team, teamUsers, onChange, onBack, onNext, onSave }: TeamStepProps) {
  const selectedIds = new Set(team.map((member) => member.userId).filter(Boolean) as string[]);

  const addMember = () => {
    onChange([...team, { name: '', role: 'Auditor', userId: '', sourceType: 'manual' }]);
  };

  const updateMember = (index: number, patch: Partial<TeamMember>) => {
    const next = [...team];
    next[index] = { ...next[index], ...patch };
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
              <label className={styles.label}>Usuario</label>
              <select
                value={member.userId || ''}
                onChange={(e) => {
                  const userId = e.target.value;
                  const selected = teamUsers.find((user) => user.id === userId);
                  updateMember(idx, { userId, name: selected?.label || '' });
                }}
                className={styles.input}
                disabled={teamUsers.length === 0}
              >
                <option value="">
                  {teamUsers.length === 0 ? 'Seleccione empresa primero' : 'Seleccione usuario'}
                </option>
                {teamUsers
                  .filter((user) => !selectedIds.has(user.id) || user.id === member.userId)
                  .map((user) => (
                    <option key={user.id} value={user.id}>{user.label}</option>
                  ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Rol</label>
              <select
                value={member.role || ''}
                onChange={(e) => updateMember(idx, { role: e.target.value })}
                className={styles.input}
              >
                <option value="">Seleccione rol</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
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
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
