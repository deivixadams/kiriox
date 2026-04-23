'use client';

import React, { useEffect, useState } from 'react';
import {
  Shield,
  Briefcase,
  FileText,
  Target,
  Globe,
  Home,
  Maximize,
  Box,
  LayoutGrid,
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react';

type Tab = 'contexto' | 'identificar';

type ContextoObjetoForm = {
  titulo_evaluacion: string;
  objeto_evaluado_id: string;
  objetivo_evaluacion: string;
  alcance: string;
  contexto_externo_especifico: string;
  contexto_interno_especifico: string;
};

type ContextoFieldKey = keyof ContextoObjetoForm;

type ContextoFieldDef = {
  key: ContextoFieldKey;
  label: string;
  help: string;
  color: string;
  icon: React.ReactNode;
  inputType: 'text' | 'textarea' | 'select';
};

type ElementTypeOption = {
  id: string;
  code: string;
  name: string;
};

const INITIAL_FORM: ContextoObjetoForm = {
  titulo_evaluacion: '',
  objeto_evaluado_id: '',
  objetivo_evaluacion: '',
  alcance: '',
  contexto_externo_especifico: '',
  contexto_interno_especifico: '',
};

const CONTEXTO_FIELDS: ContextoFieldDef[] = [
  {
    key: 'titulo_evaluacion',
    label: 'Título de la evaluación',
    help: 'Ingrese el nombre formal de la evaluación, periodo de vigencia y versión para trazabilidad y auditoría.',
    color: '#3b82f6',
    icon: <FileText size={18} />,
    inputType: 'text',
  },
  {
    key: 'objeto_evaluado_id',
    label: 'Objeto evaluado',
    help: 'Seleccione el tipo de objeto evaluado (tabla core._element_types) que delimita el foco principal del análisis.',
    color: '#10b981',
    icon: <Box size={18} />,
    inputType: 'select',
  },
  {
    key: 'objetivo_evaluacion',
    label: 'Objetivo de la evaluación',
    help: 'Defina la decisión que soportará la evaluación: identificar, priorizar, tratar o monitorear riesgos según criterios establecidos.',
    color: '#f59e0b',
    icon: <Target size={18} />,
    inputType: 'textarea',
  },
  {
    key: 'alcance',
    label: 'Alcance',
    help: 'Especifique fronteras del análisis: inicio/fin del proceso, exclusiones, interfaces y horizonte temporal de evaluación.',
    color: '#ef4444',
    icon: <Maximize size={18} />,
    inputType: 'textarea',
  },
  {
    key: 'contexto_externo_especifico',
    label: 'Contexto externo específico',
    help: 'Detalle factores externos que influyen en el riesgo: regulatorios, mercado, tecnológicos, sociales y ambientales.',
    color: '#8b5cf6',
    icon: <Globe size={18} />,
    inputType: 'textarea',
  },
  {
    key: 'contexto_interno_especifico',
    label: 'Contexto interno específico',
    help: 'Describa condiciones internas: estructura, cultura, sistemas, capacidades operativas y estado de controles existentes.',
    color: '#06b6d4',
    icon: <Home size={18} />,
    inputType: 'textarea',
  },
];

// ──────────────────────────────────────────────────────
// Mock data for Identificar Riesgos
// ──────────────────────────────────────────────────────
const RIESGOS_DATA = [
  {
    titulo: 'Fallo en la sincronización de base de datos',
    descripcion: 'Pérdida de integridad de datos durante el proceso de cierre nocturno.',
    severidad: 'Alta',
    color: '#ef4444',
  },
  {
    titulo: 'Ataque de denegación de servicio (DDoS)',
    descripcion: 'Indisponibilidad del portal de banca en línea por saturación de tráfico.',
    severidad: 'Crítica',
    color: '#f43f5e',
  },
  {
    titulo: 'Error humano en la carga de parámetros',
    descripcion: 'Configuración incorrecta de tasas de interés en el módulo de préstamos.',
    severidad: 'Media',
    color: '#f59e0b',
  },
];

// ──────────────────────────────────────────────────────
// Tab components
// ──────────────────────────────────────────────────────

type ContextoTabProps = {
  form: ContextoObjetoForm;
  elementTypes: ElementTypeOption[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  onFieldChange: (key: ContextoFieldKey, value: string) => void;
  onSave: () => Promise<void>;
};

function ContextoTab({
  form,
  elementTypes,
  loading,
  saving,
  error,
  success,
  onFieldChange,
  onSave,
}: ContextoTabProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    marginTop: '0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '0.84rem',
    padding: '0.65rem 0.75rem',
    outline: 'none',
  };

  if (loading) {
    return (
      <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '0.5rem 0.25rem' }}>
        Cargando contexto...
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            core.contexto_objeto
          </span>
          {error ? <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</span> : null}
          {!error && success ? <span style={{ color: '#34d399', fontSize: '0.8rem' }}>{success}</span> : null}
        </div>
        <button
          onClick={() => void onSave()}
          disabled={saving}
          style={{
            background: saving ? 'rgba(59,130,246,0.45)' : '#3b82f6',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#fff',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Guardando...' : 'Guardar contexto'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
      {CONTEXTO_FIELDS.map((field) => (
        <div
          key={field.key}
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
            (e.currentTarget as HTMLDivElement).style.borderColor = `${field.color}40`;
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: field.color,
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
                background: `${field.color}15`,
                border: `1px solid ${field.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: field.color,
              }}
            >
              {field.icon}
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.92rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{field.label}</h3>
            <p style={{ margin: 0, fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500 }}>{field.help}</p>

            {field.inputType === 'select' ? (
              <select
                value={form[field.key]}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
                style={inputStyle}
              >
                <option value="">Seleccione un tipo de objeto</option>
                {elementTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            ) : field.inputType === 'textarea' ? (
              <textarea
                value={form[field.key]}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
                style={{ ...inputStyle, minHeight: '95px', resize: 'vertical' }}
              />
            ) : (
              <input
                value={form[field.key]}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
                style={inputStyle}
              />
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

function IdentificarRiesgosTab() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Riesgos Identificados</h2>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={16} /> Identificar nuevo riesgo
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {RIESGOS_DATA.map((riesgo, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = `${riesgo.color}40`;
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.85)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.7)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: `${riesgo.color}15`, color: riesgo.color, padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {riesgo.severidad}
              </span>
              <ChevronRight size={16} style={{ color: '#475569' }} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>{riesgo.titulo}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{riesgo.descripcion}</p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#64748b' }}>
                <Shield size={14} /> Controlable
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#64748b' }}>
                <LayoutGrid size={14} /> Tecnológico
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────
const TABS = [
  { id: 'contexto', label: 'Contexto organizacional', icon: <Briefcase size={15} /> },
  { id: 'identificar', label: 'Identificar riesgos', icon: <Search size={15} /> },
];

export default function IdentificarRiesgosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('contexto');
  const [form, setForm] = useState<ContextoObjetoForm>(INITIAL_FORM);
  const [elementTypes, setElementTypes] = useState<ElementTypeOption[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextSaving, setContextSaving] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextSuccess, setContextSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadContext() {
      try {
        setContextLoading(true);
        setContextError(null);
        const response = await fetch('/api/linear-risk/contexto-objeto', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar contexto de evaluación.');
        }

        if (!isMounted) return;

        const options: ElementTypeOption[] = Array.isArray(payload?.elementTypes) ? payload.elementTypes : [];
        setElementTypes(options);

        const item = payload?.item;
        const nextForm: ContextoObjetoForm = {
          titulo_evaluacion: item?.titulo_evaluacion ?? '',
          objeto_evaluado_id: item?.objeto_evaluado_id ?? '',
          objetivo_evaluacion: item?.objetivo_evaluacion ?? '',
          alcance: item?.alcance ?? '',
          contexto_externo_especifico: item?.contexto_externo_especifico ?? '',
          contexto_interno_especifico: item?.contexto_interno_especifico ?? '',
        };

        if (!nextForm.objeto_evaluado_id && options[0]?.id) {
          nextForm.objeto_evaluado_id = options[0].id;
        }
        setForm(nextForm);
      } catch (error) {
        if (isMounted) {
          setContextError(error instanceof Error ? error.message : 'No se pudo cargar contexto.');
        }
      } finally {
        if (isMounted) {
          setContextLoading(false);
        }
      }
    }

    void loadContext();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleFieldChange(key: ContextoFieldKey, value: string) {
    setContextSuccess(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveContexto() {
    try {
      setContextSaving(true);
      setContextError(null);
      setContextSuccess(null);

      const response = await fetch('/api/linear-risk/contexto-objeto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo guardar contexto.');
      }

      setForm({
        titulo_evaluacion: payload?.item?.titulo_evaluacion ?? form.titulo_evaluacion,
        objeto_evaluado_id: payload?.item?.objeto_evaluado_id ?? form.objeto_evaluado_id,
        objetivo_evaluacion: payload?.item?.objetivo_evaluacion ?? form.objetivo_evaluacion,
        alcance: payload?.item?.alcance ?? form.alcance,
        contexto_externo_especifico: payload?.item?.contexto_externo_especifico ?? form.contexto_externo_especifico,
        contexto_interno_especifico: payload?.item?.contexto_interno_especifico ?? form.contexto_interno_especifico,
      });
      setContextSuccess('Contexto guardado correctamente.');
    } catch (error) {
      setContextError(error instanceof Error ? error.message : 'No se pudo guardar contexto.');
    } finally {
      setContextSaving(false);
    }
  }

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
            <Search size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>Identificación de Riesgos</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Fase de levantamiento y contextualización de riesgos operativos
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
              onClick={() => setActiveTab(tab.id as Tab)}
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
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={activeTab}>
        {activeTab === 'contexto' && (
          <ContextoTab
            form={form}
            elementTypes={elementTypes}
            loading={contextLoading}
            saving={contextSaving}
            error={contextError}
            success={contextSuccess}
            onFieldChange={handleFieldChange}
            onSave={handleSaveContexto}
          />
        )}
        {activeTab === 'identificar' && <IdentificarRiesgosTab />}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
