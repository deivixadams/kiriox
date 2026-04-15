"use client";

import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Calendar, User, FileText, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { TreatmentForm } from './TreatmentForm';
import styles from './RiskDetailDrawer.module.css';

type Treatment = {
  id: string;
  title: string;
  treatment_type: string;
  status: string;
  description: string;
  planned_start_date: string;
  planned_end_date: string;
  residual_risk_expected: number;
};

interface RiskDetailDrawerProps {
  risk: { id: string; name: string; code: string; } | null;
  onClose: () => void;
}

export function RiskDetailDrawer({ risk, onClose }: RiskDetailDrawerProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (risk) {
      loadTreatments();
    }
  }, [risk]);

  async function loadTreatments() {
    if (!risk) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/risk-treatment/treatment?riskId=${risk.id}`);
      if (res.ok) {
        const data = await res.json();
        setTreatments(data.items || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (!risk) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.riskInfo}>
            <span className={styles.code}>{risk.code}</span>
            <h2>{risk.name}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
        </header>

        <div className={styles.content}>
          <div className={styles.actionsBar}>
            <h3>Planes de Tratamiento</h3>
            <button className={styles.newBtn} onClick={() => setShowForm(true)}>
              <Plus size={18} />
              Nuevo Plan
            </button>
          </div>

          {showForm && (
            <TreatmentForm 
              riskId={risk.id} 
              onSuccess={() => {
                setShowForm(false);
                loadTreatments();
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {loading ? (
            <div className={styles.loading}>Cargando planes...</div>
          ) : treatments.length === 0 ? (
            <div className={styles.empty}>
              <ShieldAlert size={48} />
              <p>No existen planes de tratamiento definidos para este riesgo.</p>
            </div>
          ) : (
            <div className={styles.treatmentList}>
              {treatments.map(t => (
                <div key={t.id} className={styles.treatmentCard}>
                  <div className={styles.tHeader}>
                    <h4>{t.title}</h4>
                    <span className={`${styles.statusBadge} ${styles[t.status.toLowerCase()]}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className={styles.tDesc}>{t.description}</p>
                  <div className={styles.tMeta}>
                    <div className={styles.metaItem}>
                      <Calendar size={14} />
                      <span>{new Date(t.planned_start_date).toLocaleDateString()} - {new Date(t.planned_end_date).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Clock size={14} />
                      <span>Riesgo Residual Esperado: {t.residual_risk_expected}%</span>
                    </div>
                  </div>
                  <div className={styles.tActions}>
                    <button className={styles.detailBtn}>Gestionar Acciones</button>
                    <button className={styles.deleteBtn}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
