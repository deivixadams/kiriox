'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Network, ShieldCheck, SlidersHorizontal, Target, Layers3, FlaskConical, Play } from 'lucide-react';
import WizardShell from '@/app/validacion/auditorias/nueva/_components/WizardShell';
import styles from './ScoreWizardClient.module.css';

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Contexto y marco',
  'Alcance real',
  'Perfil de ponderación',
  'Evaluación 3D',
  'Evidencia / Pruebas',
  'Motor y resultado',
  'Simulación'
];

const MOCK = {
  context: {
    jurisdiccion: 'República Dominicana',
    marco: 'Ley 155-17 (AML/CFT)',
    version: 'v1',
    empresa: 'Banco Alpha',
    periodo: '2024-01-01 → 2024-12-31'
  },
  scope: {
    criterio: 'Top 20% por criticidad + recurrencia',
    dominios: ['Gobierno AML', 'Monitoreo y Alertas', 'Debida Diligencia'],
    obligaciones: ['O-AML-021', 'O-AML-033', 'O-AML-044', 'O-AML-052'],
    riesgos: ['R-AML-007', 'R-AML-012', 'R-AML-019'],
    controles: ['C-MON-003', 'C-KYC-011', 'C-GOV-005']
  },
  weights: {
    perfil: 'Perfil Sectorial AML – RD v1',
    parametros: { alpha: 0.25, beta: 0.35, gamma: 1.4 },
    gatillos: ['No Oficial AML', 'No reporte ROS', 'KYC inexistente']
  },
  matrix: [
    { obligacion: 'O-AML-021', existencia: 'Sí', formalizacion: 'Medio', funcionamiento: 'Bajo' },
    { obligacion: 'O-AML-033', existencia: 'Sí', formalizacion: 'Alto', funcionamiento: 'Medio' },
    { obligacion: 'O-AML-044', existencia: 'Sí', formalizacion: 'Medio', funcionamiento: 'Medio' },
    { obligacion: 'O-AML-052', existencia: 'No', formalizacion: 'Bloqueado', funcionamiento: 'Bloqueado' }
  ],
  evidence: [
    { control: 'C-MON-003', evidencia: 'Log monitoreo Q4', estado: 'Vigente' },
    { control: 'C-KYC-011', evidencia: 'Política KYC v3', estado: 'Vigente' },
    { control: 'C-GOV-005', evidencia: 'Acta Comité AML', estado: 'Vencida' }
  ],
  engine: {
    base: 0.38,
    concentracion: 0.52,
    interdependencia: 0.61,
    gatillos: 'Activado: KYC inexistente',
    score: 74.2
  },
  simulation: [
    { accion: 'Eliminar C-KYC-011', impacto: '+11.5 puntos de exposición' },
    { accion: 'Reforzar C-MON-003', impacto: '-6.2 puntos de exposición' },
    { accion: 'Actualizar evidencia C-GOV-005', impacto: '-2.1 puntos de exposición' }
  ]
};

