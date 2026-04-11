"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './RealmEditorPanel.module.css';
import { useRegisterCommandSearch } from '@/shared/ui/command-search/useRegisterCommandSearch';
import { CrudModelActionBar } from '@/shared/ui/crud-model';

type CompanyOption = {
  id: string;
  code: string;
  name: string;
};

type ActivityRecord = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function nowInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;
}

export function KeyActivitiesEditorPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    id: '',
    code: '',
    name: '',
    description: '',
    isActive: true,
    createdAt: nowInputValue(),
    updatedAt: nowInputValue(),
  });

  useEffect(() => {
    async function loadCompanies() {
      try {
        const response = await fetch('/api/governance/company-realm/assignment', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as { companies?: CompanyOption[] };
        const items = Array.isArray(payload.companies) ? payload.companies : [];
        setCompanies(items);
        if (!selectedCompanyId && items[0]?.id) {
          setSelectedCompanyId(items[0].id);
        }
      } catch {
        // ignore bootstrap errors; UI will show message on data load.
      }
    }
    void loadCompanies();
  }, [selectedCompanyId]);

  async function loadRecords(preferredId?: string) {
    if (!selectedCompanyId) {
      setRecords([]);
      setCursor(-1);
      setForm({
        id: '',
        code: '',
        name: '',
        description: '',
        isActive: true,
        createdAt: nowInputValue(),
        updatedAt: nowInputValue(),
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/governance/key-activities?companyId=${encodeURIComponent(selectedCompanyId)}`,
        { cache: 'no-store' }
      );
      if (!response.ok) throw new Error('No se pudo cargar catálogo de actividades claves');

      const payload = (await response.json()) as { items?: ActivityRecord[] };
      const items = Array.isArray(payload.items) ? payload.items : [];
      setRecords(items);

      if (items.length === 0) {
        setCursor(-1);
        setForm({
          id: '',
          code: '',
          name: '',
          description: '',
          isActive: true,
          createdAt: nowInputValue(),
          updatedAt: nowInputValue(),
        });
        return;
      }

      const targetIndex = preferredId ? items.findIndex((item) => item.id === preferredId) : -1;
      const index = targetIndex >= 0 ? targetIndex : 0;
      applyRecord(items[index], index);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar catálogo de actividades claves');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, [selectedCompanyId]);

  function applyRecord(record: ActivityRecord, index: number) {
    setCursor(index);
    setForm({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description || '',
      isActive: record.isActive,
      createdAt: toLocalDateTimeInput(record.createdAt) || nowInputValue(),
      updatedAt: toLocalDateTimeInput(record.updatedAt) || nowInputValue(),
    });
  }

  const canNavigate = records.length > 0;

  function navigate(action: 'first' | 'prev' | 'next' | 'last') {
    if (!canNavigate) return;
    const current = cursor >= 0 ? cursor : 0;
    const nextIndex =
      action === 'first'
        ? 0
        : action === 'prev'
          ? Math.max(0, current - 1)
          : action === 'next'
            ? Math.min(records.length - 1, current + 1)
            : records.length - 1;

    applyRecord(records[nextIndex], nextIndex);
    setError('');
    setSuccess('');
  }

  function clearForNew() {
    setCursor(-1);
    setError('');
    setSuccess('');
    setForm({
      id: '',
      code: '',
      name: '',
      description: '',
      isActive: true,
      createdAt: nowInputValue(),
      updatedAt: nowInputValue(),
    });
    window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  }

  async function refineDescriptionWithIA() {
    setAiDescriptionLoading(true);
    try {
      const response = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: form.description,
          field: 'actividad_clave_descripcion',
          promptCode: 'GOV_KEY_ACTIVITY_DESCRIPTION',
        }),
      });

      const payload = await response.json().catch(() => ({}));
      const refined = String(payload?.refinedText ?? '').trim();
      if (refined) {
        setForm((prev) => ({ ...prev, description: refined }));
      }
    } finally {
      setAiDescriptionLoading(false);
    }
  }

  async function save() {
    setError('');
    setSuccess('');

    if (!selectedCompanyId) {
      setError('Selecciona una empresa.');
      return;
    }
    if (!form.name.trim()) {
      setError('El nombre de la actividad clave es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const response = await fetch('/api/governance/key-activities', {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: form.id || undefined,
          companyId: selectedCompanyId,
          name: form.name.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo guardar la actividad clave');
      }

      const savedId = String(payload?.item?.id ?? '');
      await loadRecords(savedId || undefined);
      setSuccess('Actividad clave guardada correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la actividad clave');
    } finally {
      setSaving(false);
    }
  }

  async function removeCurrent() {
    if (!form.id) {
      setError('No hay actividad clave seleccionada para eliminar.');
      return;
    }
    if (!window.confirm('¿Eliminar esta actividad clave?')) return;

    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/governance/key-activities?id=${encodeURIComponent(form.id)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo eliminar la actividad clave');
      }
      await loadRecords();
      setSuccess('Actividad clave eliminada correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar la actividad clave');
    } finally {
      setDeleting(false);
    }
  }

  const statusLabel = useMemo(() => {
    if (cursor < 0) return 'Nuevo registro';
    return `Registro ${cursor + 1} de ${records.length}`;
  }, [cursor, records.length]);

  useRegisterCommandSearch({
    id: 'governance-key-activities-editor',
    priority: 100,
    isActive: () => pathname === '/modelo/gobernanza/actividades-claves',
    search: (query) => {
      const term = query.trim().toLowerCase();
      if (!term) return { ok: false, message: 'Ingresa un término para buscar.' };
      if (records.length === 0) return { ok: false, message: 'No hay actividades registradas en esta pantalla.' };

      const index = records.findIndex((item) =>
        `${item.code} ${item.name} ${item.description || ''}`.toLowerCase().includes(term)
      );
      if (index < 0) {
        return { ok: false, message: `No se encontró "${query}" en actividades claves.` };
      }

      applyRecord(records[index], index);
      setError('');
      setSuccess(`Resultado encontrado: ${records[index].name}.`);
      return { ok: true, message: `Encontrado: ${records[index].name}` };
    },
  });

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Gobierno</p>
        <h1 className={styles.title}>Definición de Actividades Claves</h1>
        <p className={styles.subtitle}>
          Registra y actualiza el catálogo en `core.significant_activity` con persistencia por empresa.
        </p>
      </header>

      <article className={styles.card}>
        <div className={styles.statusRow}>
          <span>{statusLabel}</span>
          <button type="button" className={styles.secondaryButton} onClick={clearForNew} disabled={saving || loading}>
            Nuevo
          </button>
        </div>

        <label className={styles.field}>
          <span>Empresa</span>
          <select
            className={styles.input}
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
            disabled={saving}
          >
            <option value="">Selecciona empresa...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.code})
              </option>
            ))}
          </select>
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Id</span>
            <input className={styles.input} value={form.id || 'Se generará automáticamente (UUID)'} readOnly disabled />
          </label>
          <label className={styles.field}>
            <span>Code</span>
            <input className={styles.input} value={form.code || 'Se genera al grabar desde el nombre'} readOnly disabled />
          </label>
        </div>

        <label className={styles.field}>
          <span>Nombre</span>
          <input
            ref={nameInputRef}
            className={styles.input}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Nombre de la actividad clave"
          />
        </label>

        <label className={styles.field}>
          <span>Descripción</span>
          <div className={styles.fieldTools}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={refineDescriptionWithIA}
              disabled={aiDescriptionLoading || saving}
            >
              {aiDescriptionLoading ? 'IA...' : 'IA'}
            </button>
          </div>
          <textarea
            className={styles.textarea}
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Descripción de la actividad clave"
          />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Created at</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={form.createdAt}
              onChange={(event) => setForm((prev) => ({ ...prev, createdAt: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span>Updated at</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={form.updatedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, updatedAt: event.target.value }))}
            />
          </label>
        </div>

        <label className={styles.switchRow}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          <span>Registro activo</span>
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <CrudModelActionBar
          onFirst={() => navigate('first')}
          onPrevious={() => navigate('prev')}
          onNext={() => navigate('next')}
          onLast={() => navigate('last')}
          onClose={() => router.push('/modelo/gobernanza/company-reino')}
          onDelete={() => void removeCurrent()}
          onCancel={() => router.push('/modelo/gobernanza/company-reino')}
          onSave={() => void save()}
          disableFirst={saving || !canNavigate || cursor <= 0}
          disablePrevious={saving || !canNavigate || cursor <= 0}
          disableNext={saving || !canNavigate || cursor >= records.length - 1 || cursor < 0}
          disableLast={saving || !canNavigate || cursor >= records.length - 1}
          disableClose={saving || deleting}
          disableDelete={deleting || saving || loading || !form.id}
          disableCancel={saving || deleting}
          disableSave={saving || loading || deleting || !selectedCompanyId}
          deleteLabel="Eliminar"
          saveLabel="Grabar"
          savingLabel="Grabando..."
          deleting={deleting}
          saving={saving}
        />
      </article>
    </section>
  );
}

