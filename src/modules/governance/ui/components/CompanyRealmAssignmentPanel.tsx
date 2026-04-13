"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pencil } from 'lucide-react';
import styles from './CompanyRealmAssignmentPanel.module.css';
import { useRegisterCommandSearch } from '@/shared/ui/command-search/useRegisterCommandSearch';

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

type ContextPayload = {
  companies: CompanyOption[];
  realms: RealmOption[];
  selection: CompanySelectionPayload | null;
};

export function CompanyRealmAssignmentPanel() {
  const pathname = usePathname();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [realms, setRealms] = useState<RealmOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('');
  const [baseRealmIds, setBaseRealmIds] = useState<string[]>([]);
  const [selectedRealmIds, setSelectedRealmIds] = useState<string[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadContext() {
      setLoadingContext(true);
      setErrorMessage('');

      try {
        const response = await fetch('/api/governance/company-realm/assignment', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('No se pudo cargar catálogo de empresas y reinos');
        }

        const payload = (await response.json()) as ContextPayload;
        setCompanies(payload.companies ?? []);
        setRealms(payload.realms ?? []);
      } catch (error: any) {
        setErrorMessage(error?.message || 'No se pudo cargar catálogo de empresas y reinos');
      } finally {
        setLoadingContext(false);
      }
    }

    void loadContext();
  }, []);

  async function loadCompanySelection(companyId: string) {
    if (!companyId) {
      setBaseRealmIds([]);
      setSelectedRealmIds([]);
      return;
    }

    setLoadingSelection(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/governance/company-realm/assignment?companyId=${encodeURIComponent(companyId)}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || payload?.error || 'No se pudo cargar la selección actual');
      }

      const payload = (await response.json()) as ContextPayload;
      const activeRealmIds = payload.selection?.activeRealmIds ?? [];
      setBaseRealmIds(activeRealmIds);
      setSelectedRealmIds(activeRealmIds);
    } catch (error: any) {
      setErrorMessage(error?.message || 'No se pudo cargar la selección actual');
      setBaseRealmIds([]);
      setSelectedRealmIds([]);
    } finally {
      setLoadingSelection(false);
    }
  }

  function onChangeCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setSuccessMessage('');
    setErrorMessage('');
    void loadCompanySelection(companyId);
  }

  function toggleRealm(realmId: string) {
    setSuccessMessage('');
    setErrorMessage('');

    setSelectedRealmIds((previous) => {
      if (previous.includes(realmId)) {
        return previous.filter((id) => id !== realmId);
      }
      return [...previous, realmId];
    });
  }

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );
  const visibleRealms = useMemo(() => {
    const term = catalogFilter.trim().toLowerCase();
    if (!term) return realms;
    return realms.filter((realm) =>
      `${realm.code} ${realm.name} ${realm.description || ''}`.toLowerCase().includes(term)
    );
  }, [catalogFilter, realms]);

  const baseSet = useMemo(() => new Set(baseRealmIds), [baseRealmIds]);
  const selectedSet = useMemo(() => new Set(selectedRealmIds), [selectedRealmIds]);

  const pendingAdd = useMemo(
    () => realms.filter((realm) => selectedSet.has(realm.id) && !baseSet.has(realm.id)),
    [realms, selectedSet, baseSet]
  );

  const pendingRemove = useMemo(
    () => realms.filter((realm) => baseSet.has(realm.id) && !selectedSet.has(realm.id)),
    [realms, selectedSet, baseSet]
  );

  const hasPendingChanges = pendingAdd.length > 0 || pendingRemove.length > 0;

  useRegisterCommandSearch({
    id: 'governance-company-reino',
    priority: 100,
    isActive: () => pathname === '/modelo/gobernanza/company-reino',
    search: (query) => {
      const term = query.trim().toLowerCase();
      if (!term) return { ok: false, message: 'Ingresa un término para buscar.' };
      if (realms.length === 0) return { ok: false, message: 'No hay macroprocesos disponibles en catálogo.' };

      const index = realms.findIndex((realm) =>
        `${realm.code} ${realm.name} ${realm.description || ''}`.toLowerCase().includes(term)
      );
      if (index < 0) {
        return { ok: false, message: `No se encontró "${query}" en macroprocesos.` };
      }

      const match = realms[index];
      setCatalogFilter(query);
      setErrorMessage('');
      if (selectedCompanyId) {
        setSelectedRealmIds([match.id]);
        setSuccessMessage(`Resultado encontrado: ${match.name}. Macroproceso preseleccionado.`);
      } else {
        setSuccessMessage(`Resultado encontrado: ${match.name}. Selecciona empresa para vincular.`);
      }
      return { ok: true, message: `Encontrado: ${match.name}` };
    },
  });

  async function saveConfiguration() {
    if (!selectedCompanyId) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/governance/company-realm/assignment', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          realmIds: selectedRealmIds,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo guardar la configuración');
      }

      const savedRealmIds = Array.isArray(payload?.selectedRealmIds)
        ? payload.selectedRealmIds.map((value: unknown) => String(value))
        : [];

      setBaseRealmIds(savedRealmIds);
      setSelectedRealmIds(savedRealmIds);
      setSuccessMessage('Configuración guardada correctamente.');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  const configurationStateLabel = useMemo(() => {
    if (!selectedCompanyId) return 'Sin empresa seleccionada';
    if (loadingSelection) return 'Cargando configuración';
    if (baseRealmIds.length === 0) return 'Empresa sin reinos vinculados';
    return 'Empresa con reinos vinculados';
  }, [selectedCompanyId, loadingSelection, baseRealmIds.length]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Paso 1 de Gobernanza</p>
        <h1 className={styles.title}>Macroprocesos</h1>
        <p className={styles.subtitle}>
          Escoge un macroproceso para la empresa del catálogo o crea uno nuevo.
        </p>
      </header>

      {loadingContext && <p className={styles.info}>Cargando catálogo base...</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <article className={styles.card}>
        <h2>Empresa</h2>
        <div className={styles.companyRow}>
          <select
            className={styles.select}
            value={selectedCompanyId}
            onChange={(event) => onChangeCompany(event.target.value)}
            disabled={loadingContext || saving}
          >
            <option value="">Selecciona una empresa activa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.code})
              </option>
            ))}
          </select>
          <Link href="/modelo/gobernanza/company-reino/crear-reino" className={styles.saveButton}>
            Crear Macroprocesos
          </Link>
        </div>

        {!selectedCompanyId && <p className={styles.muted}>Sin empresa seleccionada.</p>}
      </article>

      <article className={styles.card}>
        <h2>Resumen de configuración</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryBlock}>
            <span>Empresa activa</span>
            <strong>{selectedCompany ? `${selectedCompany.name} (${selectedCompany.code})` : 'Sin selección'}</strong>
          </div>
          <div className={styles.summaryBlock}>
            <span>Macroprocesos seleccionados</span>
            <strong>{selectedCompanyId ? String(selectedRealmIds.length) : '0'}</strong>
          </div>
          <div className={styles.summaryBlock}>
            <span>Estado</span>
            <strong>{configurationStateLabel}</strong>
          </div>
          <div className={styles.summaryBlock}>
            <span>Cambios</span>
            <strong>{hasPendingChanges ? 'Pendientes de guardar' : 'Sin cambios pendientes'}</strong>
          </div>
        </div>
      </article>

      <article className={styles.card}>
        <h2>Catálogo de macroprocesos disponibles</h2>
        {catalogFilter && (
          <p className={styles.info}>
            Filtro activo: "{catalogFilter}" ({visibleRealms.length} resultado{visibleRealms.length === 1 ? '' : 's'})
          </p>
        )}
        {!selectedCompanyId && (
          <p className={styles.muted}>Selecciona una empresa para habilitar la configuración de macroprocesos.</p>
        )}
        {selectedCompanyId && loadingSelection && <p className={styles.info}>Cargando selección actual...</p>}
        {selectedCompanyId && !loadingSelection && (
          <div className={styles.realmGrid}>
            {visibleRealms.map((realm) => {
              const isSelected = selectedSet.has(realm.id);
              return (
                <button
                  key={realm.id}
                  type="button"
                  className={`${styles.realmCard} ${isSelected ? styles.realmCardSelected : ''}`}
                  onClick={() => toggleRealm(realm.id)}
                  disabled={saving}
                  aria-pressed={isSelected}
                >
                  <div className={`${styles.realmStatusDot} ${isSelected ? styles.realmStatusDotOn : styles.realmStatusDotOff}`} aria-hidden />
                  <Link
                    href={`/modelo/gobernanza/company-reino/crear-reino?realmId=${encodeURIComponent(realm.id)}`}
                    className={styles.editRealmButton}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Editar macroproceso ${realm.name}`}
                    title="Editar macroproceso"
                  >
                    <Pencil size={14} />
                  </Link>
                  <div className={styles.realmHeader}>
                    <strong className={isSelected ? styles.realmTitleOn : styles.realmTitleOff}>{realm.name}</strong>
                    <span className={isSelected ? styles.badgeLinked : styles.badgeUnlinked}>
                      {isSelected ? 'Vinculado' : 'No vinculado'}
                    </span>
                  </div>
                  <p className={styles.realmDescription}>{realm.description || 'Sin descripción'}</p>
                </button>
              );
            })}
          </div>
        )}
      </article>

      <article className={styles.card}>
        <h2>Cambios pendientes</h2>
        {!selectedCompanyId && <p className={styles.muted}>No hay empresa en edición.</p>}
        {selectedCompanyId && !hasPendingChanges && (
          <p className={styles.infoStrong}>No existen cambios sin guardar para esta empresa.</p>
        )}
        {selectedCompanyId && hasPendingChanges && (
          <div className={styles.pendingGrid}>
            <div className={styles.pendingBlock}>
              <p className={styles.pendingTitle}>Se asignará</p>
              {pendingAdd.length === 0 ? (
                <p className={styles.muted}>Ningún macroproceso</p>
              ) : (
                <ul className={styles.pendingList}>
                  {pendingAdd.map((realm) => (
                    <li key={realm.id}>{realm.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className={styles.pendingBlock}>
              <p className={styles.pendingTitle}>Se removerá</p>
              {pendingRemove.length === 0 ? (
                <p className={styles.muted}>Ningún macroproceso</p>
              ) : (
                <ul className={styles.pendingList}>
                  {pendingRemove.map((realm) => (
                    <li key={realm.id}>{realm.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </article>

      <div className={styles.actions}>
        <Link href="/score/dashboard" className={styles.closeButton}>
          Cerrar
        </Link>
        <button
          type="button"
          className={`${styles.nextButton} ${styles.nextButtonDisabled}`}
          disabled
          aria-disabled="true"
          title="Deshabilitado permanentemente"
        >
          Siguiente
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={() => void saveConfiguration()}
          disabled={!selectedCompanyId || !hasPendingChanges || loadingSelection || loadingContext || saving}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </section>
  );
}