export default function ScoreWizardClient() {
  const [step, setStep] = useState(1);
  const headerItems = useMemo(() => ([
    { label: 'Jurisdiccion', value: MOCK.context.jurisdiccion },
    { label: 'Marco', value: MOCK.context.marco },
    { label: 'Version', value: MOCK.context.version }
  ]), []);

  const title = STEP_TITLES[step - 1] || 'Wizard';

  return (
    <WizardShell
      title={title}
      subtitle="Score"
      step={step}
      totalSteps={TOTAL_STEPS}
      headerItems={headerItems}
    >
      <div className={styles.root}>
        {step === 1 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Contexto y marco</h2>
              <p className={styles.subtitle}>Define el universo normativo y la ventana de evaluación.</p>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <span className={styles.label}>Empresa</span>
                <span className={styles.value}>{MOCK.context.empresa}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Periodo</span>
                <span className={styles.value}>{MOCK.context.periodo}</span>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Alcance real (Top 20%)</h2>
              <p className={styles.subtitle}>Selecciona el universo crítico que entra al score.</p>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Criterio</span>
              <span className={styles.value}>{MOCK.scope.criterio}</span>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <span className={styles.label}>Dominios</span>
                <div className={styles.list}>
                  {MOCK.scope.dominios.map((item) => (
                    <div key={item} className={styles.pill}><Layers3 size={14} />{item}</div>
                  ))}
                </div>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Obligaciones</span>
                <div className={styles.list}>
                  {MOCK.scope.obligaciones.map((item) => (
                    <div key={item} className={styles.pill}><Target size={14} />{item}</div>
                  ))}
                </div>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Riesgos</span>
                <div className={styles.list}>
                  {MOCK.scope.riesgos.map((item) => (
                    <div key={item} className={styles.pill}><ShieldCheck size={14} />{item}</div>
                  ))}
                </div>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Controles</span>
                <div className={styles.list}>
                  {MOCK.scope.controles.map((item) => (
                    <div key={item} className={styles.pill}><CheckCircle2 size={14} />{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Perfil de ponderación</h2>
              <p className={styles.subtitle}>Pesos Wi y parámetros del motor (α, β, γ).</p>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Perfil activo</span>
              <span className={styles.value}>{MOCK.weights.perfil}</span>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <span className={styles.label}>Parámetros</span>
                <span className={styles.value}>α {MOCK.weights.parametros.alpha} · β {MOCK.weights.parametros.beta} · γ {MOCK.weights.parametros.gamma}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Gatillos</span>
                <div className={styles.list}>
                  {MOCK.weights.gatillos.map((item) => (
                    <div key={item} className={styles.row}><span className={styles.rowStrong}>{item}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Evaluación 3D</h2>
              <p className={styles.subtitle}>Existencia, formalización y funcionamiento por obligación.</p>
            </div>
            <div className={styles.list}>
              {MOCK.matrix.map((row) => (
                <div key={row.obligacion} className={styles.row}>
                  <span className={styles.rowStrong}>{row.obligacion}</span>
                  <span>Existencia: {row.existencia}</span>
                  <span>Formalización: {row.formalizacion}</span>
                  <span>Funcionamiento: {row.funcionamiento}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Evidencia / Pruebas</h2>
              <p className={styles.subtitle}>Estado y vigencia de evidencia crítica por control.</p>
            </div>
            <div className={styles.list}>
              {MOCK.evidence.map((row) => (
                <div key={row.control} className={styles.row}>
                  <span className={styles.rowStrong}>{row.control}</span>
                  <span>{row.evidencia}</span>
                  <span>{row.estado}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Motor y resultado</h2>
              <p className={styles.subtitle}>Exposición base, concentración, interdependencia y score.</p>
            </div>
            <div className={styles.grid}>
              <div className={styles.card}>
                <span className={styles.label}>Exposición base</span>
                <span className={styles.value}>{MOCK.engine.base}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Concentración</span>
                <span className={styles.value}>{MOCK.engine.concentracion}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Interdependencia</span>
                <span className={styles.value}>{MOCK.engine.interdependencia}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Gatillos</span>
                <span className={styles.value}>{MOCK.engine.gatillos}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Score final</span>
                <span className={styles.value}>{MOCK.engine.score}%</span>
              </div>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Simulación (grafo completo)</h2>
              <p className={styles.subtitle}>Impacto al remover o reforzar controles críticos.</p>
            </div>
            <div className={styles.list}>
              {MOCK.simulation.map((row) => (
                <div key={row.accion} className={styles.row}>
                  <span className={styles.rowStrong}>{row.accion}</span>
                  <span>{row.impacto}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <button className={styles.backButton} onClick={() => setStep((s) => Math.max(1, s - 1))}>Volver</button>
            <button className={styles.ghostButton} onClick={() => {}}>Guardar</button>
            <button
              className={styles.primaryButton}
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={step === TOTAL_STEPS}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
