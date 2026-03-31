import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AuditoriaWizardPage() {
  redirect('/validacion/riesgo-lineal/nueva');
}
