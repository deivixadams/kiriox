import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { getAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [emergingSources, emergingStatuses, riskFactors, operationalEventTypes] = await Promise.all([
      prisma.$queryRaw<{ id: string; code: string; name: string }[]>`
        SELECT id::text, code, name
        FROM core.risk_emerging_source
        WHERE is_active = true
        ORDER BY sort_order ASC
      `,
      prisma.$queryRaw<{ id: string; code: string; name: string }[]>`
        SELECT id::text, code, name
        FROM core.risk_emerging_status
        WHERE is_active = true
        ORDER BY sort_order ASC
      `,
      prisma.$queryRaw<{ id: string; code: string; name: string }[]>`
        SELECT id::text, code, name
        FROM core.risk_factor
        WHERE is_active = true
        ORDER BY sort_order ASC
      `,
      prisma.$queryRaw<{ id: string; code: string; name: string }[]>`
        SELECT id::text, code, name
        FROM core.operational_risk_loss_event_type
        WHERE is_active = true
        ORDER BY sort_order ASC
      `,
    ]);

    return NextResponse.json({
      risk_emerging_source: emergingSources,
      risk_emerging_status: emergingStatuses,
      risk_factor: riskFactors,
      operational_risk_loss_event_type: operationalEventTypes,
    });
  } catch (error) {
    console.error('Error fetching risk classifications:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los catálogos de riesgo.' }, { status: 500 });
  }
}
