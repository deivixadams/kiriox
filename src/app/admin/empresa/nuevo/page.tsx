import { Suspense } from 'react';
import EmpresaNuevoClient from './EmpresaNuevoClient';

export const dynamic = 'force-dynamic';

export default function EmpresaNuevoPage() {
    return (
        <Suspense fallback={null}>
            <EmpresaNuevoClient />
        </Suspense>
    );
}
