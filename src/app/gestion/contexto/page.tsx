'use client';

import React, { useState } from 'react';
import {
  Shield,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  ChevronRight,
  Globe,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  Target,
  Building2,
  FileText,
  BookOpen,
  LayoutGrid,
  Layers,
  Settings2,
  FileCheck2,
  GanttChartSquare,
  Edit2,
} from 'lucide-react';

// No tabs needed, single view consolidated

// ──────────────────────────────────────────────────────
// Mock data for Contexto
// ──────────────────────────────────────────────────────
const CONTEXTO_DATA = {
  'Marco regulatorio general': {
    icon: <BookOpen size={18} />,
    value: 'Indique requisitos legales y regulatorios que condicionan la evaluación (obligaciones, límites de cumplimiento y sanciones aplicables).',
    color: '#3b82f6',
  },
  'Modelo de negocio': {
    icon: <LayoutGrid size={18} />,
    value: 'Describa actividades, productos, partes interesadas y cadena de valor que serán consideradas dentro del contexto de riesgo.',
    color: '#10b981',
  },
  'Objetivos estratégicos': {
    icon: <Target size={18} />,
    value: 'Defina objetivos de negocio afectados y qué decisiones debe soportar la evaluación de riesgos (priorizar, mitigar, aceptar o transferir).',
    color: '#f59e0b',
  },
  'Estructura de gobierno': {
    icon: <Building2 size={18} />,
    value: 'Especifique dueños del riesgo, responsables de controles y autoridades de aprobación, incluyendo roles y responsabilidades.',
    color: '#ef4444',
  },
  'Procesos o áreas principales': {
    icon: <Layers size={18} />,
    value: 'Delimite alcance y fronteras del análisis: procesos, interfaces, dependencias, entradas/salidas y exclusiones del estudio.',
    color: '#8b5cf6',
  },
  'Capacidades y recursos clave': {
    icon: <TrendingUp size={18} />,
    value: 'Detalle recursos, competencias y calidad de datos disponibles para la evaluación, indicando brechas de información e incertidumbre.',
    color: '#06b6d4',
  },
  'Políticas y normas base': {
    icon: <FileCheck2 size={18} />,
    value: 'Registre políticas, procedimientos y controles existentes que servirán como base para identificar causas, eventos y consecuencias.',
    color: '#f43f5e',
  },
  'Criterios corporativos de riesgo': {
    icon: <Settings2 size={18} />,
    value: 'Defina criterios ISO 31010: escalas de consecuencia y probabilidad, horizonte temporal, umbrales de aceptación y reglas de tratamiento.',
    color: '#ec4899',
  },
};

const FACTORES_EXTERNOS = [
  {
    id: 'FE-2026-001',
    titulo: 'Cambio en normativa de protección de datos personales',
    categoria: 'Legal / Regulatorio',
    impacto: 'Amenaza',
    estado: 'En análisis',
    fecha: '2026-03-28',
    fuente: 'Asamblea Legislativa',
    descripcion: 'Nuevos requisitos de consentimiento y almacenamiento que impactan el flujo actual de apertura de cuentas digitales.',
  },
  {
    id: 'FE-2026-002',
    titulo: 'Crecimiento de la adopción de billeteras digitales',
    categoria: 'Económico / Mercado',
    impacto: 'Oportunidad',
    estado: 'Identificado',
    fecha: '2026-04-03',
    fuente: 'Tendencias de Mercado',
    descripcion: 'Aumento del 40% en el uso de pagos electrónicos en el segmento joven, permitiendo captación de nuevos clientes.',
  },
  {
    id: 'FE-2026-003',
    titulo: 'Inestabilidad geopolítica regional',
    categoria: 'Político',
    impacto: 'Amenaza',
    estado: 'Monitoreo',
    fecha: '2026-04-11',
    fuente: 'Inteligencia Estratégica',
    descripcion: 'Posible impacto en las líneas de crédito internacionales y en la volatilidad del tipo de cambio.',
  },
];





// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────
const IMPACTO_COLOR: Record<string, string> = {
  Fortaleza: '#10b981',
  Oportunidad: '#3b82f6',
  Debilidad: '#f59e0b',
  Amenaza: '#ef4444',
};

const RELEVANCIA_COLOR: Record<string, string> = {
  Crítica: '#ef4444',
  Alta: '#f59e0b',
  Media: '#3b82f6',
  Baja: '#10b981',
};

