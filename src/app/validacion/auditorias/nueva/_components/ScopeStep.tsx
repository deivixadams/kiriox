'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, ShieldCheck } from 'lucide-react';
import styles from './ScopeStep.module.css';

type Domain = { id: string; name: string; code?: string };

type Obligation = { id: string; title: string; code?: string; domainId?: string };

type DerivedCounts = {
  obligationCount: number;
  riskCount: number;
  controlCount: number;
  testCount: number;
};

type ScopeStepProps = {
  domainIds: string[];
  obligationIds: string[];
  derivedCounts: DerivedCounts;
  onChange: (next: { domainIds: string[]; obligationIds: string[]; derivedCounts: DerivedCounts }) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const defaultCounts: DerivedCounts = { obligationCount: 0, riskCount: 0, controlCount: 0, testCount: 0 };

export default function ScopeStep({ domainIds, obligationIds, derivedCounts, onChange, onBack, onNext, onSave }: ScopeStepProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [mode, setMode] = useState<'all' | 'subset'>('all');

  useEffect(() => {
    const loadDomains = async () => {
      const res = await fetch('/api/audit/catalog/domains');
      if (!res.ok) return;
      const data = await res.json();
      setDomains(data || []);
    };
    loadDomains();
  }, []);

  useEffect(() => {
    if (domainIds.length === 0) {
      setObligations([]);
      return;
    }

    const loadObligations = async () => {
      const query = domainIds.map((id) => `domain_id=${encodeURIComponent(id)}`).join('&');
      const res = await fetch(`/api/audit/catalog/obligations?${query}`);
      if (!res.ok) return;
      const data = await res.json();
      setObligations(data || []);
    };
    loadObligations();
  }, [domainIds]);

  useEffect(() => {
    const derive = async () => {
      const res = await fetch('/api/audit/derive-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainIds, obligationIds: mode === 'subset' ? obligationIds : [] })
      });
      if (!res.ok) return;
      const data = await res.json();
      onChange({ domainIds, obligationIds, derivedCounts: data });
    };

    derive();
  }, [domainIds, obligationIds, mode, onChange]);

  const obligationsVisible = useMemo(() => {
    if (mode === 'all') return [];
    return obligations;
  }, [mode, obligations]);

  const toggleDomain = (id: string) => {
    const next = domainIds.includes(id)
      ? domainIds.filter((d) => d !== id)
      : [...domainIds, id];
    onChange({ domainIds: next, obligationIds: [], derivedCounts: derivedCounts ?? defaultCounts });
  };

  const toggleObligation = (id: string) => {
    const next = obligationIds.includes(id)
      ? obligationIds.filter((o) => o !== id)
      : [...obligationIds, id];
    onChange({ domainIds, obligationIds: next, derivedCounts: derivedCounts ?? defaultCounts });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Alcance regulatorio</h2>
        <p className={styles.subtitle}>Selecciona dominios y obligaciones para estimar riesgos, controles y pruebas.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <Layers3 className={styles.cardIcon} /> Dominios
          </div>
          <div className={styles.scrollList}>
            {domains.map((domain) => (
              <label key={domain.id} className={styles.optionRow}>
                <input
                  type="checkbox"
                  checked={domainIds.includes(domain.id)}
                  onChange={() => toggleDomain(domain.id)}
                />
                {domain.name}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleSimple}>Obligaciones</div>
            <div className={styles.toggleGroup}>
              <label className={styles.toggleOption}>
                <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} />
                Todas
              </label>
              <label className={styles.toggleOption}>
                <input type="radio" checked={mode === 'subset'} onChange={() => setMode('subset')} />
                Subset
              </label>
            </div>
          </div>
          {mode === 'subset' && (
            <div className={styles.scrollList}>
              {obligationsVisible.map((obl) => (
                <label key={obl.id} className={styles.optionRow}>
                  <input
                    type="checkbox"
                    checked={obligationIds.includes(obl.id)}
                    onChange={() => toggleObligation(obl.id)}
                  />
                  {obl.title}
                </label>
              ))}
            </div>
          )}
          {mode === 'all' && (
            <p className={styles.helperText}>Se incluyen todas las obligaciones de los dominios seleccionados.</p>
          )}
        </div>

        <div className={styles.cardHighlight}>
          <div className={styles.cardTitle}>
            <ShieldCheck className={styles.cardIconAccent} /> Alcance derivado
          </div>
          <div className={styles.counts}>
            <div>Obligaciones: <strong>{derivedCounts.obligationCount}</strong></div>
            <div>Riesgos: <strong>{derivedCounts.riskCount}</strong></div>
            <div>Controles: <strong>{derivedCounts.controlCount}</strong></div>
            <div>Pruebas: <strong>{derivedCounts.testCount}</strong></div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.backButton} onClick={onBack}>Volver</button>
        <div className={styles.footerActions}>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
