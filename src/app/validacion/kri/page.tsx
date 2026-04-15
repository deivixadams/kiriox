'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  ChevronRight,
  Shield,
  Target,
  Calendar,
  Tag,
  X,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

// ──────────────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────────────
const KRIs = [
  {
    id: 'KRI-AML-001',
    titulo: '% Cumplimiento Debida Diligencia (KYC)',
    categoria: 'AML / Cumplimiento',
    valorActual: '92.4%',
    meta: '≥ 95%',
    umbrales: { verde: '≥ 95%', amarillo: '90% - 94%', rojo: '< 90%' },
    severidad: 'Alta',
    estado: 'En advertencia',
    frecuencia: 'Mensual',
    ultimaActualizacion: '2026-04-01',
    responsable: 'Oficial de Cumplimiento',
    descripcion: 'Mide el porcentaje de expedientes de clientes que cuentan con toda la documentación de debida diligencia actualizada y validada.',
  },
  {
    id: 'KRI-AML-002',
    titulo: 'Alertas AML Pendientes > 30 días',
    categoria: 'AML / Operaciones',
    valorActual: '145',
    meta: '≤ 20',
    umbrales: { verde: '≤ 20', amarillo: '21 - 50', rojo: '> 50' },
    severidad: 'Crítica',
    estado: 'Crítico',
    frecuencia: 'Semanal',
    ultimaActualizacion: '2026-04-12',
    responsable: 'Jefe de Monitoreo',
    descripcion: 'Cantidad de alertas generadas por el sistema de monitoreo que no han sido gestionadas o cerradas en un periodo superior a 30 días naturales.',
  },
  {
    id: 'KRI-OPS-001',
    titulo: 'Tiempo de Inactividad de Canales Digitales',
    categoria: 'Riesgo Operativo',
    valorActual: '12 min',
    meta: '≤ 5 min',
    umbrales: { verde: '≤ 5 min', amarillo: '6 - 15 min', rojo: '> 15 min' },
    severidad: 'Media',
    estado: 'En advertencia',
    frecuencia: 'Tiempo Real',
    ultimaActualizacion: '2026-04-15',
    responsable: 'Gerente de TI',
    descripcion: 'Acumulado mensual de minutos en los que la banca en línea o app móvil han estado fuera de servicio para los usuarios finales.',
  },
  {
    id: 'KRI-SEG-001',
    titulo: '% Intentos de Acceso No Autorizados',
    categoria: 'Ciberseguridad',
    valorActual: '0.01%',
    meta: '≤ 0.05%',
    umbrales: { verde: '≤ 0.05%', amarillo: '0.06% - 0.1%', rojo: '> 0.1%' },
    severidad: 'Baja',
    estado: 'En rango',
    frecuencia: 'Mensual',
    ultimaActualizacion: '2026-04-10',
    responsable: 'CISO',
    descripcion: 'Relación entre el número de intentos fallidos de autenticación por fuerza bruta y el total de accesos exitosos a sistemas centrales.',
  },
  {
    id: 'KRI-FIN-001',
    titulo: 'Pérdida por Fraude Externo Acumulada',
    categoria: 'Riesgo Financiero',
    valorActual: 'USD 45,200',
    meta: '≤ USD 30,000',
    umbrales: { verde: '≤ 30k', amarillo: '31k - 50k', rojo: '> 50k' },
    severidad: 'Alta',
    estado: 'En advertencia',
    frecuencia: 'Mensual',
    ultimaActualizacion: '2026-04-05',
    responsable: 'Director de Riesgos',
    descripcion: 'Monto total de pérdidas netas causadas por eventos de fraude externo (clonación, phishing, etc.) durante el trimestre actual.',
  },
  {
    id: 'KRI-LEG-001',
    titulo: 'Litigios Pendientes por Incumplimiento Contractual',
    categoria: 'Riesgo Legal',
    valorActual: '3',
    meta: '≤ 5',
    umbrales: { verde: '≤ 5', amarillo: '6 - 10', rojo: '> 10' },
    severidad: 'Baja',
    estado: 'En rango',
    frecuencia: 'Trimestral',
    ultimaActualizacion: '2026-03-31',
    responsable: 'Asesor Legal',
    descripcion: 'Número de procesos judiciales abiertos en contra de la entidad que involucran disputas sobre términos contractuales con proveedores.',
  },
  {
    id: 'KRI-RRHH-001',
    titulo: 'Rotación de Personal en Áreas Críticas',
    categoria: 'Riesgo Humano',
    valorActual: '18%',
    meta: '≤ 10%',
    umbrales: { verde: '≤ 10%', amarillo: '11% - 15%', rojo: '> 15%' },
    severidad: 'Crítica',
    estado: 'Crítico',
    frecuencia: 'Mensual',
    ultimaActualizacion: '2026-04-01',
    responsable: 'Recursos Humanos',
    descripcion: 'Porcentaje de colaboradores que han abandonado o sido desvinculados de áreas de control (Riesgos, Auditoría, Cumplimiento) en los últimos 12 meses.',
  },
  {
    id: 'KRI-TI-001',
    titulo: 'Controles de Parches de Seguridad Pendientes',
    categoria: 'Riesgo Tecnológico',
    valorActual: '42',
    meta: '≤ 10',
    umbrales: { verde: '≤ 10', amarillo: '11 - 25', rojo: '> 25' },
    severidad: 'Alta',
    estado: 'Crítico',
    frecuencia: 'Semanal',
    ultimaActualizacion: '2026-04-14',
    responsable: 'Seguridad Informática',
    descripcion: 'Número de servidores con vulnerabilidades críticas detectadas cuyos parches no han sido aplicados después de 72 horas de su publicación.',
  },
  {
    id: 'KRI-EST-001',
    titulo: 'Concentración en Sector Inmobiliario',
    categoria: 'Riesgo de Crédito',
    valorActual: '28%',
    meta: '≤ 25%',
    umbrales: { verde: '≤ 25%', amarillo: '26% - 30%', rojo: '> 30%' },
    severidad: 'Media',
    estado: 'En advertencia',
    frecuencia: 'Trimestral',
    ultimaActualizacion: '2026-03-31',
    responsable: 'Analista de Crédito',
    descripcion: 'Porcentaje del portafolio total de créditos colocado en actividades relacionadas con el sector construcción e inmobiliario.',
  },
  {
    id: 'KRI-REP-001',
    titulo: 'Menciones Negativas en Medios de Alta Circulación',
    categoria: 'Riesgo Reputacional',
    valorActual: '1',
    meta: '≤ 2',
    umbrales: { verde: '≤ 2', amarillo: '3 - 5', rojo: '> 5' },
    severidad: 'Baja',
    estado: 'En rango',
    frecuencia: 'Diaria',
    ultimaActualizacion: '2026-04-15',
    responsable: 'Comunicaciones',
    descripcion: 'Conteo de noticias o reportajes negativos que mencionan directamente a la institución en prensa escrita o digital nacional.',
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
  'Crítico': { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
  'En advertencia': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  'En rango': { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
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
// Main page
// ──────────────────────────────────────────────────────
export default function KRIPage() {
  const [selected, setSelected] = useState<(typeof KRIs)[0] | null>(null);
  const [search, setSearch] = useState('');

  const filtered = KRIs.filter(
    (k) =>
      k.titulo.toLowerCase().includes(search.toLowerCase()) ||
      k.id.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: KRIs.length,
    criticos: KRIs.filter(k => k.estado === 'Crítico').length,
    advertencias: KRIs.filter(k => k.estado === 'En advertencia').length,
  };

  const handleExport = () => {
    // Preparar los datos para el objeto de Excel
    const data = filtered.map(k => ({
      'ID': k.id,
      'Indicador': k.titulo,
      'Categoría': k.categoria,
      'Valor Actual': k.valorActual,
      'Meta': k.meta,
      'Frecuencia': k.frecuencia,
      'Severidad': k.severidad,
      'Estado': k.estado,
      'Responsable': k.responsable,
      'Descripción': k.descripcion
    }));

    // Crear la hoja de trabajo (Sheet)
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar anchos de columna básicos
    const wscols = [
      { wch: 15 }, // ID
      { wch: 45 }, // Indicador
      { wch: 20 }, // Categoría
      { wch: 15 }, // Valor
      { wch: 15 }, // Meta
      { wch: 15 }, // Frecuencia
      { wch: 12 }, // Severidad
      { wch: 12 }, // Estado
      { wch: 25 }, // Responsable
      { wch: 60 }, // Descripción
    ];
    worksheet['!cols'] = wscols;

    // Crear el libro de trabajo (Workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KRIs");
    
    // Generar archivo y descargar con formato nativo XLSX
    XLSX.writeFile(workbook, `KRI_KIRIOX_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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
            <Activity size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>KRI (Key Risk Indicators)</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Indicadores clave de riesgo para el monitoreo proactivo de la salud organizacional
            </p>
          </div>
        </div>
      </div>

      {/* KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Indicadores', value: stats.total, color: '#60a5fa', icon: <BarChart3 size={18} /> },
          { label: 'Estado Crítico', value: stats.criticos, color: '#ef4444', icon: <AlertCircle size={18} /> },
          { label: 'En Advertencia', value: stats.advertencias, color: '#f59e0b', icon: <TrendingUp size={18} /> },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Buscar indicador..."
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <Download size={15} /> Exportar
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} /> Nuevo indicador
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID / INDICADOR', 'VALOR ACTUAL', 'META / RANGO', 'FRECUENCIA', 'SEVERIDAD', 'ESTADO', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((kri) => (
              <tr
                key={kri.id}
                onClick={() => setSelected(kri)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{kri.id}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{kri.titulo}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                   <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#e2e8f0' }}>{kri.valorActual}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Target size={13} /> {kri.meta}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Calendar size={13} /> {kri.frecuencia}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <SeveridadDots nivel={kri.severidad} />
                  <div style={{ fontSize: '0.72rem', color: SEVERIDAD_COLOR[kri.severidad], fontWeight: 700, marginTop: 3 }}>{kri.severidad}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge label={kri.estado} bg={ESTADO_COLOR[kri.estado]?.bg ?? 'rgba(255,255,255,0.06)'} text={ESTADO_COLOR[kri.estado]?.text ?? '#94a3b8'} />
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <ChevronRight size={16} style={{ color: '#475569' }} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
                  Sin indicadores para mostrar.
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
              
              {/* Main value display */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Valor Actual</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: ESTADO_COLOR[selected.estado]?.text }}>{selected.valorActual}</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>Meta: {selected.meta}</div>
              </div>

              {/* Thresholds */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Umbrales de Gestión</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#e2e8f0' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> En rango
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>{selected.umbrales.verde}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#e2e8f0' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Advertencia
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>{selected.umbrales.amarillo}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#e2e8f0' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Crítico
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>{selected.umbrales.rojo}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Severidad', value: selected.severidad, color: SEVERIDAD_COLOR[selected.severidad] },
                  { label: 'Frecuencia', value: selected.frecuencia, color: '#94a3b8' },
                  { label: 'Última Act.', value: selected.ultimaActualizacion, color: '#94a3b8' },
                  { label: 'Categoría', value: selected.categoria, color: '#94a3b8' },
                ].map((item) => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Descripción</div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.65 }}>{selected.descripcion}</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Responsable</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>
                   <Shield size={14} style={{ color: '#3b82f6' }} /> {selected.responsable}
                </div>
              </div>
            </div>
            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                Ver histórico
              </button>
              <button style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                Alertar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
