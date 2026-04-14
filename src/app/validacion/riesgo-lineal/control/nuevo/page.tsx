import { Suspense } from 'react';
import ControlNewPage from '@/modules/linear-risk/ui/pages/ControlNewPage';

export const dynamic = 'force-dynamic';

export default function ControlNewRoute() {
  return (
    <Suspense fallback={null}>
      <ControlNewPage />
    </Suspense>
  );
}
