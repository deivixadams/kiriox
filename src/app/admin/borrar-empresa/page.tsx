import React from 'react';
import { CompanyDeletePanel } from '@/modules/admin/ui/components/CompanyDeletePanel';

export const metadata = {
  title: 'Gestión de Empresas | Kiriox Admin',
  description: 'Herramienta administrativa para la eliminación física de empresas y mapeos de gobernanza.',
};

export default function CompanyDeletePage() {
  return (
    <main className="animate-fade-in">
      <CompanyDeletePanel />
    </main>
  );
}
