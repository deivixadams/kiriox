"use client";

import React from 'react';
import { Activity, ShieldAlert, Zap, ActivitySquare, RotateCcw, Terminal } from 'lucide-react';
import { useSimulationStore } from '../../application/SimulationProvider';
import { MetricCard } from './MetricCard';
import { CONFIG } from '../../domain/AnalyticsEngine';
import styles from '../SimulationSystem.module.css';

export const SidebarPanel: React.FC = () => {
  const { nodes, metrics, resetSimulation, events, isAutomatic, setAutomatic, frameworkMode, setFrameworkMode } = useSimulationStore();
  
  // Get latest event data
  const latestEvent = events.length > 0 ? events[0] : null;

  const getEventControlName = () => {
    if (!latestEvent) return '';
    return nodes[latestEvent.controlId]?.name || latestEvent.controlId;
  };
  
  const isFragile = metrics.structuralFragility > 30;
  const hasFailures = metrics.failedControlsCount > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%' }}>
      
      {/* Header Branding */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivitySquare style={{ color: 'white', width: '18px', height: '18px' }} />
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', letterSpacing: '0.02em', margin: 0 }}>KIRIOX<span style={{ color: '#3b82f6' }}>.SIM</span></h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '24px' }}>Análisis de Fragilidad Estructural</p>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button 
            onClick={resetSimulation}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: 'rgba(51, 65, 85, 0.2)', color: '#cbd5e1', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
          >
            <RotateCcw style={{ width: '12px', height: '12px' }} />
            Reset
          </button>
          <button 
            onClick={() => setAutomatic(!isAutomatic)}
            style={{ 
              padding: '10px 14px', 
              backgroundColor: isAutomatic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
              color: isAutomatic ? '#10b981' : '#f87171', 
              fontSize: '11px', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: isAutomatic ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isAutomatic ? '0 0 10px rgba(16, 185, 129, 0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isAutomatic ? <Zap size={14} /> : <Terminal size={14} />}
            {isAutomatic ? 'Auto Pilot' : 'Manual'}
          </button>
        </div>

        <div style={{ display: 'flex', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
          <button
            onClick={() => setFrameworkMode('AML')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: frameworkMode === 'AML' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: frameworkMode === 'AML' ? '#60a5fa' : '#94a3b8',
              border: frameworkMode === 'AML' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Modo AML
          </button>
          <button
            onClick={() => setFrameworkMode('CYB')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: frameworkMode === 'CYB' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: frameworkMode === 'CYB' ? '#c084fc' : '#94a3b8',
              border: frameworkMode === 'CYB' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Modo CIBER
          </button>
        </div>
      </div>

      {/* Global Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>Métricas Consolidadas</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <MetricCard 
              title="Índice de Fragilidad" 
              value={`${Math.round(metrics.structuralFragility)}%`} 
              icon={<ShieldAlert style={{ color: isFragile ? '#ef4444' : '#10b981' }} />}
              alert={isFragile}
            />
          </div>
          <MetricCard 
            title="Exposición" 
            value={`${Math.round(metrics.linearExposure)}`} 
            icon={<Activity style={{ color: '#60a5fa' }} />}
            alert={false}
          />
          <MetricCard 
            title="Cascada" 
            value={`${Math.round(metrics.cascadePercentage || 0)}%`} 
            icon={<RotateCcw style={{ color: '#f59e0b' }} />}
            alert={metrics.cascadePercentage! > 20}
          />
        </div>
      </div>

      {/* Trazabilidad Card */}
      <div>
         {latestEvent ? (
          <div className={styles.trazabilidadCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal style={{ width: '14px', height: '14px', color: '#f87171' }} />
                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>TRAZABILIDAD LIVE</span>
              </div>
              <span style={{ color: '#ef4444', fontSize: '9px', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Alerta</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ paddingLeft: '10px', borderLeft: '2px solid #ef4444' }}>
                <p style={{ color: '#ef4444', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Control Originario</p>
                <p style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>● {getEventControlName()} (FALLIDO)</p>
              </div>

              {latestEvent.risksMaterialized.length > 0 && (
                 <div style={{ paddingLeft: '10px', borderLeft: '2px solid #f97316' }}>
                   <p style={{ color: '#f97316', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Riesgos Materializados</p>
                   <div style={{ color: '#cbd5e1', fontSize: '10px', fontFamily: 'monospace', lineHeight: 1.4, margin: 0 }}>
                     {latestEvent.risksMaterialized.slice(0, 3).map(id => <div key={id}>- {nodes[id]?.name || id}</div>)}
                     {latestEvent.risksMaterialized.length > 3 && <div>... (+{latestEvent.risksMaterialized.length - 3})</div>}
                   </div>
                 </div>
              )}

              {latestEvent.elementsAffected.length > 0 && (
                 <div style={{ paddingLeft: '10px', borderLeft: '2px solid #fbbf24' }}>
                   <p style={{ color: '#fbbf24', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Unidades Afectadas</p>
                   <div style={{ color: '#cbd5e1', fontSize: '10px', fontFamily: 'monospace', lineHeight: 1.4, margin: 0 }}>
                     {latestEvent.elementsAffected.slice(0, 3).map(id => <div key={id}>- {nodes[id]?.name || id}</div>)}
                     {latestEvent.elementsAffected.length > 3 && <div>... (+{latestEvent.elementsAffected.length - 3})</div>}
                   </div>
                 </div>
              )}
            </div>
          </div>
         ) : (
           <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
              <p style={{ color: '#475569', fontSize: '11px', fontWeight: 600 }}>Sin incidentes activos en la topología</p>
           </div>
         )}
      </div>

      {/* Topology Stats */}
      <div style={{ marginTop: 'auto', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <h4 style={{ color: '#475569', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>Topología del Sistema</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Controles Afectados</span>
            </div>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{metrics.failedControlsCount}</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Riesgos Materializados</span>
            </div>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{metrics.activeRisksCount}</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Elementos Afectados</span>
            </div>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{metrics.criticalElementsCount}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
