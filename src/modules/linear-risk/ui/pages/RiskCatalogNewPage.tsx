'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import styles from './SignificantActivityNewPage.module.css';

type RiskRow = {
  id: string;
  significant_activity_id: string | null;
  risk_code: string;
  risk_name: string;
  risk_description: string;
  risk_category: string;
  is_active: boolean;
  risk_emerging_source_id?: string | null;
  risk_emerging_status_id?: string | null;
  risk_factor_id?: string | null;
  operational_risk_loss_event_type_id?: string | null;
};

type ActivityMeta = {
  id: string;
  company_id?: string;
  activity_code: string;
  activity_name: string;
  activity_description: string | null;
};

export default function RiskCatalogNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get('return_to') || '/validacion/riesgo-lineal/nueva';
  const draft = searchParams.get('draft') || '';
  const rowTempId = searchParams.get('row_temp_id') || '';
  const significantActivityId = searchParams.get('significant_activity_id') || '';
  const companyId = searchParams.get('company_id') || '';

  const [riskRows, setRiskRows] = useState<RiskRow[]>([]);
  const [cursor, setCursor] = useState<number>(-1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activityMeta, setActivityMeta] = useState<ActivityMeta | null>(null);
  const [activityOptions, setActivityOptions] = useState<ActivityMeta[]>([]);
  const [activityOptionsLoading, setActivityOptionsLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityComboOpen, setActivityComboOpen] = useState(false);
  const [allowAllActivities, setAllowAllActivities] = useState(!significantActivityId);
  const [aiLoading, setAiLoading] = useState(false);
  const [classifications, setClassifications] = useState<{
    risk_emerging_source: any[];
    risk_emerging_status: any[];
    risk_factor: any[];
    operational_risk_loss_event_type: any[];
  }>({
    risk_emerging_source: [],
    risk_emerging_status: [],
    risk_factor: [],
    operational_risk_loss_event_type: [],
  });

  const [form, setForm] = useState({
    id: '',
    significant_activity_id: significantActivityId,
    risk_code: '',
    risk_name: '',
    risk_description: '',
    risk_category: '',
    is_active: true,
    risk_emerging_source_id: null as string | null,
    risk_emerging_status_id: null as string | null,
    risk_factor_id: null as string | null,
    operational_risk_loss_event_type_id: null as string | null,
  });

  React.useEffect(() => {
    fetch('/api/linear-risk/catalog/risk-classifications')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setClassifications(data);
      })
      .catch();
  }, []);

  const canNavigate = useMemo(() => riskRows.length > 0, [riskRows.length]);
  const filteredActivityOptions = useMemo(() => {
    const scoped = allowAllActivities
      ? activityOptions
      : activityOptions.filter((opt) => opt.id === significantActivityId);
    const term = activitySearch.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter((opt) =>
      `${opt.activity_name} ${opt.activity_code} ${opt.activity_description || ''}`.toLowerCase().includes(term)
    );
  }, [activityOptions, allowAllActivities, significantActivityId, activitySearch]);

  const applyRow = React.useCallback((row: RiskRow, idx: number) => {
    setCursor(idx);
    setForm({
      id: row.id,
      significant_activity_id: row.significant_activity_id || '',
      risk_code: row.risk_code,
      risk_name: row.risk_name,
      risk_description: row.risk_description,
      risk_category: row.risk_category,
      is_active: row.is_active,
      risk_emerging_source_id: row.risk_emerging_source_id || null,
      risk_emerging_status_id: row.risk_emerging_status_id || null,
      risk_factor_id: row.risk_factor_id || null,
      operational_risk_loss_event_type_id: row.operational_risk_loss_event_type_id || null,
    });
  }, []);

  const loadRows = React.useCallback(async (activityId: string, preferredId?: string, keepBlankWhenNoPreferred = false) => {
    if (!activityId) {
      setRiskRows([]);
      setCursor(-1);
      return;
    }
    const res = await fetch(`/api/linear-risk/catalog/risk-catalog?significantActivityId=${encodeURIComponent(activityId)}`, {
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    const rows = Array.isArray(data?.items) ? data.items : [];
    setRiskRows(rows);
    if (rows.length === 0) {
      setCursor(-1);
      return;
    }
    if (keepBlankWhenNoPreferred && !preferredId) {
      setCursor(-1);
      return;
    }
    const targetId = preferredId || form.id;
    const idx = targetId ? rows.findIndex((row) => row.id === targetId) : -1;
    const finalIdx = idx >= 0 ? idx : 0;
    applyRow(rows[finalIdx], finalIdx);
  }, [applyRow, form.id]);

  const loadActivityMeta = React.useCallback(async (activityId: string) => {
    if (!activityId) {
      setActivityMeta(null);
      return;
    }
    const res = await fetch(`/api/linear-risk/catalog/significant-activities?id=${encodeURIComponent(activityId)}`, {
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    const row = Array.isArray(data?.items) ? data.items[0] : null;
    if (!row) {
      setActivityMeta(null);
      return;
    }
    setActivityMeta({
      id: String(row.id),
      company_id: row.company_id ? String(row.company_id) : undefined,
      activity_code: String(row.activity_code || ''),
      activity_name: String(row.activity_name || ''),
      activity_description: row.activity_description ? String(row.activity_description) : null,
    });
  }, []);

  const loadActivityOptions = React.useCallback(async () => {
    setActivityOptionsLoading(true);
    try {
      const query = companyId
        ? `/api/linear-risk/catalog/significant-activities?companyId=${encodeURIComponent(companyId)}`
        : '/api/linear-risk/catalog/significant-activities?fallbackAll=1';
      const res = await fetch(query, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      const rows = Array.isArray(data?.items) ? data.items : [];
      setActivityOptions(
        rows.map((row: any) => ({
          id: String(row.id),
          company_id: row.company_id ? String(row.company_id) : undefined,
          activity_code: String(row.activity_code || ''),
          activity_name: String(row.activity_name || ''),
          activity_description: row.activity_description ? String(row.activity_description) : null,
        }))
      );
    } finally {
      setActivityOptionsLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    if (!form.significant_activity_id) return;
    loadRows(form.significant_activity_id, form.id || undefined, !form.id);
    loadActivityMeta(form.significant_activity_id);
  }, [form.significant_activity_id, form.id, loadRows, loadActivityMeta]);

  React.useEffect(() => {
    loadActivityOptions();
  }, [loadActivityOptions]);

  const clearForNew = () => {
    setCursor(-1);
    setError(null);
    setSuccess(null);
    setAllowAllActivities(true);
    setForm((prev) => ({
      ...prev,
      id: '',
      risk_code: '',
      risk_name: '',
      risk_description: '',
      risk_category: '',
      is_active: true,
      risk_emerging_source_id: null,
      risk_emerging_status_id: null,
      risk_factor_id: null,
      operational_risk_loss_event_type_id: null,
    }));
  };

  const selectActivity = (activity: ActivityMeta) => {
    setForm((prev) => ({
      ...prev,
      id: '',
      significant_activity_id: activity.id,
      risk_code: '',
      risk_name: '',
      risk_description: '',
      risk_category: '',
      is_active: true,
      risk_emerging_source_id: null,
      risk_emerging_status_id: null,
      risk_factor_id: null,
      operational_risk_loss_event_type_id: null,
    }));
    setActivityMeta(activity);
    setActivitySearch('');
    setActivityComboOpen(false);
    setCursor(-1);
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
            ? Math.min(riskRows.length - 1, current + 1)
            : riskRows.length - 1;
    applyRow(riskRows[nextIdx], nextIdx);
    setError(null);
    setSuccess(null);
  };

  const goBack = () => {
    if (returnTo.startsWith('/modelo/gobernanza/actividades-claves')) {
      router.push(returnTo);
      return;
    }
    const params = new URLSearchParams();
    if (draft) params.set('draft', draft);
    params.set('step', '2');
    router.push(params.toString() ? `${returnTo}?${params.toString()}` : returnTo);
  };

  const closeScreen = () => {
    goBack();
  };

  const handleDelete = async () => {
    if (!form.id) {
      setError('No hay riesgo seleccionado para eliminar.');
      return;
    }
    if (!window.confirm('¿Eliminar este riesgo del catálogo?')) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await fetch('/api/auth/csrf');
      const res = await fetch(`/api/linear-risk/catalog/risk-catalog?id=${encodeURIComponent(form.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo eliminar el riesgo.');
        return;
      }
      setSuccess('Riesgo eliminado correctamente.');
      clearForNew();
      await loadRows(form.significant_activity_id);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.significant_activity_id) {
      setError('significant_activity_id es obligatorio.');
      return;
    }
    if (!form.risk_code.trim()) {
      setError('risk_code es obligatorio.');
      return;
    }
    if (!form.risk_name.trim()) {
      setError('risk_name es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/auth/csrf');
      const isEdit = Boolean(form.id);
      const res = await fetch('/api/linear-risk/catalog/risk-catalog', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id || undefined,
          significant_activity_id: form.significant_activity_id,
          risk_code: form.risk_code.trim(),
          risk_name: form.risk_name.trim(),
          risk_description: form.risk_description.trim() || null,
          risk_category: form.risk_category.trim() || null,
          is_active: form.is_active,
          risk_emerging_source_id: form.risk_emerging_source_id || null,
          risk_emerging_status_id: form.risk_emerging_status_id || null,
          risk_factor_id: form.risk_factor_id || null,
          operational_risk_loss_event_type_id: form.operational_risk_loss_event_type_id || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo guardar el riesgo.');
        return;
      }

      setSuccess(isEdit ? 'Riesgo actualizado correctamente.' : 'Riesgo creado correctamente.');
      await loadRows(form.significant_activity_id, String(data.id || ''));

      if (!isEdit) {
        if (returnTo.startsWith('/modelo/gobernanza/actividades-claves')) {
          router.push(returnTo);
          return;
        }
        const params = new URLSearchParams();
        if (draft) params.set('draft', draft);
        params.set('step', '2');
        params.set('from_new_risk', '1');
        params.set('selected_risk_id', String(data.id));
        if (rowTempId) params.set('row_temp_id', rowTempId);
        params.set('significant_activity_id', form.significant_activity_id);
        router.push(`${returnTo}?${params.toString()}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const refineRiskDescription = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: form.risk_description || '',
          field: 'risk_description',
          promptCode: 'LINEAR_RISK_DESCRIPTION',
        }),
      });
      const data = await res.json().catch(() => ({}));
      const refined = String(data?.refinedText || '').trim();
      if (refined) {
        setForm((prev) => ({ ...prev, risk_description: refined }));
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          <button type="button" className={styles.closeButton} onClick={closeScreen} aria-label="Cerrar">
            <X size={16} />
          </button>
          <div className={styles.header}>
            <h1 className={styles.title}>Nuevo riesgo</h1>
            <p className={styles.subtitle}>Registra riesgos del catálogo para la actividad significativa seleccionada.</p>
          </div>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Actividad significativa</span>
              <div
                className={styles.comboBox}
                onFocus={() => setActivityComboOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setActivityComboOpen(false);
                    setActivitySearch('');
                  }, 120);
                }}
              >
                <input
                  className={styles.comboInput}
                  value={activitySearch || activityMeta?.activity_name || ''}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityComboOpen(true);
                  }}
                  onClick={() => setActivityComboOpen(true)}
                  placeholder={
                    activityOptionsLoading
                      ? 'Cargando actividades...'
                      : allowAllActivities
                        ? 'Seleccione actividad...'
                        : 'Actividad del contexto actual'
                  }
                />
                {activityComboOpen && (
                  <div className={styles.comboList}>
                    {filteredActivityOptions.length === 0 ? (
                      <div className={styles.comboEmpty}>Sin actividades disponibles.</div>
                    ) : (
                      filteredActivityOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={styles.comboOption}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            selectActivity(opt);
                          }}
                        >
                          {opt.activity_name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>
            <label className={styles.field}>
              <span>Código de actividad</span>
              <input
                className={styles.input}
                value={activityMeta?.activity_code || ''}
                readOnly
                placeholder="Código de la actividad"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Descripción de la actividad</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={activityMeta?.activity_description || ''}
              readOnly
              placeholder="Descripción de la actividad seleccionada"
            />
          </label>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Código de riesgo</span>
              <input
                className={styles.input}
                value={form.risk_code}
                onChange={(e) => setForm((prev) => ({ ...prev, risk_code: e.target.value }))}
                placeholder="Código del riesgo"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Nombre del riesgo</span>
            <input
              className={styles.input}
              value={form.risk_name}
              onChange={(e) => setForm((prev) => ({ ...prev, risk_name: e.target.value }))}
              placeholder="Nombre del riesgo"
            />
          </label>

          <label className={styles.field}>
            <span>Descripción del riesgo</span>
            <div className={styles.fieldTools}>
              <button type="button" className={styles.secondaryButton} onClick={refineRiskDescription} disabled={aiLoading}>
                {aiLoading ? 'IA...' : 'IA'}
              </button>
            </div>
            <textarea
              className={styles.textarea}
              rows={4}
              value={form.risk_description}
              onChange={(e) => setForm((prev) => ({ ...prev, risk_description: e.target.value }))}
              placeholder="Descripción del riesgo"
            />
          </label>

          <label className={styles.field}>
            <span>Categoría del riesgo</span>
            <input
              className={styles.input}
              value={form.risk_category}
              onChange={(e) => setForm((prev) => ({ ...prev, risk_category: e.target.value }))}
              placeholder="Categoría del riesgo"
            />
          </label>

          
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Factor de Riesgo</span>
              <select
                className={styles.input}
                value={form.risk_factor_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, risk_factor_id: e.target.value || null }))}
              >
                <option value="">Seleccionar...</option>
                {classifications.risk_factor.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Tipo de Evento (Basilea)</span>
              <select
                className={styles.input}
                value={form.operational_risk_loss_event_type_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, operational_risk_loss_event_type_id: e.target.value || null }))}
              >
                <option value="">Seleccionar...</option>
                {classifications.operational_risk_loss_event_type.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Estado de Riesgo Emergente</span>
              <select
                className={styles.input}
                value={form.risk_emerging_status_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, risk_emerging_status_id: e.target.value || null }))}
              >
                <option value="">Seleccionar...</option>
                {classifications.risk_emerging_status.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Fuente de Riesgo Emergente</span>
              <select
                className={styles.input}
                value={form.risk_emerging_source_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, risk_emerging_source_id: e.target.value || null }))}
              >
                <option value="">Seleccionar...</option>
                {classifications.risk_emerging_source.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
          </div>


          <label className={styles.switchRow}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            <span>Riesgo activo</span>
          </label>

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
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('next')} disabled={saving || !canNavigate || cursor >= riskRows.length - 1 || cursor < 0}>
                Siguiente
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate('last')} disabled={saving || !canNavigate || cursor >= riskRows.length - 1}>
                Final
              </button>
              <button type="button" className={styles.dangerButton} onClick={handleDelete} disabled={saving || !form.id}>
                Eliminar
              </button>
            </div>

            <div className={styles.actionsRight}>
              <button type="button" className={styles.secondaryButton} onClick={clearForNew} disabled={saving}>
                Nuevo
              </button>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>
                Volver al wizard
              </button>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar riesgo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
