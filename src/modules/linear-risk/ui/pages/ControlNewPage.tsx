'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import styles from './SignificantActivityNewPage.module.css';

type ControlRow = {
  control_id: string;
  risk_id: string;
  code: string;
  name: string;
  description: string;
  control_type_id: number;
  automation_id: number;
  frequency_id: number;
  owner_role: string | null;
  control_objective: string | null;
  control_scope: string | null;
  evidence_required: boolean;
  is_hard_gate: boolean;
  required_test: boolean;
  status: string;
  mitigation_strength: number;
  effect_type: string;
  rationale: string | null;
  coverage_notes: string | null;
};

type CatalogOption = { id: number | string; name: string };

export default function ControlNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const riskId = searchParams.get('risk_id') || '';
  const riskName = searchParams.get('risk_name') || '';
  const returnTo = searchParams.get('return_to') || '/validacion/riesgo-lineal/riesgo/nuevo';

  const [controlRows, setControlRows] = useState<ControlRow[]>([]);
  const [cursor, setCursor] = useState<number>(-1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<{
    control_type: CatalogOption[];
    automation: CatalogOption[];
    frequency: CatalogOption[];
    effect_type: CatalogOption[];
  }>({
    control_type: [],
    automation: [],
    frequency: [],
    effect_type: [],
  });

  const [form, setForm] = useState({
    control_id: '',
    name: '',
    description: '',
    control_type_id: 1,
    automation_id: 1,
    frequency_id: 3,
    owner_role: '',
    control_objective: '',
    control_scope: '',
    evidence_required: true,
    is_hard_gate: false,
    required_test: true,
    mitigation_strength: 3,
    effect_type: 'prevent',
    rationale: '',
    coverage_notes: '',
  });

  React.useEffect(() => {
    if (!riskId) {
      setError('Esta pantalla requiere un riesgo seleccionado.');
    }
  }, [riskId]);

  React.useEffect(() => {
    fetch('/api/linear-risk/catalog/control-classifications')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setClassifications(data);
      })
      .catch(() => {});
  }, []);

  const canNavigate = useMemo(() => controlRows.length > 0, [controlRows.length]);

  const applyRow = React.useCallback((row: ControlRow, idx: number) => {
    setCursor(idx);
    setForm({
      control_id: row.control_id,
      name: row.name,
      description: row.description,
      control_type_id: row.control_type_id,
      automation_id: row.automation_id,
      frequency_id: row.frequency_id,
      owner_role: row.owner_role || '',
      control_objective: row.control_objective || '',
      control_scope: row.control_scope || '',
      evidence_required: row.evidence_required,
      is_hard_gate: row.is_hard_gate,
      required_test: row.required_test,
      mitigation_strength: row.mitigation_strength,
      effect_type: row.effect_type,
      rationale: row.rationale || '',
      coverage_notes: row.coverage_notes || '',
    });
  }, []);

  const loadRows = React.useCallback(async (preferredId?: string) => {
    if (!riskId) {
      setControlRows([]);
      setCursor(-1);
      return;
    }
    const res = await fetch(`/api/linear-risk/catalog/control-catalog?risk_id=${encodeURIComponent(riskId)}`, {
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    const rows = Array.isArray(data?.items) ? data.items : [];
    setControlRows(rows);
    if (rows.length === 0) {
      setCursor(-1);
      return;
    }
    const targetId = preferredId || form.control_id;
    const idx = targetId ? rows.findIndex((row: ControlRow) => row.control_id === targetId) : -1;
    const finalIdx = idx >= 0 ? idx : 0;
    applyRow(rows[finalIdx], finalIdx);
  }, [riskId, applyRow, form.control_id]);

  React.useEffect(() => {
    if (!riskId) return;
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskId]);

  const clearForNew = () => {
    setCursor(-1);
    setError(null);
    setSuccess(null);
    setForm({
      control_id: '',
      name: '',
      description: '',
      control_type_id: 1,
      automation_id: 1,
      frequency_id: 3,
      owner_role: '',
      control_objective: '',
      control_scope: '',
      evidence_required: true,
      is_hard_gate: false,
      required_test: true,
      mitigation_strength: 3,
      effect_type: 'prevent',
      rationale: '',
      coverage_notes: '',
    });
  };

  const navigate = (target: 'first' | 'prev' | 'next' | 'last') => {
    if (!canNavigate) return;
    const current = cursor >= 0 ? cursor : 0;
    const nextIdx =
      target === 'first'
        ? 0
        : target === 'prev'
          ? Math.max(0, current - 1)
          : target === 'next'
            ? Math.min(controlRows.length - 1, current + 1)
            : controlRows.length - 1;
    applyRow(controlRows[nextIdx], nextIdx);
    setError(null);
    setSuccess(null);
  };

  const goBack = () => {
    router.push(returnTo);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!riskId) {
      setError('risk_id es obligatorio.');
      return;
    }
    if (!form.name.trim()) {
      setError('El nombre del control es obligatorio.');
      return;
    }
    if (!form.description.trim()) {
      setError('La descripción del control es obligatoria.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/auth/csrf');
      const res = await fetch('/api/linear-risk/catalog/control-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_id: riskId,
          name: form.name.trim(),
          description: form.description.trim(),
          control_type_id: form.control_type_id,
          automation_id: form.automation_id,
          frequency_id: form.frequency_id,
          owner_role: form.owner_role.trim() || null,
          control_objective: form.control_objective.trim() || null,
          control_scope: form.control_scope.trim() || null,
          evidence_required: form.evidence_required,
          is_hard_gate: form.is_hard_gate,
          required_test: form.required_test,
          mitigation_strength: form.mitigation_strength,
          effect_type: form.effect_type,
          rationale: form.rationale.trim() || null,
          coverage_notes: form.coverage_notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo guardar el control.');
        return;
      }

      setSuccess('Control creado correctamente.');
      await loadRows(String(data.control_id || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          <button type="button" className={styles.closeButton} onClick={goBack} aria-label="Cerrar">
            <X size={16} />
          </button>
          <div className={styles.header}>
            <h1 className={styles.title}>{form.control_id ? 'Editar control' : 'Nuevo control'}</h1>
            <p className={styles.subtitle}>
              Registra controles asociados al riesgo seleccionado.
            </p>
            {riskName && (
              <p className={styles.subtitle} style={{ marginTop: 4, fontWeight: 500, opacity: 0.85 }}>
                Riesgo: {riskName}
              </p>
            )}
            {controlRows.length > 0 && (
              <p className={styles.subtitle} style={{ marginTop: 4, fontWeight: 500, opacity: 0.85 }}>
                {cursor >= 0
                  ? `Registro ${cursor + 1} de ${controlRows.length}`
                  : `${controlRows.length} control(es) existente(s) — Modo nuevo`}
              </p>
            )}
          </div>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          {/* Row 1: Code + Risk */}
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Código del control</span>
              <input
                className={styles.input}
                value={controlRows[cursor]?.code || '(se genera al guardar)'}
                readOnly
                style={{ fontFamily: 'monospace', opacity: form.control_id ? 1 : 0.5 }}
              />
            </label>
            <label className={styles.field}>
              <span>Riesgo asociado</span>
              <input
                className={`${styles.input} ${styles.immutableActivity}`}
                value={riskName || riskId}
                readOnly
              />
            </label>
          </div>

          {/* Row 2: Name */}
          <label className={styles.field}>
            <span>Nombre del control</span>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del control"
            />
          </label>

          {/* Row 3: Description */}
          <label className={styles.field}>
            <span>Descripción del control</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción detallada del control"
            />
          </label>

          {/* Row 4: Type + Automation + Frequency */}
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Tipo de control</span>
              <select
                className={styles.input}
                value={form.control_type_id}
                onChange={(e) => setForm(prev => ({ ...prev, control_type_id: Number(e.target.value) }))}
              >
                {classifications.control_type.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Automatización</span>
              <select
                className={styles.input}
                value={form.automation_id}
                onChange={(e) => setForm(prev => ({ ...prev, automation_id: Number(e.target.value) }))}
              >
                {classifications.automation.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Frecuencia</span>
              <select
                className={styles.input}
                value={form.frequency_id}
                onChange={(e) => setForm(prev => ({ ...prev, frequency_id: Number(e.target.value) }))}
              >
                {classifications.frequency.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 5: Objective + Scope */}
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Objetivo del control</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.control_objective}
                onChange={(e) => setForm(prev => ({ ...prev, control_objective: e.target.value }))}
                placeholder="Objetivo que busca cumplir el control"
              />
            </label>
            <label className={styles.field}>
              <span>Alcance del control</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.control_scope}
                onChange={(e) => setForm(prev => ({ ...prev, control_scope: e.target.value }))}
                placeholder="Alcance de aplicación del control"
              />
            </label>
          </div>

          {/* Row 6: Owner + Effect + Mitigation Strength */}
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Rol responsable</span>
              <input
                className={styles.input}
                value={form.owner_role}
                onChange={(e) => setForm(prev => ({ ...prev, owner_role: e.target.value }))}
                placeholder="Ej: Gerente de Riesgos"
              />
            </label>
            <label className={styles.field}>
              <span>Tipo de efecto</span>
              <select
                className={styles.input}
                value={form.effect_type}
                onChange={(e) => setForm(prev => ({ ...prev, effect_type: e.target.value }))}
              >
                {classifications.effect_type.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Fuerza de mitigación (1-5)</span>
              <select
                className={styles.input}
                value={form.mitigation_strength}
                onChange={(e) => setForm(prev => ({ ...prev, mitigation_strength: Number(e.target.value) }))}
              >
                <option value={1}>1 - Muy bajo</option>
                <option value={2}>2 - Bajo</option>
                <option value={3}>3 - Medio</option>
                <option value={4}>4 - Alto</option>
                <option value={5}>5 - Muy alto</option>
              </select>
            </label>
          </div>

          {/* Row 7: Rationale + Coverage */}
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Racional</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.rationale}
                onChange={(e) => setForm(prev => ({ ...prev, rationale: e.target.value }))}
                placeholder="Justificación del control"
              />
            </label>
            <label className={styles.field}>
              <span>Notas de cobertura</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.coverage_notes}
                onChange={(e) => setForm(prev => ({ ...prev, coverage_notes: e.target.value }))}
                placeholder="Aspectos cubiertos por el control"
              />
            </label>
          </div>

          {/* Row 8: Checkboxes */}
          <div className={styles.grid}>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={form.evidence_required}
                onChange={(e) => setForm(prev => ({ ...prev, evidence_required: e.target.checked }))}
              />
              <span>Requiere evidencia</span>
            </label>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={form.is_hard_gate}
                onChange={(e) => setForm(prev => ({ ...prev, is_hard_gate: e.target.checked }))}
              />
              <span>Hard gate (no compensable)</span>
            </label>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={form.required_test}
                onChange={(e) => setForm(prev => ({ ...prev, required_test: e.target.checked }))}
              />
              <span>Requiere prueba</span>
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.actions}>
            <div className={styles.actionsLeft}>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('first')} disabled={saving || !canNavigate || cursor <= 0}>
                Primero
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('prev')} disabled={saving || !canNavigate || cursor <= 0}>
                Anterior
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('next')} disabled={saving || !canNavigate || cursor >= controlRows.length - 1 || cursor < 0}>
                Siguiente
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('last')} disabled={saving || !canNavigate || cursor >= controlRows.length - 1}>
                Final
              </button>
            </div>

            <div className={styles.actionsRight}>
              <button type="button" className={styles.secondaryButton} onClick={clearForNew} disabled={saving}>
                Nuevo
              </button>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar control'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
