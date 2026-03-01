import { ClipboardCheck } from 'lucide-react';

export default function ChecklistsPage() {
  return (
    <div className="animate-fade-in">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ClipboardCheck className="text-primary" />
        <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Checklists</h1>
      </div>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        Gestion de checklists para auditorias y validaciones.
      </div>
    </div>
  );
}
