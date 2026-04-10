"use client";

import Link from 'next/link';

export default function GovernanceDominioPage() {
  return (
    <section style={{ display: 'grid', gap: '20px', padding: '20px' }}>
      <header>
        <p style={{ color: '#67e8f9', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Paso 2 de Gobernanza</p>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', margin: '0' }}>Dominio</h1>
        <p style={{ color: '#94a3b8', margin: '10px 0' }}>Establece los dominios aplicables para el marco seleccionado.</p>
      </header>

      <article style={{ 
        border: '1px solid rgba(148, 163, 184, 0.28)', 
        background: 'rgba(15, 23, 42, 0.52)', 
        padding: '20px', 
        borderRadius: '14px' 
      }}>
        <h2 style={{ color: '#f8fafc' }}>Configuración de Dominio</h2>
        <p style={{ color: '#cbd5e1' }}>Esta pantalla está en desarrollo (Placeholder para Paso 2).</p>
      </article>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Link href="/modelo/gobernanza/company-reino" style={{ 
          border: '1px solid rgba(148, 163, 184, 0.45)', 
          background: 'rgba(30, 41, 59, 0.55)', 
          color: '#e2e8f0', 
          padding: '10px 14px', 
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: '600'
        }}>
          Anterior
        </Link>
        <Link href="/score/dashboard" style={{ 
          border: '1px solid rgba(148, 163, 184, 0.45)', 
          background: 'rgba(30, 41, 59, 0.55)', 
          color: '#e2e8f0', 
          padding: '10px 14px', 
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: '600'
        }}>
          Cerrar
        </Link>
      </div>
    </section>
  );
}
