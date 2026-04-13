"use client";

import { useEffect, useState } from 'react';
import { Building, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Mapping = {
  id: string;
  realmName: string;
};

type Company = {
  id: string;
  code: string;
  name: string;
  mappings: Mapping[];
};

export function CompanyDeletePanel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  async function loadData() {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/company-management/delete');
      const data = await resp.json();
      setCompanies(data.companies || []);
    } catch (err) {
      setMessage({ text: 'Error al cargar empresas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  async function handleDelete() {
    if (!selectedCompanyId) return;
    if (!confirm('¿Estás seguro de eliminar esta empresa y sus mapeos? Esta acción no se puede deshacer.')) return;

    setDeleting(true);
    setMessage({ text: '', type: '' });

    try {
      const resp = await fetch(`/api/admin/company-management/delete?companyId=${selectedCompanyId}`, {
        method: 'DELETE'
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Error al eliminar');

      setMessage({ text: 'Empresa eliminada físicamente con éxito', type: 'success' });
      setSelectedCompanyId('');
      void loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error en la eliminación', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Link href="/admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Gestión de Empresas</h1>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Seleccionar Empresa
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="glass-input"
              style={{ padding: '12px', width: '100%', maxWidth: '500px' }}
              disabled={loading || deleting}
            >
              <option value="">-- Escoge una empresa --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={20} className="text-primary" /> 
                Mapeos de Reino (Macroprocesos)
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: '1rem'
              }}>
                {selectedCompany.mappings.length > 0 ? (
                  selectedCompany.mappings.map(m => (
                    <div key={m.id} className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.realmName}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Sin mapeos activos</p>
                )}
              </div>

              <div style={{ 
                marginTop: '3rem', 
                padding: '2rem', 
                borderRadius: '12px', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                  <h4 style={{ color: '#ef4444', fontSize: '1.2rem', margin: 0 }}>Zona de Peligro</h4>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Esta acción eliminará de forma permanente la empresa y todos sus vínculos de gobernanza.
                  </p>
                </div>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="crud-button"
                  style={{ 
                    backgroundColor: '#ef4444', 
                    color: 'white',
                    padding: '15px 40px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    width: '100%',
                    maxWidth: '300px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {deleting ? 'Eliminando...' : 'ELIMINAR EMPRESA'}
                </button>
              </div>
            </div>
          )}

          {message.text && (
            <div className={`animate-fade-in`} style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              marginTop: '1rem',
              textAlign: 'center',
              backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`,
              color: message.type === 'error' ? '#f87171' : '#34d399'
            }}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
