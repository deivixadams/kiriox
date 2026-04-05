'use client';

import React from 'react';
import styles from './SimulationGovernancePanel.module.css';
import { Database, Eye, Zap, ArrowRight, Table } from 'lucide-react';

export default function SimulationGovernancePanel() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.mainHeader}>
        <Database size={20} className={styles.headerIcon} />
        <h2 className={styles.mainTitle}>Gobernanza de Datos y Metodología</h2>
      </div>

      <div className={styles.content}>
        {/* Bloque 2: Origen de datos */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Table size={16} />
            <h3>Bloque 2. Origen de datos</h3>
          </div>
          <div className={styles.card}>
            <ul className={styles.tableList}>
              <li>core.reino</li>
              <li>core.domain</li>
              <li>core.domain_elements</li>
              <li>core.risk</li>
              <li>core.control</li>
              <li>core.map_reino_domain</li>
              <li>core.map_domain_element</li>
              <li>core.map_elements_risk</li>
              <li>core.map_elements_control</li>
              <li>core.map_risk_control</li>
              <li>core.obligation_graph</li>
            </ul>
            <p className={styles.textQuote}>
              "El grafo se construye a partir de las tablas reales del core del sistema, preservando relaciones estructurales entre elementos, riesgos y controles."
            </p>
          </div>
        </section>

        {/* Bloque 3: Vistas que alimentan el grafo */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Eye size={16} />
            <h3>Bloque 3. Vistas que alimentan el grafo</h3>
          </div>
          <div className={styles.viewGrid}>
            <div className={styles.viewItem}>
              <div className={styles.viewTitle}>_v_graph_nodes_master</div>
              <div className={styles.viewDesc}>
                Define el universo completo de nodos: REINO, DOMAIN, ELEMENT, RISK y CONTROL.
                Incluye atributos estructurales como criticidad, hard gates, dependency roots y peso estructural.
              </div>
            </div>
            <div className={styles.viewItem}>
              <div className={styles.viewTitle}>_v_graph_edges_master</div>
              <div className={styles.viewDesc}>
                Define todas las relaciones estructurales reales del sistema: DOMAIN → ELEMENT, ELEMENT → RISK, ELEMENT → CONTROL, RISK → CONTROL.
                Incluye pesos, reglas de dependencia, multiplicadores de propagación y triggers de colapso.
              </div>
            </div>
            <div className={styles.viewItem}>
              <div className={styles.viewTitle}>_v_graph_super</div>
              <div className={styles.viewDesc}>
                Vista enriquecida que une nodos y aristas con todos sus metadatos, permitiendo consultas directas sin joins manuales.
              </div>
            </div>
            <div className={styles.metricsBox}>
              <span className={styles.metricsTitle}>Métricas estructurales</span>
              <div className={styles.metricList}>
                <code>_v_graph_node_degree</code>
                <code>_v_graph_node_redundancy</code>
                <code>_v_graph_paths</code>
                <code>_v_graph_failure_impact</code>
              </div>
            </div>
          </div>
        </section>

        {/* Bloque 4: Cómo se usa en la simulación */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Zap size={16} />
            <h3>Bloque 4. Cómo se usa en la simulación</h3>
          </div>
          <div className={styles.logicCard}>
            <p className={styles.logicEmphasize}>"La simulación no inventa relaciones. Opera directamente sobre este grafo."</p>
            <div className={styles.steps}>
              <div className={styles.step}><ArrowRight size={14} /> degrada nodos de tipo CONTROL</div>
              <div className={styles.step}><ArrowRight size={14} /> recalcula impacto en nodos RISK y ELEMENT</div>
              <div className={styles.step}><ArrowRight size={14} /> propaga efectos a través de paths reales</div>
              <div className={styles.step}><ArrowRight size={14} /> aplica reglas de concentración y gatillos</div>
              <div className={styles.step}><ArrowRight size={14} /> recalcula la exposición estructural total</div>
            </div>
            <p className={styles.textNote}>
              El comportamiento observado corresponde al sistema real modelado, no a una abstracción simplificada.
            </p>
          </div>
        </section>

        {/* Bloque 5: Integración en el flujo */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <ArrowRight size={16} />
            <h3>Bloque 5. Integración en el flujo (Lifecycle)</h3>
          </div>
          <div className={styles.flowGrid}>
            <div className={styles.flowItem}>
              <span className={styles.flowLabel}>Antes</span>
              <p>Renderizado desde <code>_v_graph_super</code></p>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowLabel}>Durante</span>
              <p>Degradación sobre CONTROLES; propagación vía <code>_v_graph_paths</code></p>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowLabel}>Después</span>
              <p>Resultados reflejan conectividad, dependencias y rutas reales del grafo</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
