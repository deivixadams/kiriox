"use client";

import { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import styles from './TreatmentForm.module.css';

interface TreatmentFormProps {
  riskId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TreatmentForm({ riskId, onSuccess, onCancel }: TreatmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    treatment_type: 'mitigar',
    status: 'OPEN',
    description: '',
    justification: '',
    planned_start_date: new Date().toISOString().split('T')[0],
    planned_end_date: '',
    residual_risk_expected: 50,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/risk-treatment/treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, risk_id: riskId }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.details || data.error || 'Error al guardar el tratamiento');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setLoading(false);
  }

  return (
    <div className={styles.formContainer}>
      <header className={styles.header}>
        <h3>Nuevo Plan de Tratamiento</h3>
        <button onClick={onCancel} className={styles.closeBtn}><X size={20} /></button>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}><AlertTriangle size={16} />{error}</div>}

        <div className={styles.field}>
          <label>Título del Plan</label>
          <input 
            type="text" 
            required 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="Ej: Refuerzo de controles perimetrales"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Estrategia</label>
            <select value={formData.treatment_type} onChange={e => setFormData({...formData, treatment_type: e.target.value})}>
              <option value="mitigar">Mitigar</option>
              <option value="transferir">Transferir</option>
              <option value="evitar">Evitar</option>
              <option value="aceptar">Aceptar</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Riesgo Residual Esperado (%)</label>
            <input 
              type="number" 
              min="0" max="100" 
              value={formData.residual_risk_expected} 
              onChange={e => setFormData({...formData, residual_risk_expected: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Justificación</label>
          <textarea 
            rows={2}
            value={formData.justification} 
            onChange={e => setFormData({...formData, justification: e.target.value})}
            placeholder="¿Por qué se elige esta estrategia?"
          />
        </div>

        <div className={styles.field}>
          <label>Descripción detallada</label>
          <textarea 
            rows={3}
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Objetivos y alcance del tratamiento..."
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Fecha de Inicio</label>
            <input 
              type="date" 
              required
              value={formData.planned_start_date} 
              onChange={e => setFormData({...formData, planned_start_date: e.target.value})}
            />
          </div>
          <div className={styles.field}>
            <label>Fecha de Fin</label>
            <input 
              type="date" 
              required
              value={formData.planned_end_date} 
              onChange={e => setFormData({...formData, planned_end_date: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancelar</button>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Guardando...' : 'Crear Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
