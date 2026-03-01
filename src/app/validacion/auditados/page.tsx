"use client";

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CompanyRow = {
  id: string;
  name: string;
  code: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
};

export default function AuditadosPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/companies');
        if (res.status === 401 || res.status === 403) {
          router.replace('/login');
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'No se pudo cargar empresas.');
        }
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar empresas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Building2 className="text-primary" />
        <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Auditados</h1>
      </div>

      {loading && (
        <div className="glass-card" style={{ textAlign: 'center' }}>
          Cargando auditados...
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Codigo</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                    No hay auditados registrados.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{company.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--muted)' }}>{company.code}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: company.statusId === 1 ? '#34d399' : '#f87171',
                        background: company.statusId === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(248, 113, 113, 0.15)'
                      }}>
                        {company.statusId === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
