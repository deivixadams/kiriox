'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Save, Shield, Users, 
  Trash2, Plus, UserPlus, AlertCircle
} from 'lucide-react';

interface RoleUser {
  assignment_id: string;
  user_id: string;
  name: string | null;
  last_name: string | null;
  email: string;
}

interface RoleEditorModalProps {
  role: any | null; 
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function RoleEditorModal({ role, isOpen, onClose, onSave }: RoleEditorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [assignedUsers, setAssignedUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'users'>('details');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role && isOpen) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        isActive: role.is_active ?? true
      });
      fetchAssignedUsers(role.id);
      fetchAllUsers();
    } else {
      setFormData({ name: '', description: '', isActive: true });
      setAssignedUsers([]);
    }
    setActiveTab('details');
    setError(null);
  }, [role, isOpen]);

  async function fetchAssignedUsers(roleId: string) {
    try {
      const res = await fetch(`/api/admin/rbac?id=${roleId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.users) {
        setAssignedUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching role users:', err);
    }
  }

  async function fetchAllUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  }

  const handleAssignUser = async () => {
    if (!selectedUserId || !role?.id) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/rbac/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, roleId: role.id }),
      });
      if (!res.ok) throw new Error('Error al asignar');
      setSelectedUserId('');
      fetchAssignedUsers(role.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveUser = async (assignmentId: string) => {
    if (!window.confirm('¿Quitar este usuario del rol?')) return;
    try {
      const res = await fetch(`/api/admin/rbac?assignment_id=${assignmentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al remover');
      if (role?.id) fetchAssignedUsers(role.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateCode = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const code = generateCode(formData.name);
      if (!code) throw new Error("El nombre no genera un código válido.");
      
      await onSave({ 
        ...formData, 
        id: role?.id,
        code: role ? undefined : code 
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = allUsers.filter(u => 
    !assignedUsers.some(au => au.user_id === u.id)
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '650px',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        background: 'rgba(30, 41, 59, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
              <Shield size={24} style={{ color: 'var(--primary)' }} />
              {role ? 'Configurar Rol' : 'Nuevo Rol de Sistema'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        {role && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0,0,0,0.1)' }}>
            <button
               onClick={() => setActiveTab('details')}
               style={{
                 flex: 1, padding: '1rem', border: 'none', background: 'none', cursor: 'pointer',
                 fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                 color: activeTab === 'details' ? 'var(--primary)' : 'var(--secondary)',
                 borderBottom: activeTab === 'details' ? '3px solid var(--primary)' : '3px solid transparent',
               }}
            >
              General
            </button>
            <button
               onClick={() => setActiveTab('users')}
               style={{
                 flex: 1, padding: '1rem', border: 'none', background: 'none', cursor: 'pointer',
                 fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                 color: activeTab === 'users' ? 'var(--primary)' : 'var(--secondary)',
                 borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : '3px solid transparent',
               }}
            >
              Miembros ({assignedUsers.length})
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {activeTab === 'details' ? (
            <form id="role-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>Nombre del Rol</label>
                  <input 
                    type="text"
                    required
                    style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>Descripción</label>
                  <textarea 
                    rows={4}
                    style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'white', outline: 'none', resize: 'none' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <input 
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" style={{ cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Rol Activo</label>
               </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>Vincular Usuario</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                     <select 
                       style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                       value={selectedUserId}
                       onChange={(e) => setSelectedUserId(e.target.value)}
                     >
                        <option value="">Seleccionar...</option>
                        {availableUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} {u.last_name || ''} ({u.email})</option>
                        ))}
                     </select>
                     <button 
                       onClick={handleAssignUser}
                       disabled={!selectedUserId || assigning}
                       style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '10px', fontWeight: 900 }}
                     >
                        {assigning ? '...' : 'Vincular'}
                     </button>
                  </div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {assignedUsers.map(user => (
                    <div key={user.assignment_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div>
                          <p style={{ fontWeight: 700, margin: 0, color: 'white' }}>{user.name} {user.last_name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', margin: 0 }}>{user.email}</p>
                       </div>
                       <button onClick={() => handleRemoveUser(user.assignment_id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'flex-end', gap: '1.25rem' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontWeight: 800 }}>
            Cancelar
          </button>
          {activeTab === 'details' && (
            <button 
              type="submit"
              form="role-form"
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.8rem 2.5rem', borderRadius: '10px', fontWeight: 900 }}
            >
              {loading ? '...' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
