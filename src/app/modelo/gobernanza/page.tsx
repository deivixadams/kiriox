import { GovernanceCloseButton } from '@/shared/ui/GovernanceCloseButton';

export default function Page() {
  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <GovernanceCloseButton />
      <article
        style={{
          border: '1px solid rgba(148, 163, 184, 0.35)',
          borderRadius: '14px',
          padding: '1.2rem',
          background: 'rgba(15, 23, 42, 0.55)',
          color: '#e2e8f0',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>License Management deshabilitado</h1>
        <p style={{ margin: 0, color: '#94a3b8' }}>
          Esta funcionalidad no está en uso por ahora. Las rutas de licencia fueron desactivadas temporalmente.
        </p>
      </article>
    </section>
  );
}
