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

type DomainOption = {
  id: string;
  name: string;
};

type ProcessOption = {
  id: string;
  name: string;
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
  const [reinos, setReinos] = useState<ReinoOption[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [frequencies, setFrequencies] = useState<FrequencyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedReinoId, setSelectedReinoId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState('');
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

  const [localActivities, setLocalActivities] = useState<ActivityRecord[]>([]);

  // Load Companies (Bootstrapping)
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
        // ignore bootstrap errors
      }
    }

    async function loadUsers() {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) return;
        const payload = await response.json();
        // Check if payload is array or has as specific key
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

  // Load Reinos when Company changes
  useEffect(() => {
    async function loadReinos() {
      if (!selectedCompanyId) {
        setReinos([]);
        setSelectedReinoId('');
        return;
      }
      try {
        const response = await fetch(`/api/governance/reino-catalog?companyId=${encodeURIComponent(selectedCompanyId)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: ReinoOption[] };
        setReinos(payload.items || []);
        if (!payload.items?.some(r => r.id === selectedReinoId)) {
          setSelectedReinoId('');
        }
      } catch {
        // ignore
      }
    }
    void loadReinos();
  }, [selectedCompanyId]);

  // Load Domains (Macroproceso) when Reino changes
  useEffect(() => {
    async function loadDomains() {
      if (!selectedCompanyId || !selectedReinoId) {
        setDomains([]);
        setSelectedDomainId('');
        return;
      }
      try {
        const response = await fetch(
          `/api/governance/domain-catalog?companyId=${encodeURIComponent(selectedCompanyId)}&reinoId=${encodeURIComponent(selectedReinoId)}`,
          { cache: 'no-store' }
        );
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: DomainOption[] };
        setDomains(payload.items || []);
        if (!payload.items?.some(d => d.id === selectedDomainId)) {
          setSelectedDomainId('');
        }
      } catch {
        // ignore
      }
    }
    void loadDomains();
  }, [selectedCompanyId, selectedReinoId]);

  // Load Processes when Macroproceso changes
  useEffect(() => {
    async function loadProcesses() {
      if (!selectedCompanyId || !selectedReinoId || !selectedDomainId) {
        setProcesses([]);
        setSelectedProcessId('');
        return;
      }
      try {
        const response = await fetch(
          `/api/governance/process-catalog?companyId=${encodeURIComponent(selectedCompanyId)}&reinoId=${encodeURIComponent(selectedReinoId)}&domainId=${encodeURIComponent(selectedDomainId)}`,
          { cache: 'no-store' }
        );
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: ProcessOption[] };
        setProcesses(payload.items || []);
        if (!payload.items?.some(p => p.id === selectedProcessId)) {
          setSelectedProcessId('');
        }
      } catch {
        // ignore
      }
    }
    void loadProcesses();
  }, [selectedCompanyId, selectedReinoId, selectedDomainId]);

  // Local State Management (No remote loading of catalog)
  function addToLocalGrid() {
    if (!form.name.trim()) {
      setError('Debes ingresar un nombre para la actividad.');
      return;
    }
    setError('');
    const newActivity: ActivityRecord = {
      ...form,
      id: crypto.randomUUID(), // Temp ID for grid
      companyId: selectedCompanyId,
      code: form.code || `ACT-${Date.now()}`,
    };
    setLocalActivities((prev) => [...prev, newActivity]);
    
    // Reset ALL fields of Tarjeta 2
    setForm({
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
    setSuccess('Actividad añadida a la lista local. No olvides Grabar al finalizar.');
  }

  function removeFromLocalGrid(id: string) {
    setLocalActivities((prev) => prev.filter(a => a.id !== id));
  }

  function applyRecord(record: ActivityRecord, index: number) {
    setCursor(index);
    setForm({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description || '',
      responsible: record.responsible || '',
      frequency: record.frequency || '',
      riskWeight: record.riskWeight || '',
      cascadeFactor: record.cascadeFactor || '',
      isCascade: !!record.isCascade,
      isHardGate: !!record.isHardGate,
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

    if (!selectedCompanyId || !selectedReinoId || !selectedDomainId || !selectedProcessId) {
      setError('Selecciona empresa, reino, macroproceso y proceso.');
      return;
    }
    if (localActivities.length === 0) {
      setError('No hay actividades en la lista para guardar.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/governance/key-activities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          batch: true,
          companyId: selectedCompanyId,
          reinoId: selectedReinoId,
          domainId: selectedDomainId,
          processId: selectedProcessId,
          activities: localActivities.map(a => ({
            ...a,
            id: undefined, // Let backend generate real IDs in domain_elements
          }))
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudieron guardar las actividades');
      }

      setLocalActivities([]);
      setSuccess('Todas las actividades se guardaron correctamente en core.domain_elements.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = useMemo(() => {
    return `Actividades por procesar: ${localActivities.length}`;
  }, [localActivities.length]);

  useRegisterCommandSearch({
    id: 'governance-key-activities-editor',
    priority: 100,
    isActive: () => pathname === '/modelo/gobernanza/actividades-claves',
    search: (query) => {
      const term = query.trim().toLowerCase();
      if (!term) return { ok: false, message: 'Ingresa un término para buscar.' };
      if (localActivities.length === 0) return { ok: false, message: 'No hay actividades en la lista local.' };

      const found = localActivities.find((item) =>
        `${item.name} ${item.description || ''}`.toLowerCase().includes(term)
      );
      if (!found) {
        return { ok: false, message: `No se encontró "${query}" en la lista.` };
      }

      setForm({ ...found });
      return { ok: true, message: `Encontrado local: ${found.name}` };
    },
  });

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Gobierno</p>
        <h1 className={styles.title}>Definición de Actividades Claves</h1>
        <p className={styles.subtitle}>
          Registra y actualiza el catálogo de actividades en `core.domain_elements`.
        </p>
      </header>

      <article className={styles.card} id="actividad_clave_tarjeta1">
        <div className={styles.statusRow}>
          <span>Contexto de Selección</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button" 
              className={styles.saveButton} 
              style={{ padding: '10px 28px', fontSize: '14px' }}
              onClick={() => {}}
            >
              Cargar proceso
            </button>
          </div>
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
            <span>Reino</span>
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
            <span>Macroproceso</span>
            <select
              className={styles.input}
              value={selectedDomainId}
              onChange={(event) => setSelectedDomainId(event.target.value)}
              disabled={saving}
            >
              <option value="">Selecciona...</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Proceso</span>
            <select
              className={styles.input}
              value={selectedProcessId}
              onChange={(event) => setSelectedProcessId(event.target.value)}
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
          <span>{statusLabel}</span>
        </div>

        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <label className={styles.field}>
            <span>Responsable</span>
            <select
              className={styles.input}
              value={form.responsible}
              onChange={(e) => setForm((prev) => ({ ...prev, responsible: e.target.value }))}
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
                let val = parseInt(e.target.value);
                if (Number.isNaN(val)) {
                  setForm((prev) => ({ ...prev, riskWeight: '' }));
                  return;
                }
                if (val < 1) val = 1;
                if (val > 5) val = 5;
                setForm((prev) => ({ ...prev, riskWeight: String(val) }));
              }}
              placeholder="1 a 5"
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
            />
          </label>
        </div>

        <div className={styles.grid} style={{ gridTemplateColumns: 'minmax(300px, 1.5fr) auto auto', alignItems: 'end', gap: '25px', marginBottom: '10px' }}>
          <label className={styles.field} style={{ flex: '1 1 300px' }}>
            <span>Nombre de la actividad</span>
            <input
              ref={nameInputRef}
              className={styles.input}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nombre corto"
              style={{ minWidth: 'auto' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '15px', paddingBottom: '10px' }}>
            <label className={styles.switchRow} style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={form.isHardGate}
                onChange={(event) => setForm((prev) => ({ ...prev, isHardGate: event.target.checked }))}
              />
              <span 
                style={{ fontSize: '13px', cursor: 'help', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                title="Condición crítica que impone un umbral mínimo de riesgo. Si se activa, anula cualquier compensación del modelo: el sistema salta directamente a un nivel de exposición definido, independientemente del resto de controles."
              >
                Hard Gate
              </span>
            </label>
            <label className={styles.switchRow} style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
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
          />
        </label>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', marginBottom: '30px' }}>
          <button 
            type="button" 
            className={styles.saveButton} 
            style={{ width: '160px', height: '44px', background: '#3b82f6', borderColor: '#2563eb' }}
            onClick={addToLocalGrid}
            disabled={saving || !form.name.trim()}
          >
            Agregar
          </button>

          <button 
            type="button" 
            className={styles.saveButton} 
            style={{ 
              width: '160px', 
              height: '44px', 
              background: 'linear-gradient(180deg, rgba(22, 163, 74, 0.35) 0%, rgba(21, 128, 61, 0.32) 100%)', 
              borderColor: 'rgba(34, 197, 94, 0.55)',
              color: '#ecfdf5'
            }}
            onClick={() => void save()}
            disabled={saving || loading || !selectedCompanyId || localActivities.length === 0}
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

        {localActivities.length > 0 && (
          <div className={styles.card} style={{ 
            width: '100%', 
            borderStyle: 'dashed', 
            background: 'rgba(15,23,42,0.3)',
            overflowX: 'auto'
          }}>
            <div className={styles.statusRow}>
              <span>Actividades pendientes de grabar</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px' }}>Nombre</th>
                  <th style={{ padding: '8px' }}>Descripción</th>
                  <th style={{ padding: '8px' }}>Responsable</th>
                  <th style={{ padding: '8px' }}>Freq</th>
                  <th style={{ padding: '8px' }}>Riesgo</th>
                  <th style={{ padding: '8px' }}>Factor</th>
                  <th style={{ padding: '8px' }}>Gate</th>
                  <th style={{ padding: '8px' }}>Act.</th>
                  <th style={{ padding: '8px' }}> Acción </th>
                </tr>
              </thead>
              <tbody>
                {localActivities.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}>{act.name}</td>
                    <td style={{ padding: '8px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.description}>
                      {act.description || '---'}
                    </td>
                    <td style={{ padding: '8px' }}>{users.find(u => u.id === act.responsible)?.name || '---'}</td>
                    <td style={{ padding: '8px' }}>{frequencies.find(f => f.id === act.frequency)?.name || '---'}</td>
                    <td style={{ padding: '8px' }}>{act.riskWeight}</td>
                    <td style={{ padding: '8px' }}>{act.cascadeFactor}</td>
                    <td style={{ padding: '8px' }}>{act.isHardGate ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '8px' }}>{act.isActive ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => removeFromLocalGrid(act.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

      </article>
    </section>
  );
}
