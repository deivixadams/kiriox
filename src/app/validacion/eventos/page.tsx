'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  Newspaper,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  ChevronRight,
  Shield,
  DollarSign,
  Globe,
  Calendar,
  Tag,
  Building2,
  X,
} from 'lucide-react';

type Tab = 'incidentes' | 'eventos-perdidas' | 'hechos-relevantes';

// ──────────────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────────────
const INCIDENTES = [
  {
    id: 'INC-2026-001',
    titulo: 'Falla en sistema de monitoreo transaccional AML',
    categoria: 'Tecnología',
    severidad: 'Alta',
    estado: 'Abierto',
    fecha: '2026-04-10',
    responsable: 'Oficial de TI',
    descripcion: 'El sistema de monitoreo automatizado presentó una caída de 4 horas, impidiendo la detección de alertas AML en tiempo real.',
  },
  {
    id: 'INC-2026-002',
    titulo: 'Acceso no autorizado a expedientes de clientes PEP',
    categoria: 'Seguridad',
    severidad: 'Crítica',
    estado: 'En revisión',
    fecha: '2026-04-08',
    responsable: 'Oficial de Seguridad',
    descripcion: 'Se detectó acceso irregular desde una cuenta con privilegios elevados a expedientes de clientes clasificados como PEP.',
  },
  {
    id: 'INC-2026-003',
    titulo: 'Retraso en reporte GAFILAT mensual',
    categoria: 'Regulatorio',
    severidad: 'Media',
    estado: 'Cerrado',
    fecha: '2026-04-01',
    responsable: 'Área de Cumplimiento',
    descripcion: 'El reporte mensual requerido por GAFILAT fue enviado con 2 días de retraso por fallas en el proceso de consolidación de datos.',
  },
];

const EVENTOS_PERDIDAS = [
  {
    id: 'EP-2026-001',
    titulo: 'Multa regulatoria por deficiencia en controles KYC',
    categoria: 'Fraude externo',
    monto: 125000,
    moneda: 'USD',
    estado: 'Registrado',
    fecha: '2026-03-28',
    dominio: 'Cumplimiento',
    descripcion: 'Sanción impuesta por el regulador tras detectar debilidades en el proceso de verificación de identidad de clientes corporativos.',
  },
  {
    id: 'EP-2026-002',
    titulo: 'Pérdida por error operativo en transferencias internacionales',
    categoria: 'Error de proceso',
    monto: 48500,
    moneda: 'USD',
    estado: 'En análisis',
    fecha: '2026-04-03',
    dominio: 'Operaciones',
    descripcion: 'Error en la codificación de cuentas beneficiarias derivó en una transferencia duplicada que no pudo revertirse en el plazo estándar.',
  },
  {
    id: 'EP-2026-003',
    titulo: 'Recuperación parcial de pérdida por fraude interno',
    categoria: 'Fraude interno',
    monto: -22000,
    moneda: 'USD',
    estado: 'Recuperado',
    fecha: '2026-04-11',
    dominio: 'Recursos Humanos',
    descripcion: 'Se recuperó parcialmente el monto apropiado por un colaborador mediante proceso judicial. Caso cerrado con recuperación del 45%.',
  },
];

const HECHOS_RELEVANTES = [
  {
    id: 'HR-2026-001',
    titulo: 'Nueva circular SUGEF sobre gestión de riesgo operativo',
    fuente: 'SUGEF',
    impacto: 'Alto',
    tipo: 'Regulatorio',
    fecha: '2026-04-12',
    descripcion: 'SUGEF publicó la circular SUGEF 2-26 que establece nuevos requerimientos de reporte para eventos de pérdida operativa con impacto ≥ USD 50,000.',
    accion: 'Revisión de políticas',
  },
  {
    id: 'HR-2026-002',
    titulo: 'Condena penal a red de lavado vinculada al sector bancario regional',
    fuente: 'Poder Judicial',
    impacto: 'Medio',
    tipo: 'Legal',
    fecha: '2026-04-09',
    descripcion: 'Sentencia condenatoria a organización criminal que utilizó cuentas en entidades bancarias de la región para blanqueo de capitales por USD 3.2M.',
    accion: 'Revisión de vínculos',
  },
  {
    id: 'HR-2026-003',
    titulo: 'Alerta GAFILAT sobre nuevas tipologías de financiamiento del terrorismo',
    fuente: 'GAFILAT',
    impacto: 'Alto',
    tipo: 'Inteligencia',
    fecha: '2026-04-05',
    descripcion: 'GAFILAT emitió alerta regional sobre el uso de criptoactivos y plataformas P2P para financiamiento de actividades terroristas en Latinoamérica.',
    accion: 'Capacitación y alerta',
  },
];

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────
const SEVERIDAD_COLOR: Record<string, string> = {
  Crítica: '#ef4444',
  Alta: '#f59e0b',
  Media: '#3b82f6',
  Baja: '#10b981',
};

