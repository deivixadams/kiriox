import { Suspense } from 'react';
import AuditoriaWizardClient from './audit-wizard/AuditoriaWizardClient';

export default function AuditWizardNewPage() {
  return (
    <Suspense fallback={null}>
      <AuditoriaWizardClient />
    </Suspense>
  );
}

