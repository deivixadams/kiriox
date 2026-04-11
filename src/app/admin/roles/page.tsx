"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/modules/governance/ui/components/RealmEditorPanel.module.css';

/* ──────────────────── Types ──────────────────── */
type RoleRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type AssignedUser = {
  assignment_id: string;
  user_id: string;
  company_id: string;
  name: string | null;
  last_name: string | null;
  email: string;
  is_active: boolean;
};

type UserOption = {
  id: string;
  name: string | null;
  last_name: string | null;
  email: string;
};

/* ──────────── helpers ──────────── */
function emptyForm(): RoleRecord {
  return { id: '', code: '', name: '', description: '', is_active: true, created_at: '', updated_at: '' };
}

/* ════════════════════════════════════
   PAGE
═════════════════════════════════════ */
export default function RolesPage() {
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  /* ── list state ── */
  const [records, setRecords] = useState<RoleRecord[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(true);

  /* ── form state ── */
  const [form, setForm] = useState<RoleRecord>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ── assigned users ── */
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [removingId, setRemovingId] = useState('');

  /* ── assign-new-user ── */
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [addUserId, setAddUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  /* ─────────────────────────────────────────────
     LOAD ALL ROLES
  ───────────────────────────────────────────── */
  async function loadRecords(preferredId?: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/rbac');
      if (!res.ok) throw new Error('No se pudo cargar roles');
      const data: RoleRecord[] = await res.json();
      setRecords(data);

      if (data.length === 0) {
        setCursor(-1);
        setForm(emptyForm());
        setAssignedUsers([]);
        return;
      }

      const idx = preferredId ? data.findIndex((r) => r.id === preferredId) : -1;
      applyRecord(data[idx >= 0 ? idx : 0], idx >= 0 ? idx : 0);
    } catch (e: any) {
      setError(e?.message || 'Error cargando roles');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch {}
  }

  useEffect(() => {
    void loadRecords();
    void loadAllUsers();
  }, []);

  /* ─────────────────────────────────────────────
     LOAD USERS FOR CURRENT ROLE
  ───────────────────────────────────────────── */
  async function loadAssignedUsers(roleId: string) {
    if (!roleId) { setAssignedUsers([]); return; }
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/rbac?id=${encodeURIComponent(roleId)}`);
      if (!res.ok) { setAssignedUsers([]); return; }
      const data = await res.json();
      setAssignedUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      setAssignedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  /* ─────────────────────────────────────────────
     NAVIGATION
  ───────────────────────────────────────────── */
  function applyRecord(record: RoleRecord, index: number) {
    setCursor(index);
    setForm({ ...record });
    setError('');
    setSuccess('');
    void loadAssignedUsers(record.id);
  }

  const canNavigate = records.length > 0;

  function navigate(action: 'first' | 'prev' | 'next' | 'last') {
    if (!canNavigate) return;
    const cur = cursor >= 0 ? cursor : 0;
    const next =
      action === 'first'  ? 0 :
      action === 'prev'   ? Math.max(0, cur - 1) :
      action === 'next'   ? Math.min(records.length - 1, cur + 1) :
      records.length - 1;
    applyRecord(records[next], next);
  }

  function clearForNew() {
    setCursor(-1);
    setForm(emptyForm());
    setAssignedUsers([]);
    setError('');
    setSuccess('');
    setTimeout(() => codeInputRef.current?.focus(), 0);
  }

  /* ─────────────────────────────────────────────
     SAVE
  ───────────────────────────────────────────── */
  async function save() {
    setError('');
    setSuccess('');
    if (!form.code.trim()) { setError('El código del rol es obligatorio.'); return; }
    if (!form.name.trim()) { setError('El nombre del rol es obligatorio.'); return; }

    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/rbac', {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id:          form.id || undefined,
          code:        form.code,
          name:        form.name,
          description: form.description,
          isActive:    form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar el rol');

      await loadRecords(form.id || data.id);
      setSuccess('Rol guardado correctamente.');
    } catch (e: any) {
      setError(e?.message || 'Error guardando rol');
    } finally {
      setSaving(false);
    }
  }

  /* ─────────────────────────────────────────────
     DELETE ROLE
  ───────────────────────────────────────────── */
  async function deleteRole() {
    if (!form.id) { setError('No hay rol seleccionado.'); return; }
    if (!window.confirm(`¿Eliminar el rol "${form.name}"? Esta acción es irreversible.`)) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/rbac?id=${encodeURIComponent(form.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar el rol');
      await loadRecords();
      setSuccess('Rol eliminado.');
    } catch (e: any) {
      setError(e?.message || 'Error eliminando rol');
    } finally {
      setDeleting(false);
    }
  }

  /* ─────────────────────────────────────────────
     REMOVE USER FROM ROLE
  ───────────────────────────────────────────── */
  async function removeUserFromRole(assignmentId: string, userName: string) {
    if (!window.confirm(`¿Quitar el acceso de "${userName}" a este rol?`)) return;
    setRemovingId(assignmentId);
    try {
      const res = await fetch(`/api/admin/rbac?assignment_id=${encodeURIComponent(assignmentId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error removiendo usuario');
      await loadAssignedUsers(form.id);
      setSuccess(`Usuario "${userName}" removido del rol.`);
    } catch (e: any) {
      setError(e?.message || 'Error removiendo usuario');
    } finally {
      setRemovingId('');
    }
  }

  /* ─────────────────────────────────────────────
     ASSIGN USER TO ROLE
  ───────────────────────────────────────────── */
  async function assignUser() {
    if (!addUserId || !form.id) return;
    setAssigning(true);
    setError('');
    try {
      const res = await fetch('/api/admin/rbac/assign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: addUserId, roleId: form.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo asignar usuario');
      setAddUserId('');
      await loadAssignedUsers(form.id);
      setSuccess('Usuario asignado correctamente.');
    } catch (e: any) {
      setError(e?.message || 'Error asignando usuario');
    } finally {
      setAssigning(false);
    }
  }

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */
  const statusLabel = useMemo(() => {
    if (cursor < 0) return 'Nuevo registro';
    return `Registro ${cursor + 1} de ${records.length}`;
  }, [cursor, records.length]);

  const availableUsers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((u) => u.user_id));
    return allUsers.filter((u) => !assignedIds.has(u.id));
  }, [allUsers, assignedUsers]);

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  if (loading) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Administración</p>
          <h1 className={styles.title}>Gestión de Roles</h1>
        </header>
        <p style={{ color: '#94a3b8' }}>Cargando roles…</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <p className={styles.eyebrow}>Administración</p>
        <h1 className={styles.title}>Gestión de Roles</h1>
        <p className={styles.subtitle}>
          Crea, edita y elimina roles del sistema (<code>security.role</code>).
          Gestiona los usuarios asignados a cada rol.
        </p>
      </header>

      {/* ── Role editor card ── */}
      <article className={styles.card}>
        <div className={styles.statusRow}>
          <span>{statusLabel}</span>
          <button type="button" className={styles.secondaryButton}
            onClick={clearForNew} disabled={saving || loading}>
            Nuevo
          </button>
        </div>

        <label className={styles.field}>
          <span>Nombre</span>
          <input
            ref={codeInputRef}
            className={styles.input}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nombre visible del rol"
          />
        </label>

        <label className={styles.field}>
          <span>Descripción</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Descripción del rol y sus responsabilidades"
          />
        </label>

        <label className={styles.switchRow}>
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
          />
          <span>Rol activo</span>
        </label>

        {error   && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </article>

      {/* ── Assigned users (only when a role is selected) ── */}
      {form.id && (
        <article className={styles.card}>
          <div className={styles.statusRow}>
            <span style={{ fontWeight: 700 }}>
              Usuarios asignados — <em style={{ color: '#93c5fd' }}>{form.name}</em>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              {assignedUsers.length} usuario{assignedUsers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Assign new user */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <label className={styles.field} style={{ flex: 1, marginBottom: 0 }}>
              <span>Agregar usuario al rol</span>
              <select
                className={styles.input}
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                disabled={assigning}
              >
                <option value="">Seleccionar usuario…</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {[u.name, u.last_name].filter(Boolean).join(' ')} — {u.email}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void assignUser()}
              disabled={!addUserId || assigning}
              style={{ whiteSpace: 'nowrap' }}
            >
              {assigning ? 'Asignando…' : 'Asignar'}
            </button>
          </div>

          {/* User list */}
          {loadingUsers ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando usuarios…</p>
          ) : assignedUsers.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>Sin usuarios asignados a este rol.</p>
          ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
              {assignedUsers.map((u) => {
                const fullName = [u.name, u.last_name].filter(Boolean).join(' ') || u.email;
                return (
                  <div key={u.assignment_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>{fullName}</span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{u.email}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => void removeUserFromRole(u.assignment_id, fullName)}
                      disabled={removingId === u.assignment_id}
                    >
                      {removingId === u.assignment_id ? 'Removiendo…' : 'Remover'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      )}

      {/* ── Navigation + Actions (siempre al final) ── */}
      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <button type="button" className={styles.secondaryButton}
            onClick={() => navigate('first')}
            disabled={saving || !canNavigate || cursor <= 0}>
            Primero
          </button>
          <button type="button" className={styles.secondaryButton}
            onClick={() => navigate('prev')}
            disabled={saving || !canNavigate || cursor <= 0}>
            Anterior
          </button>
          <button type="button" className={styles.secondaryButton}
            onClick={() => navigate('next')}
            disabled={saving || !canNavigate || cursor >= records.length - 1 || cursor < 0}>
            Siguiente
          </button>
          <button type="button" className={styles.secondaryButton}
            onClick={() => navigate('last')}
            disabled={saving || !canNavigate || cursor >= records.length - 1}>
            Final
          </button>
        </div>

        <div className={styles.actionsRight}>
          <button type="button" className={styles.secondaryButton}
            onClick={() => router.push('/score/dashboard')}>
            Cerrar
          </button>
          <button type="button" className={styles.deleteButton}
            onClick={() => void deleteRole()}
            disabled={deleting || saving || !form.id}>
            {deleting ? 'Eliminando…' : 'Eliminar Rol'}
          </button>
          <button type="button" className={styles.primaryButton}
            onClick={() => void save()} disabled={saving || loading}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </section>
  );
}
