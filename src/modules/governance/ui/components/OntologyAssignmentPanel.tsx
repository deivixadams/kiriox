"use client";

import { useEffect, useMemo, useState } from 'react';
import styles from './OntologyAssignmentPanel.module.css';

type CompanyOption = {
  id: string;
  code: string;
  name: string;
};

type OntologyOption = {
  id: string;
  code: string;
  name: string;
  description: string;
  selection: Record<string, unknown>;
  sortOrder: number;
};

type Assignment = {
  companyId: string;
  ontologyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ContextPayload = {
  companies: CompanyOption[];
  ontologies: OntologyOption[];
  assignments: Assignment[];
};

export function OntologyAssignmentPanel() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [ontologies, setOntologies] = useState<OntologyOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedOntologyId, setSelectedOntologyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadContext() {
      setLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      try {
        const response = await fetch('/api/governance/ontology/assignment', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración de ontologías');
        }

        const payload = (await response.json()) as ContextPayload;
        setCompanies(payload.companies);
        setOntologies(payload.ontologies);
        setAssignments(payload.assignments);
      } catch (error: any) {
        setErrorMessage(error?.message || 'No se pudo cargar la configuración de ontologías');
      } finally {
        setLoading(false);
      }
    }

    void loadContext();
  }, []);

  const assignmentByCompany = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const assignment of assignments) {
      if (assignment.isActive) map.set(assignment.companyId, assignment);
    }
    return map;
  }, [assignments]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const selectedOntology = useMemo(
    () => ontologies.find((ontology) => ontology.id === selectedOntologyId) ?? null,
    [ontologies, selectedOntologyId]
  );

  const currentAssignment = useMemo(
    () => (selectedCompanyId ? assignmentByCompany.get(selectedCompanyId) ?? null : null),
    [assignmentByCompany, selectedCompanyId]
  );

  const currentOntology = useMemo(
    () => (currentAssignment ? ontologies.find((ontology) => ontology.id === currentAssignment.ontologyId) ?? null : null),
    [currentAssignment, ontologies]
  );

  function handleCompanyChange(companyId: string) {
    setSelectedCompanyId(companyId);
    setSuccessMessage('');
    setErrorMessage('');

    const existing = assignmentByCompany.get(companyId);
    setSelectedOntologyId(existing?.ontologyId ?? '');
  }

  async function saveAssignment() {
    if (!selectedCompanyId || !selectedOntologyId) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/governance/ontology/assignment', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          ontologyId: selectedOntologyId,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo guardar la asignación');
      }

      const nextAssignment = payload.assignment as Assignment;
      setAssignments((previous) => {
        const filtered = previous.filter((item) => item.companyId !== nextAssignment.companyId);
        return [nextAssignment, ...filtered];
      });

      setSuccessMessage('Asignación guardada correctamente.');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Error al guardar la asignación');
    } finally {
      setSaving(false);
    }
  }

  const selectionSummary = useMemo(() => {
    if (!selectedCompany || !selectedOntology) return null;
    return `${selectedCompany.name} (${selectedCompany.code}) -> ${selectedOntology.name}`;
  }, [selectedCompany, selectedOntology]);

  const companyOntologyGrid = useMemo(() => {
    return companies.map((company) => {
      const assignment = assignmentByCompany.get(company.id) ?? null;
      const ontology = assignment
        ? ontologies.find((item) => item.id === assignment.ontologyId) ?? null
        : null;

      return {
        company,
        ontology,
        assignedAt: assignment?.updatedAt ?? assignment?.createdAt ?? null,
      };
    });
  }, [companies, assignmentByCompany, ontologies]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Gobierno</p>
        <h1 className={styles.title}>Asignación de Ontología</h1>
        <p className={styles.subtitle}>
          Selecciona una empresa activa, revisa la ontología vigente y confirma una única ontología activa por empresa.
        </p>
      </header>

      {loading && <div className={styles.info}>Cargando empresas y ontologías...</div>}
      {successMessage && <div className={styles.success}>{successMessage}</div>}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Empresa</h2>
          <select
            className={styles.select}
            value={selectedCompanyId}
            onChange={(event) => handleCompanyChange(event.target.value)}
            disabled={loading || saving}
          >
            <option value="">Selecciona una empresa activa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.code})
              </option>
            ))}
          </select>

          {!selectedCompanyId && <p className={styles.muted}>Sin empresa seleccionada.</p>}
          {selectedCompanyId && !currentOntology && (
            <p className={styles.warning}>La empresa seleccionada no tiene ontología asignada.</p>
          )}
          {selectedCompanyId && currentOntology && (
            <p className={styles.infoStrong}>
              Asignación actual: <strong>{currentOntology.name}</strong>
            </p>
          )}
        </article>

        <article className={styles.card}>
          <h2>Ontología</h2>
          <select
            className={styles.select}
            value={selectedOntologyId}
            onChange={(event) => setSelectedOntologyId(event.target.value)}
            disabled={loading || saving || !selectedCompanyId}
          >
            <option value="">Selecciona una ontología activa</option>
            {ontologies.map((ontology) => (
              <option key={ontology.id} value={ontology.id}>
                {ontology.name}
              </option>
            ))}
          </select>

          {selectedCompanyId && !selectedOntologyId && (
            <p className={styles.muted}>Selecciona una ontología para continuar.</p>
          )}

          {selectionSummary && (
            <div className={styles.summary}>
              <p>Confirmación:</p>
              <strong>{selectionSummary}</strong>
            </div>
          )}

          <button
            className={styles.button}
            disabled={saving || loading || !selectedCompanyId || !selectedOntologyId}
            onClick={() => void saveAssignment()}
          >
            {saving ? 'Guardando...' : 'Guardar asignación'}
          </button>
        </article>
      </div>

      <article className={styles.card}>
        <h2>Detalle de ontología seleccionada</h2>

        {!selectedOntology && <p className={styles.muted}>No hay ontología seleccionada.</p>}

        {selectedOntology && (
          <div className={styles.detailGrid}>
            <p><strong>Nombre:</strong> {selectedOntology.name}</p>
            <p><strong>Descripción:</strong> {selectedOntology.description || 'Sin descripción'}</p>
          </div>
        )}
      </article>

      <article className={styles.card}>
        <h2>Empresas y ontologías asignadas</h2>
        <div className={styles.assignmentTableWrapper}>
          <table className={styles.assignmentTable}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Ontología asignada</th>
                <th>Detalle / significado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {companyOntologyGrid.map((row) => (
                <tr key={row.company.id}>
                  <td>
                    <div className={styles.companyCell}>
                      <strong>{row.company.name}</strong>
                      <span>{row.company.code}</span>
                    </div>
                  </td>
                  <td>{row.ontology?.name ?? 'Sin ontología asignada'}</td>
                  <td>{row.ontology?.description || 'Sin detalle de ontología'}</td>
                  <td>
                    {row.assignedAt ? new Date(row.assignedAt).toLocaleString() : 'Sin cambios'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
