import { NextResponse } from 'next/server';
import { withModuleAccess } from '@/shared/http';
import { getDashboard2TopHandler } from '@/modules/structural-risk/api/handlers/getDashboard2TopHandler';

export const GET = withModuleAccess('structural-risk', 'risk.structural.read', async function GET() {
  try {
    return await getDashboard2TopHandler();
  } catch (error: any) {
    console.error('Error fetching dashboard2 top rankings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
