"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../../application/SimulationProvider';

export const CriticalControlsCard: React.FC = () => {
  const { criticalControls } = useSimulationStore();

  if (criticalControls.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        minWidth: '220px',
        maxWidth: '300px',
        background: 'rgba(127, 29, 29, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        borderRadius: '16px',
        padding: '18px 20px',
        zIndex: 100,
        animation: 'criticalCardFadeIn 0.4s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '10px' }}>
        <AlertTriangle style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
        <span style={{ color: '#fef2f2', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Controles Claves
        </span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {criticalControls.map((name, i) => (
          <li
            key={i}
            style={{
              color: '#ffffff',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.2)',
              animation: 'slowBlink 3s ease-in-out infinite',
            }}
          >
            ● {name}
          </li>
        ))}
      </ul>

      <style>{`
        @keyframes criticalCardFadeIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
};
