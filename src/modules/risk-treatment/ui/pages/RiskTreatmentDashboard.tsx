"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, FileText, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { RiskDetailDrawer } from '../components/RiskDetailDrawer';
import styles from './RiskTreatmentDashboard.module.css';

type CompanyOption = { id: string; name: string; };
type ReinoOption = { id: string; name: string; };
type ProcessOption = { id: string; name: string; };

type RiskItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  risk_type: string;
  probability_name: string | null;
  impact_name: string | null;
};

export function RiskTreatmentDashboard() {
  const searchParams = useSearchParams();
  
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [reinos, setReinos] = useState<ReinoOption[]>([]);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState(searchParams.get('companyId') || '');
  const [selectedReinoId, setSelectedReinoId] = useState(searchParams.get('reinoId') || '');
  const [selectedProcessId, setSelectedProcessId] = useState(searchParams.get('processId') || '');
  
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);

  // Load initial companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch('/api/governance/company-realm/assignment');
        if (res.ok) {
          const data = await res.json();
          setCompanies(data.companies || []);
          if (!selectedCompanyId && data.companies?.[0]) {
            setSelectedCompanyId(data.companies[0].id);
          }
        }
      } catch (err) { console.error(err); }
    }
    loadCompanies();
  }, []);

  // Load reinos when company changes
  useEffect(() => {
    async function loadReinos() {
      if (!selectedCompanyId) { setReinos([]); return; }
      try {
        const res = await fetch(`/api/governance/reino-catalog?companyId=${selectedCompanyId}`);
        if (res.ok) {
          const data = await res.json();
          setReinos(data.items || []);
          if (!data.items?.some((r: any) => r.id === selectedReinoId)) {
            setSelectedReinoId(data.items?.[0]?.id || '');
          }
        }
      } catch (err) { console.error(err); }
    }
    loadReinos();
  }, [selectedCompanyId]);

  // Load processes when reino changes
  useEffect(() => {
    async function loadProcesses() {
      if (!selectedReinoId || !selectedCompanyId) { setProcesses([]); return; }
      try {
        const res = await fetch(`/api/governance/process-catalog?reinoId=${selectedReinoId}&companyId=${selectedCompanyId}`);
        if (res.ok) {
          const data = await res.json();
          setProcesses(data.items || []);
          if (!data.items?.some((p: any) => p.id === selectedProcessId)) {
            setSelectedProcessId(data.items?.[0]?.id || '');
          }
        }
      } catch (err) { console.error(err); }
    }
    loadProcesses();
  }, [selectedReinoId, selectedCompanyId]);

  // Load risks when process changes
  useEffect(() => {
    async function loadRisks() {
      if (!selectedProcessId || !selectedCompanyId) { setRisks([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/risk-treatment/risks?processId=${selectedProcessId}&companyId=${selectedCompanyId}`);
        if (res.ok) {
          const data = await res.json();
          setRisks(data.items || []);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadRisks();
  }, [selectedProcessId, selectedCompanyId]);

  const filteredRisks = risks.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Tratamiento de Riesgos</h1>
          <p>Gestión operativa y planes de acción para la mitigación de riesgos.</p>
        </div>
      </header>

      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label>Empresa</label>
          <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Macroproceso</label>
          <select value={selectedReinoId} onChange={(e) => setSelectedReinoId(e.target.value)}>
            <option value="">Seleccione...</option>
            {reinos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Proceso</label>
          <select value={selectedProcessId} onChange={(e) => setSelectedProcessId(e.target.value)}>
            <option value="">Seleccione...</option>
            {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar riesgo por nombre o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <main className={styles.gridSection}>
        {loading ? (
          <div className={styles.loading}>Cargando riesgos...</div>
        ) : filteredRisks.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <p>No se encontraron riesgos para el proceso seleccionado.</p>
          </div>
        ) : (
          <div className={styles.riskGrid}>
            {filteredRisks.map(risk => (
              <div key={risk.id} className={styles.riskCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.riskBadges}>
                    {risk.probability_name && <span className={styles.badge}>{risk.probability_name}</span>}
                    {risk.impact_name && <span className={styles.badge}>{risk.impact_name}</span>}
                  </div>
                </div>
                <h3>{risk.name}</h3>
                <p className={styles.description}>{risk.description}</p>
                <div className={styles.cardFooter}>
                  <button className={styles.treatmentBtn} onClick={() => setSelectedRisk(risk)}>
                    <Plus size={16} />
                    Ver Tratamientos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <RiskDetailDrawer 
        risk={selectedRisk} 
        onClose={() => setSelectedRisk(null)} 
      />
    </div>
  );
}
