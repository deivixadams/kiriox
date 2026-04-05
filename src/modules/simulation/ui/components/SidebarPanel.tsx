"use client";

import React from 'react';
import { Activity, ShieldAlert, Zap, ActivitySquare, RotateCcw, Terminal } from 'lucide-react';
import { useSimulationStore } from '../../application/SimulationProvider';
import { MetricCard } from './MetricCard';
import { CONFIG } from '../../domain/AnalyticsEngine';
import styles from '../SimulationSystem.module.css';

export const SidebarPanel: React.FC = () => {
  const { metrics, resetSimulation, events } = useSimulationStore();
  
  // Get latest event data
  const latestEvent = events.length > 0 ? events[0] : null;
  
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
            Restablecer
          </button>
          <button 
            style={{ padding: '10px 14px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)', cursor: 'pointer' }}
          >
            Wave Tool
          </button>
        </div>
      </div>

      {/* Real-time Metrics Panels (Matching the provided UI) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MetricCard 
          title="Índice de Fragilidad" 
          value={metrics.structuralFragility.toFixed(1)} 
          suffix="%"
          icon={<Activity style={{ width: '18px', height: '18px' }} />} 
          alert={isFragile}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <MetricCard 
            title="Exposición" 
            value={metrics.linearExposure} 
            icon={<Zap style={{ width: '16px', height: '16px' }} />} 
          />
          <MetricCard 
            title="Fallos Activos" 
            value={metrics.failedControlsCount} 
            icon={<ShieldAlert style={{ width: '16px', height: '16px' }} />} 
            alert={hasFailures}
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
                <p style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>● {latestEvent.controlId} (FALLIDO)</p>
              </div>

              {latestEvent.risksMaterialized.length > 0 && (
                 <div style={{ paddingLeft: '10px', borderLeft: '2px solid #f97316' }}>
                   <p style={{ color: '#f97316', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Riesgos Emitidos</p>
                   <p style={{ color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.4, margin: 0 }}>{latestEvent.risksMaterialized.slice(0, 3).join(', ')}...</p>
                 </div>
              )}

              {latestEvent.elementsAffected.length > 0 && (
                 <div style={{ paddingLeft: '10px', borderLeft: '2px solid #fbbf24' }}>
                   <p style={{ color: '#fbbf24', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Unidades Afectadas</p>
                   <p style={{ color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.4, margin: 0 }}>{latestEvent.elementsAffected.slice(0, 3).join(', ')}...</p>
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
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Capa de Controles</span>
            </div>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{CONFIG.counts.controls}</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Capa de Riesgos</span>
            </div>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{CONFIG.counts.risks}</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Capa Base</span>
            </div>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{CONFIG.counts.elements}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
