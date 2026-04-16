import { NextResponse } from 'next/server';
import { withModuleAccess } from '@/shared/http';
import { getDashboard2OverviewHandler } from '@/modules/structural-risk/api/handlers/getDashboard2OverviewHandler';

export const GET = withModuleAccess('structural-risk', 'risk.structural.read', async function GET() {
  try {
    return await getDashboard2OverviewHandler();
  } catch (error: any) {
    console.error('Error fetching dashboard2 overview:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
