import { Suspense } from 'react';
import RiesgoLinealWizardClient from './riesgo-lineal-wizard/RiesgoLinealWizardClient';

export default function RiesgoLinealWizardNewPage() {
  return (
    <Suspense fallback={null}>
      <RiesgoLinealWizardClient />
    </Suspense>
  );
}
