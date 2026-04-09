"use client";

import { useEffect, useState } from 'react';
import styles from './RiskDashboardPage.module.css';

type RiskDashboardSummary = {
  reino_count: number;
  domain_count: number;
  element_count: number;
  risk_count: number;
  control_count: number;
  reino_domain_map_count: number;
  domain_element_map_count: number;
  obligation_graph_count: number;
  element_risk_map_count: number;
  element_control_map_count: number;
  risk_control_map_count: number;
  significant_activity_count: number;
};

function safeDivide(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return numerator / denominator;
}

function formatRatio(value: number) {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

export default function RiskDashboardPage() {
  const [summary, setSummary] = useState<RiskDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch('/api/dashboard/riesgo', { method: 'GET', cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo cargar el resumen de riesgo');
        const payload = (await response.json()) as { data: RiskDashboardSummary };
        if (!alive) return;
        setSummary(payload.data);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Error cargando resumen');
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={styles.content}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>Centro Ejecutivo de Riesgo</h1>
            <p className={styles.heroSub}>
              Lectura estratégica del corpus regulatorio, trazabilidad y densidad sistémica con foco ejecutivo.
            </p>
            <div className={styles.heroSignal}>
              Estado general: cobertura sólida, densidad alta en dominios críticos.
            </div>
          </div>
        </div>

        <div className={styles.kpiRow}>
          <div className={styles.cardEmphasis}>
            <div className={styles.cardTitle}>Reinos Activos</div>
            <div className={styles.cardValue}>{summary?.reino_count ?? '—'}</div>
            <div className={styles.cardMeta}>Cobertura macro-regulatoria</div>
          </div>
          <div className={styles.cardEmphasis}>
            <div className={styles.cardTitle}>Dominios Estratégicos</div>
            <div className={styles.cardValue}>{summary?.domain_count ?? '—'}</div>
            <div className={styles.cardMeta}>Mapa de cumplimiento esencial</div>
          </div>
          <div className={styles.cardEmphasis}>
            <div className={styles.cardTitle}>Elementos Críticos</div>
            <div className={styles.cardValue}>{summary?.element_count ?? '—'}</div>
            <div className={styles.cardMeta}>Núcleo operativo controlable</div>
          </div>
        </div>

        <div className={styles.kpiSecondary}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Riesgos Catalogados</div>
            <div className={styles.cardValue}>{summary?.risk_count ?? '—'}</div>
            <div className={styles.cardMeta}>Inventario vivo de exposición</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Controles Vigentes</div>
            <div className={styles.cardValue}>{summary?.control_count ?? '—'}</div>
            <div className={styles.cardMeta}>Mitigación estructural activa</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Arquitectura de trazabilidad</div>
          <div className={styles.relationGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Trazabilidad Macro</div>
              <div className={styles.cardValue}>{summary?.reino_domain_map_count ?? '—'}</div>
              <div className={styles.cardMeta}>Reino → Dominio</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Descomposición de Dominio</div>
              <div className={styles.cardValue}>{summary?.domain_element_map_count ?? '—'}</div>
              <div className={styles.cardMeta}>Dominio → Elemento</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Exposición por Elemento</div>
              <div className={styles.cardValue}>{summary?.element_risk_map_count ?? '—'}</div>
              <div className={styles.cardMeta}>Elemento → Riesgo</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Cobertura Directa</div>
              <div className={styles.cardValue}>{summary?.element_control_map_count ?? '—'}</div>
              <div className={styles.cardMeta}>Elemento → Control</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Mitigación Estructural</div>
              <div className={styles.cardValue}>{summary?.risk_control_map_count ?? '—'}</div>
              <div className={styles.cardMeta}>Riesgo → Control</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Núcleo de Obligaciones</div>
              <div className={styles.cardValue}>{summary?.obligation_graph_count ?? '—'}</div>
              <div className={styles.cardMeta}>Obligation Graph</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Densidad y cobertura sistémica</div>
          <div className={styles.densityGrid}>
            <div className={styles.signalCard}>
              <div className={styles.cardTitle}>Elementos por Dominio</div>
              <div className={styles.signalValue}>{summary ? formatRatio(safeDivide(summary.element_count, summary.domain_count)) : '—'}</div>
              <div className={styles.signalTag}>Densidad</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.cardTitle}>Riesgos por Elemento</div>
              <div className={styles.signalValue}>{summary ? formatRatio(safeDivide(summary.risk_count, summary.element_count)) : '—'}</div>
              <div className={styles.signalTag}>Exposición</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.cardTitle}>Controles por Riesgo</div>
              <div className={styles.signalValue}>{summary ? formatRatio(safeDivide(summary.control_count, summary.risk_count)) : '—'}</div>
              <div className={styles.signalTag}>Mitigación</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.cardTitle}>Cobertura de Mapeo</div>
              <div className={styles.signalValue}>{summary ? formatRatio(safeDivide(summary.element_control_map_count, summary.element_count)) : '—'}</div>
              <div className={styles.signalTag}>Cobertura</div>
            </div>
          </div>
        </div>

        <div className={styles.executivePanel}>
          <div className={styles.executiveCopy}>
            <div className={styles.sectionTitle}>Lectura ejecutiva</div>
            <p className={styles.executiveText}>
              El corpus mantiene trazabilidad sólida con alta densidad en elementos críticos. La cobertura de control
              sostiene el balance de mitigación, pero la concentración en dominios clave exige vigilancia continua y
              priorización de nodos con baja redundancia.
            </p>
          </div>
          <div className={styles.placeholder}>
            Espacio reservado para mapa estructural o distribución de concentración.
          </div>
        </div>

        {error && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Resumen</div>
            <div className={styles.cardValue}>Error</div>
            <div className={styles.sidebarTitle}>{error}</div>
          </div>
        )}
    </div>
  );
}
