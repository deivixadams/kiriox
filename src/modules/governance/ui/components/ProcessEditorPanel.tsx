
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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

type CompanyOption = {
  id: string;
  code: string;
  name: string;
};

type RealmOption = {
  id: string;
  code: string;
  name: string;
  description: string;
};

type CompanySelectionPayload = {
  companyId: string;
  activeRealmIds: string[];
};

type AssignmentContextPayload = {
  companies: CompanyOption[];
  realms: RealmOption[];
  selection: CompanySelectionPayload | null;
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
  const searchParams = useSearchParams();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  
  const queryCompanyId = searchParams.get('companyId')?.trim() || '';
  const queryRealmId = searchParams.get('realmId')?.trim() || '';

  function buildEmptyForm() {
    return {
      id: '',
      code: '',
      name: '',
      description: '',
      categoryId: '',
      ownerId: '',
      isActive: true,
      createdAt: nowInputValue(),
      updatedAt: nowInputValue(),
    };
  }

  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyRealms, setCompanyRealms] = useState<RealmOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [selectedCompanyId, setSelectedCompanyId] = useState(queryCompanyId);
  const [selectedRealmId, setSelectedRealmId] = useState(queryRealmId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState(buildEmptyForm);
  const selectedCompany = useMemo(
    () => companies.find((item) => item.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );
  const selectedRealm = useMemo(
    () => companyRealms.find((item) => item.id === selectedRealmId) ?? null,
    [companyRealms, selectedRealmId]
  );
  const selectedCategoryName = useMemo(() => {
    if (!form.categoryId) return cursor >= 0 ? 'Sin categoría asignada' : 'Sin categoría';
    return categories.find((c) => String(c.id) === String(form.categoryId))?.name || 'Categoría no encontrada';
  }, [categories, form.categoryId, cursor]);

  async function loadUsersByCompany(companyId: string) {
    if (!companyId) {
      setUsers([]);
      return;
    }
    const usersEndpoint = `/api/admin/users?companyId=${encodeURIComponent(companyId)}`;
    const usersRes = await fetch(usersEndpoint, { cache: 'no-store' });
    const usersPayload = await usersRes.json();
    const userList = Array.isArray(usersPayload) ? usersPayload : usersPayload.users || [];
    setUsers(userList);
  }

  async function loadProcesses(companyId: string, realmId: string, preferredId?: string, openNew = false) {
    if (!companyId || !realmId) {
      setRecords([]);
      setCursor(-1);
      setForm(buildEmptyForm());
      return;
    }

    const endpoint = `/api/governance/process-editor?companyId=${encodeURIComponent(companyId)}&realmId=${encodeURIComponent(realmId)}`;
    const procRes = await fetch(endpoint, { cache: 'no-store' });
    if (!procRes.ok) throw new Error('No se pudo cargar catálogo de procesos');

    const procPayload = (await procRes.json()) as { items?: ProcessRecord[] };
    const items = Array.isArray(procPayload.items) ? procPayload.items : [];
    setRecords(items);

    if (items.length === 0 || openNew) {
      setCursor(-1);
      setForm(buildEmptyForm());
      return;
    }

    const targetIndex = preferredId ? items.findIndex((item) => item.id === preferredId) : -1;
    const index = targetIndex >= 0 ? targetIndex : 0;
    applyRecord(items[index], index);
  }

  async function loadContextAndBootstrap() {
    setLoading(true);
    setError('');
    try {
      const [catRes, contextRes] = await Promise.all([
        fetch('/api/governance/process/categories', { cache: 'no-store' }),
        fetch('/api/governance/company-realm/assignment', { cache: 'no-store' }),
      ]);
      if (!catRes.ok) throw new Error('No se pudo cargar categorías');
      if (!contextRes.ok) throw new Error('No se pudo cargar catálogo de empresas');

      const catPayload = await catRes.json();
      setCategories(catPayload.items || []);

      const contextPayload = (await contextRes.json()) as AssignmentContextPayload;
      const contextCompanies = contextPayload.companies ?? [];
      const allRealms = contextPayload.realms ?? [];
      setCompanies(contextCompanies);

      const bootstrapCompanyId = queryCompanyId || contextCompanies[0]?.id || '';
      if (!bootstrapCompanyId) {
        setCompanyRealms([]);
        setSelectedCompanyId('');
        setSelectedRealmId('');
        setUsers([]);
        setRecords([]);
        setCursor(-1);
        setForm(buildEmptyForm());
        return;
      }

      const selectionRes = await fetch(
        `/api/governance/company-realm/assignment?companyId=${encodeURIComponent(bootstrapCompanyId)}`,
        { cache: 'no-store' }
      );
      if (!selectionRes.ok) throw new Error('No se pudo cargar macroprocesos de la empresa');
      const selectionPayload = (await selectionRes.json()) as AssignmentContextPayload;
      const mappedRealmIds = selectionPayload.selection?.activeRealmIds ?? [];
      const mappedRealms = allRealms.filter((realm) => mappedRealmIds.includes(realm.id));

      const bootstrapRealmId = queryRealmId || mappedRealms[0]?.id || '';

      setSelectedCompanyId(bootstrapCompanyId);
      setCompanyRealms(mappedRealms);
      setSelectedRealmId(bootstrapRealmId);

      await loadUsersByCompany(bootstrapCompanyId);
      await loadProcesses(bootstrapCompanyId, bootstrapRealmId);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContextAndBootstrap();
    // bootstrap once; subsequent changes are handled by onChange handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setForm(buildEmptyForm());
    window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  }

  async function onChangeCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setSuccess('');
    setError('');
    setSelectedRealmId('');
    setCompanyRealms([]);
    setRecords([]);
    setCursor(-1);
    setForm(buildEmptyForm());

    if (!companyId) {
      setUsers([]);
      return;
    }

    try {
      const [contextRes] = await Promise.all([
        fetch('/api/governance/company-realm/assignment', { cache: 'no-store' }),
        loadUsersByCompany(companyId),
      ]);
      if (!contextRes.ok) throw new Error('No se pudo cargar catálogo de macroprocesos');

      const payload = (await contextRes.json()) as AssignmentContextPayload;
      const selectionRes = await fetch(
        `/api/governance/company-realm/assignment?companyId=${encodeURIComponent(companyId)}`,
        { cache: 'no-store' }
      );
      if (!selectionRes.ok) throw new Error('No se pudo cargar macroprocesos de la empresa');
      const selectionPayload = (await selectionRes.json()) as AssignmentContextPayload;
      const mappedRealmIds = selectionPayload.selection?.activeRealmIds ?? [];
      const mappedRealms = (payload.realms ?? []).filter((realm) => mappedRealmIds.includes(realm.id));
      const firstRealmId = mappedRealms[0]?.id || '';

      setCompanyRealms(mappedRealms);
      setSelectedRealmId(firstRealmId);
      await loadProcesses(companyId, firstRealmId);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar contexto de empresa');
    }
  }

  async function onChangeRealm(reinoId: string) {
    setSelectedRealmId(reinoId);
    setSuccess('');
    setError('');
    await loadProcesses(selectedCompanyId, reinoId);
  }

  async function refineDescriptionWithIA() {
    setAiDescriptionLoading(true);
    try {
      const response = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: form.description,
          field: 'proceso_descripcion',
          promptCode: 'GOV_PROCESS_DESCRIPTION',
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

    if (!form.name.trim()) {
      setError('El nombre del proceso es obligatorio.');
      return;
    }
    if (!selectedCompanyId) {
      setError('No hay empresa seleccionada para asociar el proceso.');
      return;
    }
    if (!selectedRealmId) {
      setError('No hay macroproceso seleccionado para asociar el proceso.');
      return;
    }
    if (!form.ownerId) {
      setError('Selecciona un líder para el proceso.');
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
          companyId: selectedCompanyId,
          realmId: selectedRealmId,
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
      await loadProcesses(selectedCompanyId, selectedRealmId, savedId);
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
    if (!window.confirm('¿Marcar este proceso como inactivo?')) return;

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
      await loadProcesses(selectedCompanyId, selectedRealmId);
      setSuccess('Proceso marcado como inactivo.');
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

  useRegisterCommandSearch({
    id: 'governance-process-editor',
    priority: 100,
    isActive: () => pathname === '/modelo/gobernanza/company-reino/crear-proceso',
    search: (query) => {
      const term = query.trim().toLowerCase();
      if (!term) return { ok: false, message: 'Ingresa un término para buscar.' };
      if (records.length === 0) return { ok: false, message: 'No hay procesos registrados en esta pantalla.' };

      const index = records.findIndex((item) => item.name.toLowerCase().includes(term));
      if (index < 0) {
        return { ok: false, message: `No se encontró "${query}" por nombre de proceso.` };
      }

      applyRecord(records[index], index);
      setError('');
      setSuccess(`Resultado encontrado: ${records[index].name}.`);
      return { ok: true, message: `Encontrado: ${records[index].name}` };
    },
  });

  return (
    <section className={styles.page}>
      <header className={styles.headerSplit}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Gobierno</p>
          <h1 className={styles.title}>Definición de Proceso</h1>
          <p className={styles.subtitle}>
            Registra y actualiza el catálogo de procesos en `core.domain` vinculando empresa, líder y proceso.
          </p>
        </div>
        <aside className={styles.headerContextCard}>
          <p className={styles.headerContextNote}>Contexto editable</p>
          <label className={styles.field}>
            <span>Empresa</span>
            <select
              className={styles.input}
              value={selectedCompanyId}
              onChange={(event) => void onChangeCompany(event.target.value)}
              disabled={saving || deleting}
            >
              <option value="">Selecciona empresa...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.code})
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Macroproceso</span>
            <select
              className={styles.input}
              value={selectedRealmId}
              onChange={(event) => void onChangeRealm(event.target.value)}
              disabled={saving || deleting || !selectedCompanyId}
            >
              <option value="">Selecciona macroproceso...</option>
              {companyRealms.map((realm) => (
                <option key={realm.id} value={realm.id}>
                  {realm.name}
                </option>
              ))}
            </select>
          </label>
        </aside>
      </header>

      <article className={styles.card}>
        <p
          className={styles.info}
          style={{
            margin: 0,
            fontSize: cursor < 0 && selectedCompany ? '200%' : undefined,
            lineHeight: cursor < 0 && selectedCompany ? 1.1 : undefined,
            fontWeight: cursor < 0 && selectedCompany ? 700 : undefined,
          }}
        >
          {statusLabel}
        </p>

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
            <small style={{ color: '#94a3b8' }}>{selectedCategoryName}</small>
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
          onClose={() => router.push('/score/dashboard')}
          onNew={clearForNew}
          onDelete={() => void removeCurrent()}
          onSave={() => void save()}
          disableFirst={saving || !canNavigate || cursor <= 0}
          disablePrevious={saving || !canNavigate || cursor <= 0}
          disableNext={saving || !canNavigate || cursor >= records.length - 1 || cursor < 0}
          disableLast={saving || !canNavigate || cursor >= records.length - 1}
          disableClose={saving || deleting}
          disableNew={saving || deleting || loading}
          disableDelete={deleting || saving || loading || !form.id}
          disableSave={saving || loading || deleting}
          showNew
          showCancel={false}
          saveAfterNew
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
