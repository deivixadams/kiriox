import { getAuthContext } from '@/lib/auth-server';
import { getRisksByProcessHandler } from '@/modules/risk-treatment/api/handlers/riskTreatmentHandlers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return await getRisksByProcessHandler(request);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
