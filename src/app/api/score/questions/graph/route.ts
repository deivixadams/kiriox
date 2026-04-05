import { NextResponse } from 'next/server';
import { withModuleAccess } from '@/shared/http';
import { getFullQuestionGraphHandler } from '@/modules/structural-risk/api/handlers/questionGraphHandlers';

export const GET = withModuleAccess('structural-risk', 'risk.structural.read', async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'full';
    if (mode !== 'full') {
      return NextResponse.json({ error: 'Unsupported graph mode' }, { status: 400 });
    }
    const elements = await getFullQuestionGraphHandler(request);
    return NextResponse.json({ elements });
  } catch (error: any) {
    console.error('Error loading question graph:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
