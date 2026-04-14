"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CirclePlus, Trash2 } from 'lucide-react';
import styles from './RealmEditorPanel.module.css';
import { useRegisterCommandSearch } from '@/shared/ui/command-search/useRegisterCommandSearch';

type CompanyOption = {
  id: string;
  code: string;
  name: string;
};

type UserOption = {
  id: string;
  name: string;
  last_name?: string;
  email: string;
};

type FrequencyOption = {
  id: string;
  name: string;
};

type ReinoOption = {
  id: string;
  name: string;
};

type ProcessOption = {
  id: string;
  name: string;
  domainId?: string;
};

type ActivityRecord = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string;
  responsible: string;
  frequency: string;
  riskWeight: string;
  cascadeFactor: string;
  isCascade: boolean;
  isHardGate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function nowInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;
}

const initialForm = () => ({
  id: '',
  code: '',
  name: '',
  description: '',
  responsible: '',
  frequency: '',
  riskWeight: '1',
  cascadeFactor: '0',
  isCascade: false,
  isHardGate: false,
  isActive: true,
  createdAt: nowInputValue(),
  updatedAt: nowInputValue(),
});

export function KeyActivitiesEditorPanel() {
  const router = useRouter();
  const pathname = usePathname();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [reinos, setReinos] = useState<ReinoOption[]>([]);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [frequencies, setFrequencies] = useState<FrequencyOption[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedReinoId, setSelectedReinoId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState('');

  const [form, setForm] = useState(initialForm);

  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [pendingGridReload, setPendingGridReload] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          setPendingGridReload(true);
        }
      } catch {
        // ignore bootstrap errors
      }
    }

    async function loadUsers() {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) return;
        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : (payload.users || payload.items || []);
        setUsers(items);
      } catch {
        // ignore
      }
    }

    async function loadFrequencies() {
      try {
        const response = await fetch('/api/governance/frequency-catalog');
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: FrequencyOption[] };
        setFrequencies(payload.items || []);
      } catch {
        // ignore
      }
    }

    void loadCompanies();
    void loadUsers();
    void loadFrequencies();
  }, []);

  useEffect(() => {
    async function loadReinos() {
      if (!selectedCompanyId) {
        setReinos([]);
        setSelectedReinoId('');
        return;
      }
      try {
        const response = await fetch(`/api/governance/reino-catalog?companyId=${encodeURIComponent(selectedCompanyId)}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: ReinoOption[] };
        const items = payload.items || [];
        setReinos(items);
        if (!items.some((item) => item.id === selectedReinoId)) {
          setSelectedReinoId(items[0]?.id || '');
          setSelectedProcessId('');
          setSelectedDomainId('');
        }
      } catch {
        // ignore
      }
    }

    void loadReinos();
  }, [selectedCompanyId, selectedReinoId]);

  useEffect(() => {
    async function loadProcesses() {
      if (!selectedCompanyId || !selectedReinoId) {
        setProcesses([]);
        setSelectedProcessId('');
        setSelectedDomainId('');
        return;
      }
      try {
        const response = await fetch(
          `/api/governance/process-catalog?companyId=${encodeURIComponent(selectedCompanyId)}&reinoId=${encodeURIComponent(selectedReinoId)}`,
          { cache: 'no-store' }
        );
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: ProcessOption[] };
        const items = payload.items || [];
        setProcesses(items);
        const selected = items.find((item) => item.id === selectedProcessId) || items[0];
        if (!selected) {
          setSelectedProcessId('');
          setSelectedDomainId('');
        } else {
          if (selected.id !== selectedProcessId) {
            setSelectedProcessId(selected.id);
          }
          setSelectedDomainId(selected.domainId || '');
        }
      } catch {
        // ignore
      }
    }

    void loadProcesses();
  }, [selectedCompanyId, selectedReinoId, selectedProcessId]);

  function openNewRecord() {
    setError('');
    setSuccess('Modo nuevo registro activo.');
    setForm((prev) => ({
      ...prev,
      id: '',
      code: '',
      name: '',
      description: '',
      responsible: '',
      frequency: '',
      riskWeight: '1',
      cascadeFactor: '0',
    }));
  }

  const isContextComplete = Boolean(selectedCompanyId && selectedReinoId && selectedProcessId && selectedDomainId);

  const isFormComplete = useMemo(() => {
    return Boolean(
      form.name.trim() &&
        form.description.trim() &&
        form.responsible &&
        form.frequency &&
        form.riskWeight.trim() &&
        form.cascadeFactor.trim()
    );
  }, [form]);

  const canSave = isContextComplete && isFormComplete && !saving;

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
      if (refined) setForm((prev) => ({ ...prev, description: refined }));
    } finally {
      setAiDescriptionLoading(false);
    }
  }

  async function save() {
    setError('');
    setSuccess('');

    if (!isContextComplete) {
      setError('Selecciona empresa, macroproceso y proceso.');
      return;
    }
    if (!isFormComplete) {
      setError('Completa todos los campos de la Tarjeta 2 para habilitar Grabar.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/governance/key-activities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          reinoId: selectedReinoId,
          domainId: selectedDomainId,
          processId: selectedProcessId,
          activities: [
            {
              ...form,
              id: undefined,
              code: undefined,
            },
          ],
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo guardar la actividad.');
      }

      const savedItems = Array.isArray(payload?.items) ? payload.items : [];
      if (savedItems.length > 0) {
        setRecords((prev) => {
          const byId = new Map(prev.map((item) => [item.id, item]));
          for (const item of savedItems) byId.set(item.id, item);
          return Array.from(byId.values()).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        });
      }

      openNewRecord();
      setSuccess('Actividad guardada correctamente en core.domain_elements y core.map_domain_element.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function loadActivitiesForCurrentContext() {
    setError('');
    if (!isContextComplete) {
      setRecords([]);
      return;
    }

    setLoadingGrid(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompanyId,
        reinoId: selectedReinoId,
        domainId: selectedDomainId,
        processId: selectedProcessId,
      });
      const response = await fetch(`/api/governance/key-activities?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'No se pudieron cargar actividades.');

      const items = Array.isArray(payload?.items) ? payload.items : [];
      setRecords(items);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar actividades.');
    } finally {
      setLoadingGrid(false);
    }
  }

  useEffect(() => {
    if (!selectedCompanyId) return;
    setPendingGridReload(true);
    setRecords([]);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    setPendingGridReload(true);
  }, [selectedReinoId, selectedProcessId, selectedDomainId, selectedCompanyId]);

  useEffect(() => {
    if (!pendingGridReload || !isContextComplete) return;
    void loadActivitiesForCurrentContext();
    setPendingGridReload(false);
  }, [pendingGridReload, isContextComplete, selectedCompanyId, selectedReinoId, selectedProcessId, selectedDomainId]);

  async function removeActivity(id: string) {
    if (!id) return;
    setError('');
    setSuccess('');
    setRemovingId(id);
    try {
      const params = new URLSearchParams({
        id,
        companyId: selectedCompanyId,
        reinoId: selectedReinoId,
        domainId: selectedDomainId,
        processId: selectedProcessId,
      });
      const response = await fetch(`/api/governance/key-activities?${params.toString()}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'No se pudo remover la actividad.');

      setRecords((prev) => prev.filter((row) => row.id !== id));
      setSuccess('Actividad removida correctamente.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo remover la actividad.');
    } finally {
      setRemovingId('');
    }
  }

  function openRiskForActivity(activityId: string) {
    if (!activityId || !selectedCompanyId) {
      setError('Selecciona empresa y actividad para registrar riesgo.');
      return;
    }
    const params = new URLSearchParams({
      company_id: selectedCompanyId,
      significant_activity_id: activityId,
      return_to: '/modelo/gobernanza/actividades-claves',
    });
    router.push(`/validacion/riesgo-lineal/riesgo/nuevo?${params.toString()}`);
  }

  useRegisterCommandSearch({
    id: 'governance-key-activities-editor',
    priority: 100,
    isActive: () => pathname === '/modelo/gobernanza/actividades-claves',
    search: (query) => {
      const term = query.trim().toLowerCase();
      if (!term) return { ok: false, message: 'Ingresa un término para buscar.' };
      const found = records.find((item) => `${item.code} ${item.name} ${item.description || ''}`.toLowerCase().includes(term));
      if (!found) return { ok: false, message: `No se encontró "${query}" en actividades.` };
      return { ok: true, message: `Encontrado: ${found.name}` };
    },
  });

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Gobierno</p>
        <h1 className={styles.title}>Definición de Actividades Claves</h1>
        <p className={styles.subtitle}>Registra y actualiza el catálogo de actividades en `core.domain_elements`.</p>
      </header>

      <article className={styles.card} id="actividad_clave_tarjeta1">
        <div className={styles.statusRow}>
          <span>Contexto de Selección</span>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>{loadingGrid ? 'Cargando grilla...' : 'Grilla activa'}</span>
        </div>

        <div className={styles.grid}>
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

          <label className={styles.field}>
            <span>Macroproceso</span>
            <select
              className={styles.input}
              value={selectedReinoId}
              onChange={(event) => setSelectedReinoId(event.target.value)}
              disabled={saving}
            >
              <option value="">Selecciona...</option>
              {reinos.map((reino) => (
                <option key={reino.id} value={reino.id}>
                  {reino.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Proceso</span>
            <select
              className={styles.input}
              value={selectedProcessId}
              onChange={(event) => {
                const processId = event.target.value;
                setSelectedProcessId(processId);
                const selectedProcess = processes.find((p) => p.id === processId);
                setSelectedDomainId(selectedProcess?.domainId || '');
              }}
              disabled={saving}
            >
              <option value="">Selecciona...</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <article className={styles.card} id="actividad_clave_tarjeta2">
        <div className={styles.statusRow}>
          <span>{canSave ? 'Formulario completo: listo para grabar' : 'Modo nuevo registro'}</span>
        </div>

        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <label className={styles.field}>
            <span>Responsable</span>
            <select
              className={styles.input}
              value={form.responsible}
              onChange={(e) => setForm((prev) => ({ ...prev, responsible: e.target.value }))}
              disabled={saving}
            >
              <option value="">Selecciona responsable...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.last_name || ''}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Frecuencia</span>
            <select
              className={styles.input}
              value={form.frequency}
              onChange={(e) => setForm((prev) => ({ ...prev, frequency: e.target.value }))}
              disabled={saving}
            >
              <option value="">Selecciona frecuencia...</option>
              {frequencies.map((freq) => (
                <option key={freq.id} value={freq.id}>
                  {freq.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Peso de riesgo</span>
            <input
              type="number"
              min="1"
              max="5"
              step="1"
              className={styles.input}
              value={form.riskWeight}
              onChange={(e) => {
                let val = parseInt(e.target.value, 10);
                if (Number.isNaN(val)) {
                  setForm((prev) => ({ ...prev, riskWeight: '' }));
                  return;
                }
                if (val < 1) val = 1;
                if (val > 5) val = 5;
                setForm((prev) => ({ ...prev, riskWeight: String(val) }));
              }}
              placeholder="1 a 5"
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>Factor de cascada</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              className={styles.input}
              value={form.cascadeFactor}
              onChange={(e) => {
                let val = parseFloat(e.target.value);
                if (Number.isNaN(val)) {
                  setForm((prev) => ({ ...prev, cascadeFactor: '' }));
                  return;
                }
                if (val < 0) val = 0;
                if (val > 1) val = 1;
                setForm((prev) => ({ ...prev, cascadeFactor: String(val) }));
              }}
              placeholder="0 a 1"
              disabled={saving}
            />
          </label>
        </div>

        <div
          className={styles.grid}
          style={{ gridTemplateColumns: 'minmax(300px, 1.5fr) auto auto', alignItems: 'end', gap: '25px', marginBottom: '10px' }}
        >
          <label className={styles.field} style={{ flex: '1 1 300px' }}>
            <span>Nombre de la actividad</span>
            <input
              className={styles.input}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nombre corto"
              style={{ minWidth: 'auto' }}
              disabled={saving}
            />
          </label>

          <div style={{ display: 'flex', gap: '15px', paddingBottom: '10px' }}>
            <label className={styles.switchRow} style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={form.isHardGate}
                onChange={(event) => setForm((prev) => ({ ...prev, isHardGate: event.target.checked }))}
                disabled={saving}
              />
              <span
                style={{ fontSize: '13px', cursor: 'help', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                title="Condición crítica que impone un umbral mínimo de riesgo. Si se activa, anula cualquier compensación del modelo."
              >
                Hard Gate
              </span>
            </label>
            <label className={styles.switchRow} style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                disabled={saving}
              />
              <span style={{ fontSize: '13px' }}>Activo</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingBottom: '2px' }}>
            <label className={styles.field} style={{ margin: 0 }}>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>Creado</span>
              <input
                type="datetime-local"
                className={styles.input}
                style={{ fontSize: '11px', height: '28px', padding: '2px 5px', width: '150px' }}
                value={form.createdAt}
                onChange={(event) => setForm((prev) => ({ ...prev, createdAt: event.target.value }))}
                disabled={saving}
              />
            </label>
            <label className={styles.field} style={{ margin: 0 }}>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>Actualizado</span>
              <input
                type="datetime-local"
                className={styles.input}
                style={{ fontSize: '11px', height: '28px', padding: '2px 5px', width: '150px' }}
                value={form.updatedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, updatedAt: event.target.value }))}
                disabled={saving}
              />
            </label>
          </div>
        </div>

        <label className={styles.field}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Descripción</span>
            <button
              type="button"
              className={styles.secondaryButton}
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={refineDescriptionWithIA}
              disabled={aiDescriptionLoading || saving}
            >
              {aiDescriptionLoading ? 'Procesando...' : 'Mejorar con IA ✨'}
            </button>
          </div>
          <textarea
            className={styles.textarea}
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Descripción de la actividad clave"
            disabled={saving}
          />
        </label>

        <div
          style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', marginBottom: '30px' }}
        >
          <button
            type="button"
            className={styles.saveButton}
            style={{
              width: '160px',
              height: '44px',
              background: 'linear-gradient(180deg, rgba(22, 163, 74, 0.35) 0%, rgba(21, 128, 61, 0.32) 100%)',
              borderColor: 'rgba(34, 197, 94, 0.55)',
              color: '#ecfdf5',
            }}
            onClick={() => void save()}
            disabled={!canSave}
            title={!canSave ? 'Completa todos los campos para habilitar grabar.' : ''}
          >
            {saving ? 'Grabando...' : 'Grabar'}
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            style={{ width: '160px', height: '44px', borderRadius: '12px' }}
            onClick={() => router.push('/modelo/gobernanza/company-reino')}
            disabled={saving}
          >
            Cerrar
          </button>
        </div>

        <div className={styles.card} style={{ width: '100%', marginTop: '14px', overflowX: 'auto' }}>
            <div className={styles.statusRow}>
              <span>Actividades definidas ({records.length})</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px' }}>Nombre</th>
                  <th style={{ padding: '8px' }}>Descripción</th>
                  <th style={{ padding: '8px' }}>Responsable</th>
                  <th style={{ padding: '8px' }}>Frecuencia</th>
                  <th style={{ padding: '8px' }}>Peso</th>
                  <th style={{ padding: '8px' }}>Cascada</th>
                  <th style={{ padding: '8px' }}>Hard Gate</th>
                  <th style={{ padding: '8px' }}>Activo</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {records.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}>{act.name}</td>
                    <td style={{ padding: '8px' }}>{act.description || '---'}</td>
                    <td style={{ padding: '8px' }}>{users.find((u) => u.id === act.responsible)?.name || '---'}</td>
                    <td style={{ padding: '8px' }}>{frequencies.find((f) => f.id === act.frequency)?.name || '---'}</td>
                    <td style={{ padding: '8px' }}>{act.riskWeight || '1'}</td>
                    <td style={{ padding: '8px' }}>{act.cascadeFactor || '0'}</td>
                    <td style={{ padding: '8px' }}>{act.isHardGate ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '8px' }}>{act.isActive ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => openRiskForActivity(act.id)}
                        disabled={Boolean(removingId) || saving}
                        title="Agregar riesgo"
                        aria-label="Agregar riesgo"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <CirclePlus size={15} />
                      </button>
                      <span style={{ opacity: 0.75 }}>-</span>
                      <button
                        type="button"
                        onClick={() => void removeActivity(act.id)}
                        disabled={Boolean(removingId) || saving}
                        title={removingId === act.id ? 'Removiendo...' : 'Remover'}
                        aria-label={removingId === act.id ? 'Removiendo' : 'Remover'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </article>
    </section>
  );
}
