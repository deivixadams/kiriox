import { Suspense } from 'react';
import AuditoriaWizardClient from './AuditoriaWizardClient';

export const dynamic = 'force-dynamic';

export default function AuditoriaWizardPage() {
  return (
    <Suspense fallback={null}>
      <AuditoriaWizardClient />
    </Suspense>
  );
}
