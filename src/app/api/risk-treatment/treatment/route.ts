import { getAuthContext } from '@/lib/auth-server';
import { getRiskTreatmentsHandler, postRiskTreatmentHandler } from '@/modules/risk-treatment/api/handlers/riskTreatmentHandlers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return await getRiskTreatmentsHandler(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return await postRiskTreatmentHandler(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
