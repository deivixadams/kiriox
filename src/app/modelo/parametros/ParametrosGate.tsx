'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default function ParametrosGate({ children }: Props) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!confirmed) {
      document.body.classList.add('parametros-gate');
      return () => {
        document.body.classList.remove('parametros-gate');
      };
    }
    document.body.classList.remove('parametros-gate');
    return;
  }, [confirmed]);

  if (confirmed) return <>{children}</>;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at 20% 20%, rgba(244, 63, 94, 0.12), rgba(2, 6, 23, 0.92) 55%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          border: '1px solid rgba(244, 63, 94, 0.45)',
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.16), rgba(15, 23, 42, 0.55))',
          padding: '3rem',
          width: '100%',
          maxWidth: '1100px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        <h2
          style={{
            fontSize: '1.6rem',
            color: '#f43f5e',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          <ShieldCheck size={22} /> Integridad Estructural
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'var(--foreground)', lineHeight: '1.8', margin: 0, fontWeight: 600 }}>
          Este módulo controla la calibración institucional. Cualquier modificación impacta
          directamente en la generación de <strong>ModelRuns</strong> futuros. Los runs pasados
          están protegidos por firmas criptográficas vinculadas a estas versiones.
        </p>
        <p style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--muted)', lineHeight: '1.7' }}>
          Antes de continuar, confirma que entiendes el impacto operativo y regulatorio de estos cambios.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2.5rem',
            justifyContent: 'flex-end',
          }}
        >
          <button className="ghost-button" style={{ borderColor: 'rgba(244,63,94,0.35)' }} onClick={() => router.back()}>
            Retornar
          </button>
          <button className="btn-primary" style={{ background: '#f43f5e' }} onClick={() => setConfirmed(true)}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
