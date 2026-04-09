'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Target, 
  Trash2, 
  CheckCircle2,
  CircleDashed,
  Calendar,
  User,
  Zap,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import styles from './ObjectivesRegistry.module.css';

type ObjectiveCategory = 'Estratégico' | 'Operativo' | 'Financiero' | 'Cumplimiento';
type Priority = 'Alta' | 'Media' | 'Baja';

interface Objective {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ObjectiveCategory;
  kpi: string;
  targetDate: string;
  owner: string;
  priority: Priority;
  appetiteCode: string;
  status: 'active' | 'draft';
}

type RiskAppetiteOption = {
  risk_appetite_catalog_id: number;
  appetite_code: string;
  appetite_name: string;
  appetite_description: string | null;
  rationale: string | null;
  appetite_level: number | null;
  min_score: number | null;
  max_score: number | null;
  sequence_order: number | null;
  is_active: boolean;
};

type CompanyOption = {
  id: string;
  name: string;
};

const INITIAL_OBJECTIVES: Objective[] = [
  {
    id: '1',
    code: 'OBJ-STR-001',
    name: 'Reducción de Fragilidad Estructural',
    description: 'Optimizar la resiliencia del grafo de dependencias en el Reino de Pagos.',
    category: 'Estratégico',
    kpi: 'Fragilidad < 0.12',
    targetDate: '2026-12-31',
    owner: 'Auditoría Senior',
    priority: 'Alta',
    appetiteCode: 'MODERATE',
    status: 'active'
  },
  {
    id: '2',
    code: 'OBJ-CMP-002',
    name: 'Trazabilidad de Evidencia Digital',
    description: 'Garantizar que todos los controles de nivel 3 tengan evidencia automatizada.',
    category: 'Cumplimiento',
    kpi: '100% Cobertura',
    targetDate: '2026-06-30',
    owner: 'Compliance Officer',
    priority: 'Media',
    appetiteCode: 'LOW',
    status: 'active'
  }
];