const ESTADO_COLOR: Record<string, { bg: string; text: string }> = {
  Vigente: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  'En mitigación': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  'En análisis': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  Monitoreo: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  Identificado: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  Gestionado: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  'En seguimiento': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
};

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      style={{
        background: bg,
        color: text,
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function ImpactoIndicator({ tipo }: { tipo: string }) {
  const isPositive = tipo === 'Fortaleza' || tipo === 'Oportunidad';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {isPositive ? <CheckCircle2 size={14} style={{ color: '#10b981' }} /> : <AlertCircle size={14} style={{ color: IMPACTO_COLOR[tipo] }} />}
      <span style={{ fontSize: '0.72rem', color: IMPACTO_COLOR[tipo], fontWeight: 700 }}>{tipo}</span>
    </div>
  );
}

function RelevanciaDots({ nivel }: { nivel: string }) {
  const levels = ['Baja', 'Media', 'Alta', 'Crítica'];
  const idx = levels.indexOf(nivel);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {levels.map((_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i <= idx ? RELEVANCIA_COLOR[nivel] : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Tab panels
// ──────────────────────────────────────────────────────

function ContextoOrganizacionalTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem', animation: 'fadeIn 0.4s ease-out' }}>
      {Object.entries(CONTEXTO_DATA).map(([label, data]) => (
        <div
          key={label}
          style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = `${data.color}40`;
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          }}
        >
          {/* Decorative background glow */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: data.color,
              filter: 'blur(45px)',
              opacity: 0.1,
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: `${data.color}15`,
                border: `1px solid ${data.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: data.color,
              }}
            >
              {data.icon}
            </div>
            <button
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <Edit2 size={14} />
            </button>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.92rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{label}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500 }}>{data.value}</p>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: data.color }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configuración Base</span>
          </div>
        </div>
      ))}
    </div>
  );
}







// ──────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────


function FactoresExternosTab() {
  const [selected, setSelected] = useState<(typeof FACTORES_EXTERNOS)[0] | null>(null);

  return (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem', flexWrap: 'wrap' }}>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
          <Filter size={14} /> Filtrar por categoría
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Download size={14} /> Exportar
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
            <Plus size={14} /> Nuevo factor
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID / TÍTULO', 'CATEGORÍA', 'FUENTE', 'TIPO (IMPACTO)', 'ESTADO', 'FECHA', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTORES_EXTERNOS.map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelected(item)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{item.id}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{item.titulo}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>{item.categoria}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Globe size={13} /> {item.fuente}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <ImpactoIndicator tipo={item.impacto} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge label={item.estado} bg={ESTADO_COLOR[item.estado]?.bg ?? 'rgba(255,255,255,0.06)'} text={ESTADO_COLOR[item.estado]?.text ?? '#94a3b8'} />
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} /> {item.fecha}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <ChevronRight size={16} style={{ color: '#475569' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 480, maxWidth: '90vw', height: '100vh', background: '#0b1120', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-24px 0 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease-out' }}
          >
            <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selected.id}</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>{selected.titulo}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: IMPACTO_COLOR[selected.impacto] + '15', border: `1px solid ${IMPACTO_COLOR[selected.impacto]}30`, borderRadius: '12px', padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Nivel de Impacto Estratégico</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: IMPACTO_COLOR[selected.impacto] }}>
                  {selected.impacto}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {[
                  { label: 'Categoría', value: selected.categoria },
                  { label: 'Estado', value: selected.estado },
                  { label: 'Fuente', value: selected.fuente },
                  { label: 'Fecha', value: selected.fecha },
                ].map((f) => (
                  <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Descripción</div>
                <p style={{ margin: 0, fontSize: '0.87rem', color: '#cbd5e1', lineHeight: 1.65 }}>{selected.descripcion}</p>
              </div>
            </div>
            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                Editar factor
              </button>
              <button onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default function ContextoPage() {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.2) 100%)',
              border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Briefcase size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>Contexto de la Organización</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Análisis estructural y marco estratégico de riesgo para la gestión integral
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {/* Section 1: Contexto Organizacional */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: 4, height: 18, borderRadius: '2px', background: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Contexto Organizacional</h2>
          </div>
          <ContextoOrganizacionalTab />
        </section>

      </div>


      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