const ESTADO_COLOR: Record<string, { bg: string; text: string }> = {
  Abierto: { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
  'En revisión': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  'En análisis': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  Cerrado: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  Registrado: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  Recuperado: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
};

const IMPACTO_COLOR: Record<string, string> = {
  Alto: '#ef4444',
  Medio: '#f59e0b',
  Bajo: '#10b981',
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

function SeveridadDots({ nivel }: { nivel: string }) {
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
            background: i <= idx ? SEVERIDAD_COLOR[nivel] : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Tab panels
// ──────────────────────────────────────────────────────
function IncidentesTab() {
  const [selected, setSelected] = useState<(typeof INCIDENTES)[0] | null>(null);
  const [search, setSearch] = useState('');

  const filtered = INCIDENTES.filter(
    (i) =>
      i.titulo.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Buscar incidente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '9px 12px 9px 36px',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                outline: 'none',
              }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Filter size={14} /> Filtros
          </button>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Plus size={15} /> Registrar incidente
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID / TÍTULO', 'CATEGORÍA', 'SEVERIDAD', 'ESTADO', 'FECHA', 'RESPONSABLE', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc) => (
              <tr
                key={inc.id}
                onClick={() => setSelected(inc)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{inc.id}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{inc.titulo}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Shield size={13} /> {inc.categoria}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <SeveridadDots nivel={inc.severidad} />
                  <div style={{ fontSize: '0.72rem', color: SEVERIDAD_COLOR[inc.severidad], fontWeight: 700, marginTop: 3 }}>{inc.severidad}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge label={inc.estado} bg={ESTADO_COLOR[inc.estado]?.bg ?? 'rgba(255,255,255,0.06)'} text={ESTADO_COLOR[inc.estado]?.text ?? '#94a3b8'} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Calendar size={13} /> {inc.fecha}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>{inc.responsable}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <ChevronRight size={16} style={{ color: '#475569' }} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
                  Sin incidentes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
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
                <h3 style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>{selected.titulo}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Severidad', value: selected.severidad, color: SEVERIDAD_COLOR[selected.severidad] },
                  { label: 'Estado', value: selected.estado, color: ESTADO_COLOR[selected.estado]?.text },
                  { label: 'Categoría', value: selected.categoria, color: '#94a3b8' },
                  { label: 'Fecha', value: selected.fecha, color: '#94a3b8' },
                ].map((item) => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Descripción</div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.65 }}>{selected.descripcion}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Responsable</div>
                <div style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>{selected.responsable}</div>
              </div>
            </div>
            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                Editar incidente
              </button>
              <button style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EventosPérdidasTab() {
  const [selected, setSelected] = useState<(typeof EVENTOS_PERDIDAS)[0] | null>(null);

  const total = EVENTOS_PERDIDAS.reduce((sum, e) => sum + e.monto, 0);
  const brutas = EVENTOS_PERDIDAS.filter((e) => e.monto > 0).reduce((s, e) => s + e.monto, 0);

  return (
    <>
      {/* KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Pérdida bruta total', value: `USD ${brutas.toLocaleString()}`, color: '#ef4444', icon: <TrendingDown size={18} /> },
          { label: 'Neto (rec. incluidas)', value: `USD ${total.toLocaleString()}`, color: total < 0 ? '#10b981' : '#f59e0b', icon: <DollarSign size={18} /> },
          { label: 'Eventos registrados', value: EVENTOS_PERDIDAS.length, color: '#60a5fa', icon: <Tag size={18} /> },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ color: kpi.color, opacity: 0.85 }}>{kpi.icon}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: kpi.color, marginTop: 2 }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
          <Filter size={14} /> Filtrar por dominio
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Download size={14} /> Exportar
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
            <Plus size={14} /> Nuevo evento
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID / TÍTULO', 'CATEGORÍA', 'DOMINIO', 'MONTO', 'ESTADO', 'FECHA', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTOS_PERDIDAS.map((ev) => (
              <tr
                key={ev.id}
                onClick={() => setSelected(ev)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{ev.id}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{ev.titulo}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>{ev.categoria}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Building2 size={13} /> {ev.dominio}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: ev.monto < 0 ? '#10b981' : '#ef4444' }}>
                    {ev.monto < 0 ? '+' : '-'} {ev.moneda} {Math.abs(ev.monto).toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge label={ev.estado} bg={ESTADO_COLOR[ev.estado]?.bg ?? 'rgba(255,255,255,0.06)'} text={ESTADO_COLOR[ev.estado]?.text ?? '#94a3b8'} />
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} /> {ev.fecha}
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

      {/* Drawer */}
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
              <div style={{ background: selected.monto < 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${selected.monto < 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '12px', padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Impacto económico</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: selected.monto < 0 ? '#10b981' : '#ef4444' }}>
                  {selected.monto < 0 ? '+' : '-'} {selected.moneda} {Math.abs(selected.monto).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {[
                  { label: 'Categoría', value: selected.categoria },
                  { label: 'Estado', value: selected.estado },
                  { label: 'Dominio', value: selected.dominio },
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
                Editar evento
              </button>
              <button onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HechosRelevantesTab() {
  const [selected, setSelected] = useState<(typeof HECHOS_RELEVANTES)[0] | null>(null);

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Filter size={14} /> Tipo
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Globe size={14} /> Fuente
          </button>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
          <Plus size={14} /> Registrar hecho
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {HECHOS_RELEVANTES.map((hr) => (
          <div
            key={hr.id}
            onClick={() => setSelected(hr)}
            style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.35)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.9)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.7)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>{hr.id}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#334155' }} />
                  <Badge
                    label={hr.tipo}
                    bg="rgba(59,130,246,0.1)"
                    text="#60a5fa"
                  />
                  <Badge
                    label={`Impacto ${hr.impacto}`}
                    bg={`${IMPACTO_COLOR[hr.impacto]}18`}
                    text={IMPACTO_COLOR[hr.impacto]}
                  />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.35 }}>{hr.titulo}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 2 }}>
                  <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />{hr.fecha}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{hr.fuente}</div>
              </div>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>{hr.descripcion}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.77rem', color: '#3b82f6', fontWeight: 700 }}>
              <Tag size={12} /> Acción sugerida: {hr.accion}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
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
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <Badge label={selected.tipo} bg="rgba(59,130,246,0.1)" text="#60a5fa" />
                  <Badge label={`Impacto ${selected.impacto}`} bg={`${IMPACTO_COLOR[selected.impacto]}18`} text={IMPACTO_COLOR[selected.impacto]} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>{selected.titulo}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {[
                  { label: 'Fuente', value: selected.fuente },
                  { label: 'Fecha', value: selected.fecha },
                  { label: 'Tipo', value: selected.tipo },
                  { label: 'Impacto', value: selected.impacto },
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
              <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Acción sugerida</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 700, color: '#60a5fa' }}>
                  <Tag size={14} /> {selected.accion}
                </div>
              </div>
            </div>
            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                Vincular a riesgo
              </button>
              <button onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
  { id: 'incidentes', label: 'Incidentes', icon: <AlertTriangle size={15} />, count: INCIDENTES.length },
  { id: 'eventos-perdidas', label: 'Eventos de pérdidas', icon: <TrendingDown size={15} />, count: EVENTOS_PERDIDAS.length },
  { id: 'hechos-relevantes', label: 'Hechos relevantes', icon: <Newspaper size={15} />, count: HECHOS_RELEVANTES.length },
];

export default function EventosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('incidentes');

  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
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
            <AlertTriangle size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>Eventos</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Registro y seguimiento de incidentes, pérdidas operativas y hechos relevantes
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          background: 'rgba(15,23,42,0.7)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.75rem',
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.83rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#f1f5f9' : '#64748b',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.18) 100%)'
                  : 'transparent',
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(59,130,246,0.3)' : 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: isActive ? '#60a5fa' : '#475569' }}>{tab.icon}</span>
              {tab.label}
              <span
                style={{
                  background: isActive ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#93c5fd' : '#475569',
                  borderRadius: '999px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'incidentes' && <IncidentesTab />}
        {activeTab === 'eventos-perdidas' && <EventosPérdidasTab />}
        {activeTab === 'hechos-relevantes' && <HechosRelevantesTab />}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
