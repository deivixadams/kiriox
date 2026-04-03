'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './SignificantActivityNewPage.module.css';

type CompanyOption = { id: string; name: string };
type ActivityOption = {
  id: string;
  company_id: string;
  activity_code: string;
  activity_name: string;
  activity_description: string | null;
  is_active: boolean;
};

export default function SignificantActivityNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get('return_to') || '/validacion/riesgo-lineal/nueva';
  const draft = searchParams.get('draft') || '';
  const rowTempId = searchParams.get('row_temp_id') || '';
  const companyId = searchParams.get('company_id') || '';
  const companyLocked = Boolean(companyId);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [activityRows, setActivityRows] = useState<ActivityOption[]>([]);
  const [cursor, setCursor] = useState<number>(-1);

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    significant_activity_id: '',
    company_id: companyId,
    activity_code: '',
    activity_name: '',
    activity_description: '',
    is_active: true,
  });

  const selectedCompanyName = useMemo(
    () => companies.find((company) => company.id === form.company_id)?.name || 'Empresa no definida',
    [companies, form.company_id]
  );

  const applyRow = React.useCallback((row: ActivityOption, index: number) => {
    setCursor(index);
    setForm((prev) => ({
      ...prev,
      significant_activity_id: row.id,
      company_id: row.company_id,
      activity_code: row.activity_code,
      activity_name: row.activity_name,
      activity_description: row.activity_description || '',
      is_active: row.is_active,
    }));
  }, []);

  const loadActivities = React.useCallback(async (company: string, preferredId?: string) => {
    if (!company) {
      setActivityRows([]);
      setCursor(-1);
      return;
    }

    const res = await fetch(`/api/linear-risk/catalog/significant-activities?companyId=${encodeURIComponent(company)}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    const rows = Array.isArray(data?.items) ? data.items : [];
    setActivityRows(rows);

    if (rows.length === 0) {
      setCursor(-1);
      return;
    }

    const targetId = preferredId || form.significant_activity_id;
    const idx = targetId ? rows.findIndex((row) => row.id === targetId) : -1;
    const finalIdx = idx >= 0 ? idx : 0;
    applyRow(rows[finalIdx], finalIdx);
  }, [applyRow, form.significant_activity_id]);

  React.useEffect(() => {
    let mounted = true;
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await fetch('/api/linear-risk/context', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.companies) ? data.companies : [];
        if (!mounted) return;
        setCompanies(list);

        const resolvedCompanyId = form.company_id || list[0]?.id || '';
        if (resolvedCompanyId && resolvedCompanyId !== form.company_id) {
          setForm((prev) => ({ ...prev, company_id: resolvedCompanyId }));
        }
        await loadActivities(resolvedCompanyId);
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    };
    loadCompanies();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!form.company_id) return;
    loadActivities(form.company_id);
  }, [form.company_id, loadActivities]);

  const goBack = () => {
    const params = new URLSearchParams();
    if (draft) params.set('draft', draft);
    params.set('step', '2');
    router.push(params.toString() ? `${returnTo}?${params.toString()}` : returnTo);
  };

  const clearForNew = () => {
    setCursor(-1);
    setSuccess(null);
    setError(null);
    setForm((prev) => ({
      ...prev,
      significant_activity_id: '',
      activity_code: '',
      activity_name: '',
      activity_description: '',
      is_active: true,
    }));
  };

  const navigateRecord = (target: 'first' | 'prev' | 'next' | 'last') => {
    if (activityRows.length === 0) return;
    const current = cursor >= 0 ? cursor : 0;
    const nextIndex =
      target === 'first'
        ? 0
        : target === 'prev'
          ? Math.max(0, current - 1)
          : target === 'next'
            ? Math.min(activityRows.length - 1, current + 1)
            : activityRows.length - 1;
    applyRow(activityRows[nextIndex], nextIndex);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async () => {
    if (!form.significant_activity_id) {
      setError('No hay actividad seleccionada para eliminar.');
      return;
    }
    if (!window.confirm('¿Eliminar esta actividad del catálogo?')) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await fetch('/api/auth/csrf');
      const res = await fetch(`/api/linear-risk/catalog/significant-activities?id=${encodeURIComponent(form.significant_activity_id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo eliminar la actividad.');
        return;
      }
      setSuccess('Actividad eliminada correctamente.');
      clearForNew();
      await loadActivities(form.company_id);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.company_id) {
      setError('La empresa es obligatoria.');
      return;
    }
    if (!form.activity_code.trim()) {
      setError('El código de actividad es obligatorio.');
      return;
    }
    if (!form.activity_name.trim()) {
      setError('El nombre de actividad es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/auth/csrf');

      const isEdit = Boolean(form.significant_activity_id);
      const res = await fetch('/api/linear-risk/catalog/significant-activities', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.significant_activity_id || undefined,
          company_id: form.company_id,
          activity_code: form.activity_code.trim(),
          activity_name: form.activity_name.trim(),
          activity_description: form.activity_description.trim() || null,
          is_active: form.is_active,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo guardar la actividad.');
        return;
      }

      setSuccess(isEdit ? 'Actividad actualizada correctamente.' : 'Actividad creada correctamente.');
      await loadActivities(form.company_id, String(data.id || ''));

      if (!isEdit) {
        const params = new URLSearchParams();
        if (draft) params.set('draft', draft);
        params.set('step', '2');
        params.set('from_new_activity', '1');
        params.set('selected_activity_id', String(data.id));
        if (rowTempId) params.set('row_temp_id', rowTempId);
        router.push(`${returnTo}?${params.toString()}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Nueva actividad significativa</h1>
          <p className={styles.subtitle}>
            Define una actividad en el catálogo de riesgo lineal para usarla inmediatamente en el Paso 2 del wizard.
          </p>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Empresa</span>
              <select
                className={styles.input}
                value={form.company_id}
                onChange={(e) => {
                  if (companyLocked) return;
                  const nextCompanyId = e.target.value;
                  setForm((prev) => ({ ...prev, company_id: nextCompanyId, significant_activity_id: '' }));
                  setCursor(-1);
                }}
              >
                <option value="">
                  {loadingCompanies ? 'Cargando empresas...' : 'Seleccione empresa'}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <small className={styles.helper}>Empresa seleccionada: {selectedCompanyName}</small>
              {companyLocked && <small className={styles.helper}>Empresa bloqueada por contexto del wizard.</small>}
            </label>

            <label className={styles.field}>
              <span>Código de actividad</span>
              <input
                className={styles.input}
                value={form.activity_code}
                onChange={(e) => setForm((prev) => ({ ...prev, activity_code: e.target.value }))}
                placeholder="Ej. ACT-PAGOS-001"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Nombre de actividad</span>
            <input
              className={styles.input}
              value={form.activity_name}
              onChange={(e) => setForm((prev) => ({ ...prev, activity_name: e.target.value }))}
              placeholder="Nombre de la actividad"
            />
          </label>

          <label className={styles.field}>
            <span>Descripción</span>
            <textarea
              className={styles.textarea}
              rows={4}
              value={form.activity_description}
              onChange={(e) => setForm((prev) => ({ ...prev, activity_description: e.target.value }))}
              placeholder="Describe función, alcance y contexto operativo de la actividad"
            />
          </label>

          <label className={styles.switchRow}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            <span>Actividad activa</span>
          </label>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.actions}>
            <div className={styles.actionsLeft}>
              <button type="button" className={styles.secondaryButton} onClick={() => navigateRecord('first')} disabled={saving || activityRows.length === 0 || cursor <= 0}>
                Primero
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigateRecord('prev')} disabled={saving || activityRows.length === 0 || cursor <= 0}>
                Anterior
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigateRecord('next')} disabled={saving || activityRows.length === 0 || cursor >= activityRows.length - 1 || cursor < 0}>
                Siguiente
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigateRecord('last')} disabled={saving || activityRows.length === 0 || cursor >= activityRows.length - 1}>
                Final
              </button>
              <button type="button" className={styles.dangerButton} onClick={handleDelete} disabled={saving || !form.significant_activity_id}>
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
                {saving ? 'Guardando...' : 'Guardar actividad'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
