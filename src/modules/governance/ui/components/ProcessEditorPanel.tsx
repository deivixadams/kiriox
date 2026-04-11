
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './RealmEditorPanel.module.css'; // Reusing styles from RealmEditor
import { useRegisterCommandSearch } from '@/shared/ui/command-search/useRegisterCommandSearch';
import { CrudModelActionBar } from '@/shared/ui/crud-model';

type ProcessRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  email: string;
  name: string | null;
  lastName: string | null;
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

export function ProcessEditorPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    id: '',
    code: '',
    name: '',
    description: '',
    categoryId: '',
    ownerId: '',
    isActive: true,
    createdAt: nowInputValue(),
    updatedAt: nowInputValue(),
  });

  async function loadData(preferredId?: string) {
    setLoading(true);
    setError('');
    try {
      // 1. Load Categories
      const catRes = await fetch('/api/governance/process/categories');
      const catPayload = await catRes.json();
      setCategories(catPayload.items || []);

      // 1.1 Load Users
      const usersRes = await fetch('/api/admin/users');
      const usersPayload = await usersRes.json();
      // Handle both { users: [] } and [ ] structures
      const userList = Array.isArray(usersPayload) ? usersPayload : usersPayload.users || [];
      setUsers(userList);

      // 2. Load Processes
      const procRes = await fetch('/api/governance/process-editor', { cache: 'no-store' });
      if (!procRes.ok) throw new Error('No se pudo cargar catálogo de procesos');

      const procPayload = (await procRes.json()) as { items?: ProcessRecord[] };
      const items = Array.isArray(procPayload.items) ? procPayload.items : [];
      setRecords(items);

      if (items.length === 0) {
        setCursor(-1);
        setForm({
          id: '',
          code: '',
          name: '',
          description: '',
          categoryId: '',
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
      setError(err?.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function applyRecord(record: ProcessRecord, index: number) {
    setCursor(index);
    setForm({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description || '',
      categoryId: record.categoryId ? String(record.categoryId) : '',
      ownerId: record.ownerId || '',
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
      categoryId: '',
      ownerId: '',
      isActive: true,
      createdAt: nowInputValue(),
      updatedAt: nowInputValue(),
    });
    window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  }

  async function save() {
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('El nombre del proceso es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const response = await fetch('/api/governance/process-editor', {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId || null,
          ownerId: form.ownerId || null,
          isActive: form.isActive,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo guardar el proceso');
      }

      const savedId = payload?.item?.id || form.id;
      await loadData(savedId);
      setSuccess('Proceso guardado correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el proceso');
    } finally {
      setSaving(false);
    }
  }

  async function removeCurrent() {
    if (!form.id) {
      setError('No hay proceso seleccionado para eliminar.');
      return;
    }
    if (!window.confirm('¿Eliminar este proceso?')) return;

    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/governance/process-editor?id=${encodeURIComponent(form.id)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo eliminar el proceso');
      }
      await loadData();
      setSuccess('Proceso eliminado correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el proceso');
    } finally {
      setDeleting(false);
    }
  }

  const statusLabel = useMemo(() => {
    if (cursor < 0) return 'Nuevo proceso';
    return `Proceso ${cursor + 1} de ${records.length}`;
  }, [cursor, records.length]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Gobierno</p>
        <h1 className={styles.title}>Definición de Proceso</h1>
        <p className={styles.subtitle}>
          Registra y actualiza el catálogo de procesos en `core.process` vinculándolos a una categoría.
        </p>
      </header>

      <article className={styles.card}>
        <div className={styles.statusRow}>
          <span>{statusLabel}</span>
          <button type="button" className={styles.secondaryButton} onClick={clearForNew} disabled={saving || loading}>
            Nuevo
          </button>
        </div>

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

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Categoría de Proceso</span>
            <select
              className={styles.input}
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              disabled={saving}
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Líder proceso</span>
            <select
              className={styles.input}
              value={form.ownerId}
              onChange={(e) => setForm((p) => ({ ...p, ownerId: e.target.value }))}
              disabled={saving}
            >
              <option value="">Selecciona un líder...</option>
              {users.map((u) => {
                const label = [u.name, u.lastName].filter(Boolean).join(' ') || u.email;
                return (
                  <option key={u.id} value={u.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span>Nombre del Proceso</span>
          <input
            ref={nameInputRef}
            className={styles.input}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Ej: Gestión de Pagos"
          />
        </label>

        <label className={styles.field}>
          <span>Descripción</span>
          <textarea
            className={styles.textarea}
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Explica de qué trata este proceso..."
          />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Fecha de creación</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={form.createdAt}
              onChange={(event) => setForm((prev) => ({ ...prev, createdAt: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span>Última actualización</span>
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
          <span>Proceso activo</span>
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
          disableSave={saving || loading || deleting}
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
