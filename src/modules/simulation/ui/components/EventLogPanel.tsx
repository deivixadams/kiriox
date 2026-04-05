"use client";

import React from 'react';
import { Activity, Terminal } from 'lucide-react';
import { useSimulationStore } from '../../application/SimulationProvider';
import styles from '../SimulationSystem.module.css';

export const EventLogPanel: React.FC = () => {
  const { events } = useSimulationStore();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          <Terminal style={{ width: '16px', height: '16px', color: '#10b981' }} />
          Trazabilidad de Carga
        </h4>
        <span style={{ padding: '2px 8px', borderRadius: '99px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          LIVE
        </span>
      </div>
      
      <div className={`${styles.eventLog} ${styles.customScrollbar}`}>
        {events.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', opacity: 0.3 }}>
            <Activity style={{ width: '48px', height: '48px', color: '#475569', marginBottom: '8px' }} />
            <p style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>Escuchando propagación...</p>
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className={styles.eventCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', paddingBottom: '8px' }}>
                <span style={{ color: '#10b981', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}>● {ev.controlId} (FALLO)</span>
                <span style={{ color: '#475569', fontSize: '9px', fontFamily: 'monospace' }}>{ev.time.toLocaleTimeString()}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ev.risksMaterialized.length > 0 ? (
                   <div style={{ paddingLeft: '12px', borderLeft: '2px solid rgba(239, 68, 68, 0.5)' }}>
                     <p style={{ color: '#f87171', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '4px', opacity: 0.8, margin: 0 }}>Riesgos Emitidos</p>
                     <p style={{ color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.5, margin: 0 }}>{ev.risksMaterialized.join(', ')}</p>
                   </div>
                ) : (
                   <div style={{ paddingLeft: '12px', borderLeft: '2px solid #334155' }}>
                     <p style={{ color: '#64748b', fontSize: '9px', fontStyle: 'italic', margin: 0 }}>Redundancia de control verificada.</p>
                   </div>
                )}

                {ev.elementsAffected.length > 0 && (
                   <div style={{ paddingLeft: '12px', borderLeft: '2px solid rgba(251, 191, 36, 0.5)' }}>
                     <p style={{ color: '#fbbf24', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '4px', opacity: 0.8, margin: 0 }}>Impacto Estructural</p>
                     <p style={{ color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.5, margin: 0 }}>{ev.elementsAffected.join(', ')}</p>
                   </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
        <div style={{ padding: '12px', backgroundColor: 'rgba(127, 29, 29, 0.1)', borderRadius: '8px', border: '1px solid rgba(127, 29, 29, 0.2)' }}>
          <p style={{ fontSize: '10px', color: '#fca5a5', lineHeight: 1.4, margin: 0 }}>
            <strong>ADVERTENCIA:</strong> Los impactos estructurales recalculan la exposición en tiempo real basándose en la topología de grafo guardada.
          </p>
        </div>
      </div>
    </div>
  );
};