export default function ObjectivesRegistryPage() {
  const [objectives, setObjectives] = useState<Objective[]>(INITIAL_OBJECTIVES);
  const [newTitle, setNewTitle] = useState('');
  const [savingObjectiveId, setSavingObjectiveId] = useState<string | null>(null);
  const [riskAppetites, setRiskAppetites] = useState<RiskAppetiteOption[]>([]);
  const [riskAppetiteError, setRiskAppetiteError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/linear-risk/risk-appetite-catalog');
        if (!res.ok) throw new Error('No se pudo cargar apetito de riesgo');
        const data = (await res.json()) as { data?: RiskAppetiteOption[] };
        if (!isMounted) return;
        setRiskAppetites(data?.data ?? []);
      } catch (err) {
        if (!isMounted) return;
        setRiskAppetiteError(err instanceof Error ? err.message : 'Error cargando apetito');
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadCompaniesAndScope = async () => {
      try {
        const [contextRes, accessRes] = await Promise.all([
          fetch('/api/linear-risk/context', { cache: 'no-store' }),
          fetch('/api/auth/access-context', { cache: 'no-store' }),
        ]);
        if (!isMounted) return;

        const contextData = contextRes.ok
          ? ((await contextRes.json()) as { companies?: CompanyOption[] })
          : { companies: [] };
        const accessData = accessRes.ok
          ? ((await accessRes.json()) as { company?: { id?: string } })
          : { company: {} };

        const options = contextData.companies ?? [];
        setCompanies(options);

        const currentCompanyId = accessData.company?.id ?? '';
        if (currentCompanyId && options.some((c) => c.id === currentCompanyId)) {
          setSelectedCompanyId(currentCompanyId);
          return;
        }
        if (options.length > 0) {
          setSelectedCompanyId(options[0].id);
        }
      } catch {
        // Ignore and keep current defaults.
      }
    };

    loadCompaniesAndScope();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadObjectives = async () => {
      try {
        const query = selectedCompanyId ? `?company_id=${encodeURIComponent(selectedCompanyId)}` : '';
        const res = await fetch(`/api/linear-risk/objectives${query}`, { cache: 'no-store' });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          data?: Array<{
            objective_id: string;
            objective_code: string;
            objective_name: string;
            objective_description: string | null;
            rationale: Record<string, any> | null;
            is_active: boolean;
          }>;
        };
        const rows = payload.data ?? [];
        if (!isMounted) return;

        setObjectives(
          rows.length > 0
            ? rows.map((row) => {
                const rationale = row.rationale ?? {};
                return {
                  id: row.objective_id,
                  code: row.objective_code,
                  name: row.objective_name,
                  description: row.objective_description ?? '',
                  category: (rationale.category as ObjectiveCategory) ?? 'Estratégico',
                  kpi: (rationale.kpi as string) ?? '',
                  targetDate:
                    typeof rationale.targetDate === 'string'
                      ? rationale.targetDate.slice(0, 10)
                      : new Date().toISOString().slice(0, 10),
                  owner: (rationale.owner as string) ?? 'Sin asignar',
                  priority: (rationale.priority as Priority) ?? 'Media',
                  appetiteCode: (rationale.appetite_code as string) ?? 'MODERATE',
                  status: row.is_active ? 'active' : 'draft',
                };
              })
            : []
        );
      } catch {
        // Keep local defaults if API fails.
      }
    };

    if (selectedCompanyId) {
      loadObjectives();
    }
    return () => {
      isMounted = false;
    };
  }, [selectedCompanyId]);

  const handleAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTitle.trim()) {
      const seq = objectives.length + 1;
      const fallbackAppetite = riskAppetites[0]?.appetite_code ?? 'MODERATE';
      const newObj: Objective = {
        id: Math.random().toString(36).substr(2, 9),
        code: `OBJ-${String(seq).padStart(3, '0')}`,
        name: newTitle,
        description: 'Defina la descripción estratégica aquí...',
        category: 'Estratégico',
        kpi: 'Definir métrica',
        targetDate: new Date().toISOString().slice(0, 10),
        owner: 'Sin asignar',
        priority: 'Media',
        appetiteCode: fallbackAppetite,
        status: 'draft'
      };
      setObjectives([newObj, ...objectives]);
      setNewTitle('');
    }
  };

  const updateObjective = (id: string, updates: Partial<Objective>) => {
    setObjectives(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  };

  const deleteObjective = (id: string) => {
    setObjectives(prev => prev.filter(obj => obj.id !== id));
  };

  const saveObjective = async (obj: Objective, sequenceOrder: number) => {
    if (savingObjectiveId) return;
    if (!selectedCompanyId) return;
    setSavingObjectiveId(obj.id);
    try {
      const res = await fetch(`/api/linear-risk/objectives?company_id=${encodeURIComponent(selectedCompanyId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective_code: obj.code,
          objective_name: obj.name,
          objective_description: obj.description,
          rationale: {
            category: obj.category,
            kpi: obj.kpi,
            targetDate: obj.targetDate,
            owner: obj.owner,
            priority: obj.priority,
            appetite_code: obj.appetiteCode,
            status: obj.status,
          },
          sequence_order: sequenceOrder,
          is_active: obj.status === 'active',
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo grabar el objetivo');
      }
    } finally {
      setSavingObjectiveId(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Gestión de Objetivos</h1>
            <p className={styles.subtitle}>
              Diseñe el marco estratégico del negocio. Los objetivos definen los nodos de mayor peso en la simulación de impacto.
            </p>
          </div>
        </div>
      </header>

      <div className={styles.speedAddContainer}>
        <div className={styles.speedAdd}>
          <Plus className={styles.speedAddIcon} size={24} />
          <input 
            type="text" 
            className={styles.speedAddInput}
            placeholder="Escriba el nombre del nuevo objetivo y presione Enter..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleAdd}
          />
        </div>
      </div>

      <div className={styles.scopeRow}>
        <label className={styles.fieldLabel} htmlFor="companyScope">
          Empresa
        </label>
        <select
          id="companyScope"
          className={styles.companySelect}
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
          {companies.length === 0 && <option value="">Sin empresas</option>}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.list}>
        {objectives.length > 0 ? (
          objectives.map((obj, index) => (
            <div key={obj.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>
                  <Target size={32} />
                </div>
                <div className={styles.cardContent}>
                  <input 
                    className={styles.nameInput}
                    value={obj.name}
                    onChange={(e) => updateObjective(obj.id, { name: e.target.value })}
                  />
                  <textarea 
                    className={styles.descriptionInput}
                    value={obj.description}
                    rows={1}
                    onChange={(e) => updateObjective(obj.id, { description: e.target.value })}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                </div>
              </div>

              {/* Grid de Campos Clave */}
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}><Briefcase size={12} /> Categoría</label>
                  <select 
                    className={styles.fieldSelect}
                    value={obj.category}
                    onChange={(e) => updateObjective(obj.id, { category: e.target.value as ObjectiveCategory })}
                  >
                    <option value="Estratégico">Estratégico</option>
                    <option value="Operativo">Operativo</option>
                    <option value="Financiero">Financiero</option>
                    <option value="Cumplimiento">Cumplimiento</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}><TrendingUp size={12} /> Meta / KPI</label>
                  <input 
                    className={styles.fieldInput}
                    value={obj.kpi}
                    onChange={(e) => updateObjective(obj.id, { kpi: e.target.value })}
                    placeholder="Ej: Reducción 15%"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}><Calendar size={12} /> Fecha Límite</label>
                  <input 
                    type="date"
                    className={styles.fieldInput}
                    value={obj.targetDate}
                    onChange={(e) => updateObjective(obj.id, { targetDate: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}><User size={12} /> Responsable</label>
                  <input 
                    className={styles.fieldInput}
                    value={obj.owner}
                    onChange={(e) => updateObjective(obj.id, { owner: e.target.value })}
                    placeholder="Nombre del responsable"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}><Zap size={12} /> Prioridad</label>
                  <select 
                    className={styles.fieldSelect}
                    value={obj.priority}
                    onChange={(e) => updateObjective(obj.id, { priority: e.target.value as Priority })}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}><Target size={12} /> Apetito de riesgo</label>
                  <select
                    className={styles.fieldSelect}
                    value={obj.appetiteCode}
                    onChange={(e) => updateObjective(obj.id, { appetiteCode: e.target.value })}
                    aria-invalid={Boolean(riskAppetiteError)}
                    title={obj.appetiteCode}
                  >
                    {riskAppetites.length === 0 && (
                      <option value={obj.appetiteCode}>{obj.appetiteCode}</option>
                    )}
                    {riskAppetites.map((app) => (
                      <option key={app.risk_appetite_catalog_id} value={app.appetite_code}>
                        {`${app.appetite_name} (${app.min_score ?? 0}–${app.max_score ?? 0})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.cardActions}>
                <div 
                  className={`${styles.statusToggle} ${obj.status === 'draft' ? styles.draft : ''}`}
                  onClick={() => updateObjective(obj.id, { status: obj.status === 'active' ? 'draft' : 'active' })}
                >
                  {obj.status === 'active' ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
                  {obj.status === 'active' ? 'Activo y Visible' : 'Borrador'}
                </div>
                <button
                  className={styles.saveCardButton}
                  disabled={savingObjectiveId === obj.id}
                  onClick={() => saveObjective(obj, index + 1)}
                >
                  {savingObjectiveId === obj.id ? 'Grabando...' : 'Grabar'}
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={() => deleteObjective(obj.id)}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Target className={styles.emptyIcon} />
            <h2 style={{ fontSize: '2rem', color: '#f8fafc' }}>Sin rumbos definidos</h2>
            <p style={{ color: '#94a3b8', maxWidth: '400px' }}>
              La organización necesita metas claras para cuantificar el riesgo estructural. Cree su primer objetivo arriba.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
