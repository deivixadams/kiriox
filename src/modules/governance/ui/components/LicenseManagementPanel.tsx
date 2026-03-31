"use client";

import { useEffect, useMemo, useState } from 'react';
import styles from './LicenseManagementPanel.module.css';

type PlanLimits = {
  maxUsers: number | null;
  maxRunsMonthly: number | null;
  maxStorageGb: number | null;
  maxModules: number | null;
};

type CompanyLicenseRecord = {
  id: string;
  planCode: string;
  planName: string;
  status: string;
  expiresAt: string;
  validatedAt: string | null;
  allowedModules: string[];
  fileName: string | null;
  limits: PlanLimits;
};

type CompanyLicenseEvent = {
  id: string;
  eventType: string;
  eventStatus: string;
  notes: string | null;
  createdAt: string;
};

type LicenseDashboard = {
  currentLicense: CompanyLicenseRecord | null;
  enabledModules: string[];
  planLimits: PlanLimits | null;
  expirationStatus: 'valid' | 'expired' | 'missing';
  history: CompanyLicenseEvent[];
};

type ApiError = { error?: string; message?: string };

const EMPTY_LIMITS = {
  maxUsers: '',
  maxRunsMonthly: '',
  maxStorageGb: '',
  maxModules: '',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function parseNumberInput(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function LicenseManagementPanel() {
  const [data, setData] = useState<LicenseDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [renewExpiresAt, setRenewExpiresAt] = useState('');
  const [renewModules, setRenewModules] = useState('');
  const [renewNotes, setRenewNotes] = useState('');
  const [renewLimits, setRenewLimits] = useState(EMPTY_LIMITS);

  const expirationLabel = useMemo(() => {
    if (!data) return 'Sin datos';
    if (data.expirationStatus === 'valid') return 'Vigente';
    if (data.expirationStatus === 'expired') return 'Expirada';
    return 'Sin licencia';
  }, [data]);

  async function loadDashboard() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/governance/license', { cache: 'no-store' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(payload.message || payload.error || 'No se pudo cargar licencia');
      }
      const payload = (await response.json()) as LicenseDashboard;
      setData(payload);
    } catch (error: any) {
      setMessage(error?.message || 'Error cargando licencia');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function uploadLicense() {
    if (!uploadFile) {
      setMessage('Seleccione un archivo de licencia (.json).');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.set('file', uploadFile);

      const response = await fetch('/api/governance/license/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(payload.message || payload.error || 'No se pudo subir la licencia');
      }

      setMessage('Licencia subida correctamente.');
      setUploadFile(null);
      await loadDashboard();
    } catch (error: any) {
      setMessage(error?.message || 'Error subiendo licencia');
    } finally {
      setBusy(false);
    }
  }

  async function validateLicense() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/governance/license/validate', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as ApiError).message || (payload as ApiError).error || 'No se pudo validar');
      }
      const result = payload as { valid: boolean; reason: string };
      setMessage(`Validación completada: ${result.reason}`);
      await loadDashboard();
    } catch (error: any) {
      setMessage(error?.message || 'Error validando licencia');
    } finally {
      setBusy(false);
    }
  }

  async function renewLicense() {
    if (!renewExpiresAt.trim()) {
      setMessage('Indique la nueva fecha de expiración.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/governance/license/renew', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          expiresAt: renewExpiresAt,
          allowedModules: renewModules
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          notes: renewNotes || undefined,
          limits: {
            maxUsers: parseNumberInput(renewLimits.maxUsers),
            maxRunsMonthly: parseNumberInput(renewLimits.maxRunsMonthly),
            maxStorageGb: parseNumberInput(renewLimits.maxStorageGb),
            maxModules: parseNumberInput(renewLimits.maxModules),
          },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(payload.message || payload.error || 'No se pudo instalar renovación');
      }

      setMessage('Renovación instalada correctamente.');
      setRenewExpiresAt('');
      setRenewModules('');
      setRenewNotes('');
      setRenewLimits(EMPTY_LIMITS);
      await loadDashboard();
    } catch (error: any) {
      setMessage(error?.message || 'Error instalando renovación');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Governance</p>
        <h1 className={styles.title}>License Management</h1>
        <p className={styles.subtitle}>
          Gestión administrativa de licencias por empresa: carga, validación, expiración, módulos y renovaciones.
        </p>
      </header>

      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Licencia actual</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : data?.currentLicense ? (
            <div className={styles.stack}>
              <p><strong>Plan:</strong> {data.currentLicense.planName} ({data.currentLicense.planCode})</p>
              <p><strong>Estado:</strong> {data.currentLicense.status}</p>
              <p><strong>Vencimiento:</strong> {formatDate(data.currentLicense.expiresAt)}</p>
              <p><strong>Última validación:</strong> {formatDate(data.currentLicense.validatedAt)}</p>
              <p><strong>Archivo:</strong> {data.currentLicense.fileName || '—'}</p>
            </div>
          ) : (
            <p>No existe licencia cargada para esta empresa.</p>
          )}
        </article>

        <article className={styles.card}>
          <h2>Expiración y validación</h2>
          <p><strong>Estado de expiración:</strong> {expirationLabel}</p>
          <button className={styles.button} disabled={busy || loading} onClick={() => void validateLicense()}>
            Validar licencia
          </button>
        </article>

        <article className={styles.card}>
          <h2>Subir archivo de licencia</h2>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <button className={styles.button} disabled={busy || !uploadFile} onClick={() => void uploadLicense()}>
            Subir licencia
          </button>
          <p className={styles.hint}>Formato esperado: JSON con `planCode`, `planName`, `expiresAt`, `allowedModules`, `limits`.</p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Módulos habilitados</h2>
          <ul className={styles.list}>
            {(data?.enabledModules ?? []).map((moduleCode) => (
              <li key={moduleCode}>{moduleCode}</li>
            ))}
            {(data?.enabledModules ?? []).length === 0 && <li>Sin módulos habilitados por licencia.</li>}
          </ul>
        </article>

        <article className={styles.card}>
          <h2>Límites del plan</h2>
          <div className={styles.stack}>
            <p><strong>Usuarios máximos:</strong> {data?.planLimits?.maxUsers ?? '—'}</p>
            <p><strong>Runs/mes:</strong> {data?.planLimits?.maxRunsMonthly ?? '—'}</p>
            <p><strong>Storage (GB):</strong> {data?.planLimits?.maxStorageGb ?? '—'}</p>
            <p><strong>Módulos máximos:</strong> {data?.planLimits?.maxModules ?? '—'}</p>
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h2>Instalar renovación</h2>
        <div className={styles.formGrid}>
          <label>
            Nueva expiración
            <input
              type="datetime-local"
              value={renewExpiresAt}
              onChange={(event) => setRenewExpiresAt(event.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            Módulos (csv opcional)
            <input
              type="text"
              value={renewModules}
              onChange={(event) => setRenewModules(event.target.value)}
              placeholder="audit,structural-risk,simulation"
              disabled={busy}
            />
          </label>
          <label>
            Nota
            <input
              type="text"
              value={renewNotes}
              onChange={(event) => setRenewNotes(event.target.value)}
              placeholder="Renovación comercial 2026"
              disabled={busy}
            />
          </label>
        </div>

        <div className={styles.formGrid}>
          <label>
            Límite usuarios
            <input
              type="number"
              value={renewLimits.maxUsers}
              onChange={(event) => setRenewLimits((state) => ({ ...state, maxUsers: event.target.value }))}
              disabled={busy}
            />
          </label>
          <label>
            Límite runs/mes
            <input
              type="number"
              value={renewLimits.maxRunsMonthly}
              onChange={(event) => setRenewLimits((state) => ({ ...state, maxRunsMonthly: event.target.value }))}
              disabled={busy}
            />
          </label>
          <label>
            Límite storage GB
            <input
              type="number"
              value={renewLimits.maxStorageGb}
              onChange={(event) => setRenewLimits((state) => ({ ...state, maxStorageGb: event.target.value }))}
              disabled={busy}
            />
          </label>
          <label>
            Límite módulos
            <input
              type="number"
              value={renewLimits.maxModules}
              onChange={(event) => setRenewLimits((state) => ({ ...state, maxModules: event.target.value }))}
              disabled={busy}
            />
          </label>
        </div>

        <button className={styles.button} disabled={busy} onClick={() => void renewLicense()}>
          Instalar renovación
        </button>
      </section>

      <section className={styles.card}>
        <h2>Historial</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {(data?.history ?? []).map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.createdAt)}</td>
                  <td>{event.eventType}</td>
                  <td>{event.eventStatus}</td>
                  <td>{event.notes || '—'}</td>
                </tr>
              ))}
              {(data?.history ?? []).length === 0 && (
                <tr>
                  <td colSpan={4}>Sin eventos de licencia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
